import { Router } from "express";
import { db, usersTable, professorsTable, studentProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, generateToken, requireAuth } from "../lib/auth";

const router = Router();

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

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const hashedPassword = hashPassword(password);
  if (user.passwordHash !== hashedPassword) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = generateToken(user.id);

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

router.post("/register", async (req, res) => {
  const { email, password, role, fullName, city, phone, subjects, gradeLevels, bio, qualifications, yearsExperience, gradeLevel, schoolName } = req.body;

  if (!email || !password || !role || !fullName) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const [newUser] = await db.insert(usersTable).values({
    email,
    passwordHash: hashPassword(password),
    role,
    fullName,
    city: city || null,
    phone: phone || null,
  }).returning();

  let professorProfile = null;
  let studentProfile = null;

  if (role === "student") {
    const [sp] = await db.insert(studentProfilesTable).values({
      userId: newUser.id,
      preferredSubjects: [],
      gradeLevel: gradeLevel || null,
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
      status: "pending",
      isVerified: false,
      totalReviews: 0,
      totalStudents: 0,
    }).returning();
    professorProfile = pp ? { ...pp, fullName: newUser.fullName, city: newUser.city } : null;
  }

  const token = generateToken(newUser.id);
  res.json({
    user: { ...newUser, passwordHash: undefined, studentProfile, professorProfile },
    token,
  });
});

router.post("/logout", (_req, res) => {
  res.json({ success: true });
});

export default router;
