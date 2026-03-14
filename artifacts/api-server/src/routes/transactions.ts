import { Router } from "express";
import { db, transactionsTable, classesTable, usersTable, professorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/my-earnings", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const [prof] = await db.select().from(professorsTable).where(eq(professorsTable.userId, user.id));
  if (!prof) { res.status(403).json({ error: "Not a professor" }); return; }

  const classes = await db.select().from(classesTable).where(eq(classesTable.professorId, prof.id));
  const classIds = classes.map(c => c.id);
  const all = await db.select().from(transactionsTable);
  const profTxns = all.filter(t => classIds.includes(t.classId));

  const enriched = await Promise.all(profTxns.map(async (t) => {
    const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, t.classId));
    const [student] = await db.select().from(usersTable).where(eq(usersTable.id, t.studentId));
    return { ...t, class: cls || null, student: student ? { id: student.id, fullName: student.fullName } : null };
  }));

  res.json(enriched);
});

router.get("/my", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const transactions = await db.select().from(transactionsTable).where(eq(transactionsTable.studentId, user.id));

  const enriched = await Promise.all(transactions.map(async (t) => {
    const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, t.classId));
    return { ...t, class: cls || null };
  }));

  res.json(enriched);
});

router.get("/", requireAuth, async (req, res) => {
  const { page = "1", limit = "20" } = req.query as any;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  const all = await db.select().from(transactionsTable);
  const paginated = all.slice(offset, offset + limitNum);

  const enriched = await Promise.all(paginated.map(async (t) => {
    const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, t.classId));
    const [student] = await db.select().from(usersTable).where(eq(usersTable.id, t.studentId));
    return { ...t, class: cls || null, student: student ? { ...student, passwordHash: undefined } : null };
  }));

  res.json({ transactions: enriched, total: all.length, page: pageNum, limit: limitNum });
});

export default router;
