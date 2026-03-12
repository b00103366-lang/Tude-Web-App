import { Router } from "express";
import { db, classesTable, professorsTable, usersTable, liveSessionsTable, enrollmentsTable, materialsTable, quizzesTable, testsTable, assignmentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

async function enrichClass(cls: any) {
  const profRows = await db.select({ prof: professorsTable, user: usersTable })
    .from(professorsTable)
    .innerJoin(usersTable, eq(professorsTable.userId, usersTable.id))
    .where(eq(professorsTable.id, cls.professorId));
  
  const prof = profRows[0];
  const professor = prof ? {
    ...prof.prof,
    fullName: prof.user.fullName,
    profilePhoto: prof.user.profilePhoto,
    city: prof.user.city,
  } : null;

  const sessions = await db.select().from(liveSessionsTable)
    .where(eq(liveSessionsTable.classId, cls.id));
  
  const nextSession = sessions
    .filter(s => s.status === "scheduled" || s.status === "live")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0] || null;

  return { ...cls, professor, nextSession };
}

router.get("/", async (req, res) => {
  const { subject, gradeLevel, city, professorId, minPrice, maxPrice, search, page = "1", limit = "20" } = req.query as any;

  let allClasses = await db.select().from(classesTable).where(eq(classesTable.isPublished, true));

  if (subject) allClasses = allClasses.filter(c => c.subject === subject);
  if (gradeLevel) allClasses = allClasses.filter(c => c.gradeLevel === gradeLevel);
  if (city) allClasses = allClasses.filter(c => c.city.toLowerCase().includes(city.toLowerCase()));
  if (professorId) allClasses = allClasses.filter(c => c.professorId === parseInt(professorId));
  if (minPrice) allClasses = allClasses.filter(c => c.price >= parseFloat(minPrice));
  if (maxPrice) allClasses = allClasses.filter(c => c.price <= parseFloat(maxPrice));
  if (search) allClasses = allClasses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()));

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  const paginated = allClasses.slice(offset, offset + limitNum);

  const enriched = await Promise.all(paginated.map(enrichClass));
  
  res.json({ classes: enriched, total: allClasses.length, page: pageNum, limit: limitNum });
});

router.post("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== "professor") {
    res.status(403).json({ error: "Only professors can create classes" });
    return;
  }

  const [prof] = await db.select().from(professorsTable).where(eq(professorsTable.userId, user.id));
  if (!prof || prof.status !== "approved") {
    res.status(403).json({ error: "Professor not approved" });
    return;
  }

  const [cls] = await db.insert(classesTable).values({
    professorId: prof.id,
    title: req.body.title,
    subject: req.body.subject,
    gradeLevel: req.body.gradeLevel,
    city: req.body.city || user.city || "Tunis",
    description: req.body.description,
    coverImage: req.body.coverImage || null,
    price: req.body.price,
    durationHours: req.body.durationHours,
    isRecurring: req.body.isRecurring || false,
    isPublished: true,
    enrolledCount: 0,
  }).returning();

  const enriched = await enrichClass(cls);
  res.json(enriched);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, id));
  if (!cls) {
    res.status(404).json({ error: "Class not found" });
    return;
  }
  const enriched = await enrichClass(cls);
  res.json(enriched);
});

router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(classesTable).where(eq(classesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  const [updated] = await db.update(classesTable).set({
    title: req.body.title ?? existing.title,
    subject: req.body.subject ?? existing.subject,
    gradeLevel: req.body.gradeLevel ?? existing.gradeLevel,
    city: req.body.city ?? existing.city,
    description: req.body.description ?? existing.description,
    coverImage: req.body.coverImage ?? existing.coverImage,
    price: req.body.price ?? existing.price,
    durationHours: req.body.durationHours ?? existing.durationHours,
    isRecurring: req.body.isRecurring ?? existing.isRecurring,
    isPublished: req.body.isPublished ?? existing.isPublished,
  }).where(eq(classesTable.id, id)).returning();

  const enriched = await enrichClass(updated);
  res.json(enriched);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(classesTable).where(eq(classesTable.id, id));
  res.json({ success: true });
});

// Live Sessions
router.get("/:id/sessions", async (req, res) => {
  const classId = parseInt(req.params.id);
  const sessions = await db.select().from(liveSessionsTable).where(eq(liveSessionsTable.classId, classId));
  res.json(sessions);
});

router.post("/:id/sessions", requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id);
  const [session] = await db.insert(liveSessionsTable).values({
    classId,
    title: req.body.title,
    description: req.body.description,
    price: req.body.price,
    durationHours: req.body.durationHours,
    scheduledAt: new Date(req.body.scheduledAt),
    status: "scheduled",
    enrolledCount: 0,
  }).returning();
  res.json(session);
});

router.put("/:classId/sessions/:sessionId", requireAuth, async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  const [existing] = await db.select().from(liveSessionsTable).where(eq(liveSessionsTable.id, sessionId));
  if (!existing) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const [updated] = await db.update(liveSessionsTable).set({
    title: req.body.title ?? existing.title,
    description: req.body.description ?? existing.description,
    price: req.body.price ?? existing.price,
    durationHours: req.body.durationHours ?? existing.durationHours,
    scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : existing.scheduledAt,
    status: req.body.status ?? existing.status,
  }).where(eq(liveSessionsTable.id, sessionId)).returning();
  res.json(updated);
});

// Enrollments for class
router.get("/:id/enrollments", requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id);
  const enrollments = await db.select({
    enrollment: enrollmentsTable,
    student: usersTable,
  }).from(enrollmentsTable)
    .innerJoin(usersTable, eq(enrollmentsTable.studentId, usersTable.id))
    .where(eq(enrollmentsTable.classId, classId));

  res.json(enrollments.map(e => ({
    ...e.enrollment,
    student: { ...e.student, passwordHash: undefined },
  })));
});

// Materials
router.get("/:id/materials", async (req, res) => {
  const classId = parseInt(req.params.id);
  const materials = await db.select().from(materialsTable).where(eq(materialsTable.classId, classId));
  res.json(materials);
});

router.post("/:id/materials", requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id);
  const [material] = await db.insert(materialsTable).values({
    classId,
    title: req.body.title,
    description: req.body.description || null,
    fileUrl: req.body.fileUrl || null,
    fileType: req.body.fileType || null,
  }).returning();
  res.json(material);
});

// Quizzes
router.get("/:id/quizzes", async (req, res) => {
  const classId = parseInt(req.params.id);
  const quizzes = await db.select().from(quizzesTable).where(eq(quizzesTable.classId, classId));
  res.json(quizzes);
});

router.post("/:id/quizzes", requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id);
  const questions = (req.body.questions || []).map((q: any, i: number) => ({ ...q, id: i + 1 }));
  const [quiz] = await db.insert(quizzesTable).values({
    classId,
    title: req.body.title,
    dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
    isPublished: false,
    questions,
  }).returning();
  res.json(quiz);
});

// Tests
router.get("/:id/tests", async (req, res) => {
  const classId = parseInt(req.params.id);
  const tests = await db.select().from(testsTable).where(eq(testsTable.classId, classId));
  res.json(tests);
});

router.post("/:id/tests", requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id);
  const questions = (req.body.questions || []).map((q: any, i: number) => ({ ...q, id: i + 1 }));
  const [test] = await db.insert(testsTable).values({
    classId,
    title: req.body.title,
    dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
    isPublished: false,
    questions,
  }).returning();
  res.json(test);
});

// Assignments
router.get("/:id/assignments", async (req, res) => {
  const classId = parseInt(req.params.id);
  const assignments = await db.select().from(assignmentsTable).where(eq(assignmentsTable.classId, classId));
  res.json(assignments);
});

router.post("/:id/assignments", requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id);
  const [assignment] = await db.insert(assignmentsTable).values({
    classId,
    title: req.body.title,
    instructions: req.body.instructions || null,
    dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
    isPublished: false,
  }).returning();
  res.json(assignment);
});

export default router;
