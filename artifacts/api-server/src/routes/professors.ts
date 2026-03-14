import { Router } from "express";
import { db, professorsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", async (req, res) => {
  const { status, subject, city, page = "1", limit = "20" } = req.query as any;

  const allProfs = await db.select({
    prof: professorsTable,
    user: usersTable,
  }).from(professorsTable).innerJoin(usersTable, eq(professorsTable.userId, usersTable.id));

  let filtered = allProfs;
  if (status) filtered = filtered.filter(p => p.prof.status === status);
  if (subject) filtered = filtered.filter(p => p.prof.subjects.some((s: string) => s.toLowerCase().includes(subject.toLowerCase())));
  if (city) filtered = filtered.filter(p => p.user.city?.toLowerCase().includes(city.toLowerCase()));

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  const paginated = filtered.slice(offset, offset + limitNum);

  res.json({
    professors: paginated.map(p => ({
      ...p.prof,
      fullName: p.user.fullName,
      email: p.user.email,
      phone: p.user.phone,
      profilePhoto: p.user.profilePhoto,
      city: p.user.city,
      user: {
        id: p.user.id,
        fullName: p.user.fullName,
        email: p.user.email,
        phone: p.user.phone,
        city: p.user.city,
        profilePhoto: p.user.profilePhoto,
      },
    })),
    total: filtered.length,
    page: pageNum,
    limit: limitNum,
  });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [result] = await db.select({
    prof: professorsTable,
    user: usersTable,
  }).from(professorsTable).innerJoin(usersTable, eq(professorsTable.userId, usersTable.id)).where(eq(professorsTable.id, id));

  if (!result) {
    res.status(404).json({ error: "Professor not found" });
    return;
  }

  res.json({
    ...result.prof,
    fullName: result.user.fullName,
    profilePhoto: result.user.profilePhoto,
    city: result.user.city,
  });
});

router.post("/:id/approve", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [prof] = await db.update(professorsTable)
    .set({ status: "approved", isVerified: true })
    .where(eq(professorsTable.id, id))
    .returning();

  if (!prof) {
    res.status(404).json({ error: "Professor not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, prof.userId));
  res.json({ ...prof, fullName: user?.fullName, profilePhoto: user?.profilePhoto, city: user?.city });
});

router.post("/:id/kyc-submit", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [prof] = await db.update(professorsTable)
    .set({ status: "kyc_submitted" })
    .where(eq(professorsTable.id, id))
    .returning();

  if (!prof) {
    res.status(404).json({ error: "Professor not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, prof.userId));
  res.json({ ...prof, fullName: user?.fullName, profilePhoto: user?.profilePhoto, city: user?.city });
});

router.post("/:id/reject", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [prof] = await db.update(professorsTable)
    .set({ status: "rejected" })
    .where(eq(professorsTable.id, id))
    .returning();

  if (!prof) {
    res.status(404).json({ error: "Professor not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, prof.userId));
  res.json({ ...prof, fullName: user?.fullName, profilePhoto: user?.profilePhoto, city: user?.city });
});

export default router;
