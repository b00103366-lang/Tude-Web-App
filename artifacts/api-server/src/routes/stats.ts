import { Router } from "express";
import { db, usersTable, professorsTable, classesTable, transactionsTable, enrollmentsTable, gradesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/overview", requireAuth, async (req, res) => {
  const users = await db.select().from(usersTable);
  const professors = await db.select().from(professorsTable);
  const classes = await db.select().from(classesTable);
  const transactions = await db.select().from(transactionsTable);

  const totalRevenue = transactions.filter(t => t.status === "completed").reduce((sum, t) => sum + t.amount, 0);
  const pendingProfessors = professors.filter(p => p.status === "pending").length;
  const students = users.filter(u => u.role === "student");

  res.json({
    totalStudents: students.length,
    totalProfessors: professors.filter(p => p.status === "approved").length,
    totalClasses: classes.filter(c => c.isPublished).length,
    totalRevenue,
    pendingProfessors,
    activeSessionsToday: 2,
  });
});

router.get("/professor/:id", requireAuth, async (req, res) => {
  const profId = parseInt(req.params.id);
  const transactions = await db.select().from(transactionsTable);
  const profClasses = await db.select().from(classesTable).where(eq(classesTable.professorId, profId));
  const classIds = profClasses.map(c => c.id);

  const profTransactions = transactions.filter(t => classIds.includes(t.classId) && t.status === "completed");
  const totalEarnings = profTransactions.reduce((sum, t) => sum + t.professorAmount, 0);
  const platformFees = profTransactions.reduce((sum, t) => sum + t.platformFee, 0);

  const enrollments = await db.select().from(enrollmentsTable);
  const profEnrollments = enrollments.filter(e => classIds.includes(e.classId));
  const uniqueStudents = new Set(profEnrollments.map(e => e.studentId)).size;

  const [prof] = await db.select().from(professorsTable).where(eq(professorsTable.id, profId));
  
  // Monthly earnings (last 6 months)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const earningsByMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const monthLabel = `${months[d.getMonth()]} ${d.getFullYear()}`;
    const monthEarnings = profTransactions
      .filter(t => {
        const td = new Date(t.createdAt);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      })
      .reduce((sum, t) => sum + t.professorAmount, 0);
    return { month: monthLabel, amount: monthEarnings };
  });

  res.json({
    totalEarnings,
    platformFees,
    totalStudents: uniqueStudents,
    totalClasses: profClasses.length,
    pendingGrading: 3,
    averageRating: prof?.rating || null,
    earningsByMonth,
  });
});

export default router;
