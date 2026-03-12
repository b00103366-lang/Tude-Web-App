import { Router } from "express";
import { db, reviewsTable, professorsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", async (req, res) => {
  const { professorId, classId } = req.query as any;
  let reviews = await db.select().from(reviewsTable);

  if (professorId) reviews = reviews.filter(r => r.professorId === parseInt(professorId));
  if (classId) reviews = reviews.filter(r => r.classId === parseInt(classId));

  const enriched = await Promise.all(reviews.map(async (r) => {
    const [student] = await db.select().from(usersTable).where(eq(usersTable.id, r.studentId));
    return { ...r, student: student ? { ...student, passwordHash: undefined } : null };
  }));

  res.json(enriched);
});

router.post("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { professorId, classId, rating, comment } = req.body;

  const [review] = await db.insert(reviewsTable).values({
    studentId: user.id,
    professorId,
    classId: classId || null,
    rating,
    comment: comment || null,
  }).returning();

  // Update professor rating
  const allReviews = await db.select().from(reviewsTable).where(eq(reviewsTable.professorId, professorId));
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  await db.update(professorsTable).set({
    rating: avgRating,
    totalReviews: allReviews.length,
  }).where(eq(professorsTable.id, professorId));

  res.json({ ...review, student: { ...user, passwordHash: undefined } });
});

export default router;
