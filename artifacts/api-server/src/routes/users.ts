import { Router } from "express";
import { db, usersTable, studentProfilesTable, professorsTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { role, page = "1", limit = "20" } = req.query as any;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  let query = db.select().from(usersTable);
  const users = await db.select().from(usersTable).offset(offset).limit(limitNum);
  const filtered = role ? users.filter(u => u.role === role) : users;

  res.json({
    users: filtered.map(u => ({ ...u, passwordHash: undefined })),
    total: filtered.length,
    page: pageNum,
    limit: limitNum,
  });
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  let studentProfile = null;
  let professorProfile = null;

  if (user.role === "student") {
    const [sp] = await db.select().from(studentProfilesTable).where(eq(studentProfilesTable.userId, user.id));
    studentProfile = sp || null;
  } else if (user.role === "professor") {
    const [pp] = await db.select().from(professorsTable).where(eq(professorsTable.userId, user.id));
    professorProfile = pp ? { ...pp, fullName: user.fullName, profilePhoto: user.profilePhoto, city: user.city } : null;
  }

  res.json({ ...user, passwordHash: undefined, studentProfile, professorProfile });
});

router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { fullName, city, profilePhoto, gradeLevel, schoolName, preferredSubjects, subjects, gradeLevels, yearsOfExperience, bio, qualifications } = req.body;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await db.update(usersTable).set({
    fullName: fullName || user.fullName,
    city: city !== undefined ? city : user.city,
    profilePhoto: profilePhoto !== undefined ? profilePhoto : user.profilePhoto,
  }).where(eq(usersTable.id, id));

  if (user.role === "student" && (gradeLevel || schoolName || preferredSubjects)) {
    const [sp] = await db.select().from(studentProfilesTable).where(eq(studentProfilesTable.userId, id));
    if (sp) {
      await db.update(studentProfilesTable).set({
        gradeLevel: gradeLevel || sp.gradeLevel,
        schoolName: schoolName || sp.schoolName,
        preferredSubjects: preferredSubjects || sp.preferredSubjects,
      }).where(eq(studentProfilesTable.userId, id));
    }
  }

  if (user.role === "professor" && (subjects || gradeLevels || bio || qualifications || yearsOfExperience !== undefined)) {
    const [pp] = await db.select().from(professorsTable).where(eq(professorsTable.userId, id));
    if (pp) {
      await db.update(professorsTable).set({
        subjects: subjects || pp.subjects,
        gradeLevels: gradeLevels || pp.gradeLevels,
        bio: bio !== undefined ? bio : pp.bio,
        qualifications: qualifications !== undefined ? qualifications : pp.qualifications,
        yearsOfExperience: yearsOfExperience !== undefined ? yearsOfExperience : pp.yearsOfExperience,
      }).where(eq(professorsTable.userId, id));
    }
  }

  const [updated] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  res.json({ ...updated, passwordHash: undefined });
});

export default router;
