import { Router } from "express";
import { db, usersTable, professorsTable, studentProfilesTable, emailVerificationsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import {
  hashPassword,
  generateToken,
  requireAuth,
  verifyPassword,
  isLegacyPasswordHash,
} from "../lib/auth";
import { logEvent } from "../lib/auditLog";
import { sendVerificationEmail, isSmtpConfigured } from "../lib/email";
import { randomBytes } from "crypto";

function generateMerchantId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "ETD-";
  const bytes = randomBytes(8);
  for (let i = 0; i < 8; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

async function getUniqueMerchantId(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const id = generateMerchantId();
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.merchantId, id));
    if (!existing) return id;
  }
  throw new Error("Could not generate unique merchant ID");
}

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const ALLOWED_ROLES = ["student", "professor"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

router.get("/me", requireAuth, async (req, res) => {
  const user = (req as any).user;
  let studentProfile = null;
  let professorProfile = null;

  if (user.role === "student") {
    const [sp] = await db.select().from(studentProfilesTable).where(eq(studentProfilesTable.userId, user.id));
    studentProfile = sp || null;
  } else if (user.role === "professor") {
    const [pp] = await db.select().from(professorsTable).where(eq(professorsTable.userId, user.id));
    professorProfile = pp ? {
      ...pp,
      fullName: user.fullName,
      profilePhoto: user.profilePhoto,
      city: user.city,
    } : null;
  }

  res.json({
    ...user,
    passwordHash: undefined,
    studentProfile,
    professorProfile,
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (!EMAIL_RE.test(normalizedEmail)) {
    res.status(400).json({ error: "Invalid email format" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
  // Use same error message whether email is wrong or password is wrong (prevents user enumeration)
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    await logEvent(req, "login_failed", "user", user.id, null, { email: normalizedEmail });
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (user.isSuspended) {
    await logEvent(req, "login_blocked_suspended", "user", user.id, null, { email: normalizedEmail });
    res.status(403).json({ error: "Your account has been suspended. Please contact support." });
    return;
  }

  // Silently upgrade legacy SHA-256 hash to bcrypt on successful login
  if (isLegacyPasswordHash(user.passwordHash)) {
    const newHash = await hashPassword(password);
    await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, user.id));
  }

  const token = generateToken(user.id);

  await logEvent(req, "user_login", "user", user.id, user.id, {
    email: user.email, role: user.role,
  });

  let studentProfile = null;
  let professorProfile = null;

  if (user.role === "student") {
    const [sp] = await db.select().from(studentProfilesTable).where(eq(studentProfilesTable.userId, user.id));
    studentProfile = sp || null;
  } else if (user.role === "professor") {
    const [pp] = await db.select().from(professorsTable).where(eq(professorsTable.userId, user.id));
    professorProfile = pp ? { ...pp, fullName: user.fullName, profilePhoto: user.profilePhoto, city: user.city } : null;
  }

  res.json({
    user: { ...user, passwordHash: undefined, studentProfile, professorProfile },
    token,
  });
});

// POST /api/auth/send-code — send a 6-digit OTP to email
router.post("/send-code", async (req, res) => {
  const { email } = req.body;
  if (!email || !EMAIL_RE.test(email.toLowerCase().trim())) {
    res.status(400).json({ error: "Email invalide" }); return;
  }
  const normalizedEmail = email.toLowerCase().trim();

  // Check email not already registered
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
  if (existing) {
    res.status(400).json({ error: "Cette adresse email est déjà utilisée" }); return;
  }

  // Invalidate previous codes for this email
  await db.update(emailVerificationsTable)
    .set({ used: true })
    .where(eq(emailVerificationsTable.email, normalizedEmail));

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.insert(emailVerificationsTable).values({ email: normalizedEmail, code, expiresAt });

  await sendVerificationEmail(normalizedEmail, code);

  // In dev mode (no SMTP), return the code so the UI can display it
  const devCode = isSmtpConfigured() ? undefined : code;
  res.json({ success: true, message: "Code envoyé", devCode });
});

// POST /api/auth/verify-code — verify the OTP
router.post("/verify-code", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    res.status(400).json({ error: "Email et code requis" }); return;
  }
  const normalizedEmail = email.toLowerCase().trim();
  const now = new Date();

  const [verification] = await db.select().from(emailVerificationsTable)
    .where(and(
      eq(emailVerificationsTable.email, normalizedEmail),
      eq(emailVerificationsTable.code, String(code)),
      eq(emailVerificationsTable.used, false),
      gt(emailVerificationsTable.expiresAt, now),
    ));

  if (!verification) {
    res.status(400).json({ error: "Code incorrect ou expiré" }); return;
  }

  // Mark as used
  await db.update(emailVerificationsTable).set({ used: true }).where(eq(emailVerificationsTable.id, verification.id));

  res.json({ success: true, verified: true });
});

router.post("/register", async (req, res) => {
  const {
    email, password, role, fullName, city, phone,
    subjects, gradeLevels, bio, qualifications, yearsExperience, currentSchool,
    gradeLevel, schoolName,
  } = req.body;

  if (!email || !password || !role || !fullName) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (typeof email !== "string" || typeof password !== "string" ||
      typeof role !== "string" || typeof fullName !== "string") {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (!EMAIL_RE.test(normalizedEmail)) {
    res.status(400).json({ error: "Invalid email format" });
    return;
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    return;
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    res.status(400).json({ error: "Password is too long" });
    return;
  }

  if (fullName.trim().length === 0 || fullName.length > 200) {
    res.status(400).json({ error: "Invalid full name" });
    return;
  }

  // Prevent self-registration as admin
  if (!ALLOWED_ROLES.includes(role as AllowedRole)) {
    res.status(400).json({ error: "Invalid role. Must be 'student' or 'professor'" });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
  if (existing) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const merchantId = await getUniqueMerchantId();

  const [newUser] = await db.insert(usersTable).values({
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    role: role as AllowedRole,
    fullName: fullName.trim(),
    city: city || null,
    phone: phone || null,
    merchantId,
    emailVerified: true, // email was verified via OTP before calling register
  }).returning();

  let professorProfile = null;
  let studentProfile = null;

  if (role === "student") {
    const { educationSection } = req.body;
    const [sp] = await db.insert(studentProfilesTable).values({
      userId: newUser.id,
      preferredSubjects: [],
      gradeLevel: gradeLevel || null,
      educationSection: educationSection || null,
      schoolName: schoolName || null,
    }).returning();
    studentProfile = sp;
  } else if (role === "professor") {
    const [pp] = await db.insert(professorsTable).values({
      userId: newUser.id,
      subjects: subjects || [],
      gradeLevels: gradeLevels || [],
      bio: bio || null,
      qualifications: qualifications || null,
      yearsOfExperience: yearsExperience ? parseInt(yearsExperience) : null,
      currentSchool: currentSchool || null,
      status: "pending",
      isVerified: false,
      totalReviews: 0,
      totalStudents: 0,
    }).returning();
    professorProfile = pp ? { ...pp, fullName: newUser.fullName, city: newUser.city } : null;
  }

  const token = generateToken(newUser.id);

  await logEvent(req, "user_registered", "user", newUser.id, newUser.id, {
    email: newUser.email, role: newUser.role, fullName: newUser.fullName,
  });

  res.json({
    user: { ...newUser, passwordHash: undefined, studentProfile, professorProfile },
    token,
  });
});

router.post("/change-password", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current password and new password are required" });
    return;
  }

  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({ error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    return;
  }

  if (newPassword.length > MAX_PASSWORD_LENGTH) {
    res.status(400).json({ error: "New password is too long" });
    return;
  }

  // Fetch user's current password hash from DB
  const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.id));
  if (!dbUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const passwordValid = await verifyPassword(currentPassword, dbUser.passwordHash);
  if (!passwordValid) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  const newHash = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, user.id));

  res.json({ success: true });
});

router.post("/logout", (_req, res) => {
  res.json({ success: true });
});

// Backfill merchant IDs for existing users (one-time admin endpoint)
router.post("/backfill-merchant-ids", requireAuth, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== "admin" && user.role !== "super_admin") {
    res.status(403).json({ error: "Admin only" }); return;
  }
  const usersWithoutId = await db.select().from(usersTable).where(eq(usersTable.merchantId, null as any));
  let count = 0;
  for (const u of usersWithoutId) {
    const mid = await getUniqueMerchantId();
    await db.update(usersTable).set({ merchantId: mid }).where(eq(usersTable.id, u.id));
    count++;
  }
  res.json({ updated: count });
});

export default router;
