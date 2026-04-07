/**
 * Revision routes
 *
 * revisionRouter    → mounted at /api/revision
 *   POST /process-upload  — internal fire-and-forget trigger (admin-only HTTP interface)
 *
 * adminKBRouter     → mounted at /api/admin/knowledge-base
 *   GET  /errors  — admin-only processing error log
 *   GET  /stats   — admin-only generation counts
 *
 * Professors have ZERO visibility of these endpoints.
 */

import { Router } from "express";
import { db, processingErrorsTable, flashcardsTable, notionsTable, annalesTable } from "@workspace/db";
import { desc, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { processUpload, type ProcessUploadParams } from "../services/knowledgeBaseProcessor";

// ── /api/revision/* ───────────────────────────────────────────────────────────

export const revisionRouter = Router();

/**
 * POST /api/revision/process-upload
 * Internal trigger — fires background processing for a specific uploaded file.
 * Admin-only so it can also be called manually for re-processing.
 * Responds immediately; AI work runs in the background.
 */
revisionRouter.post("/process-upload", requireAuth, requireAdmin, async (req, res) => {
  const { file_id, file_url, file_type, subject, grade_level, section_key, topic } = req.body;

  if (!file_id || !file_url || !subject || !grade_level) {
    res.status(400).json({ error: "file_id, file_url, subject, grade_level are required" });
    return;
  }

  const params: ProcessUploadParams = {
    fileId:     Number(file_id),
    fileUrl:    String(file_url),
    fileType:   file_type ? String(file_type) : null,
    subject:    String(subject),
    gradeLevel: String(grade_level),
    sectionKey: section_key ? String(section_key) : null,
    topic:      topic ? String(topic) : "",
  };

  // Acknowledge immediately
  res.json({ queued: true, fileId: params.fileId });

  // Background processing — errors handled internally, never surfaced
  setImmediate(() => {
    processUpload(params).catch(err =>
      console.error("[revision/process-upload] Unhandled error:", err)
    );
  });
});

// ── /api/admin/knowledge-base/* ───────────────────────────────────────────────

export const adminKBRouter = Router();

// All admin KB routes require admin
adminKBRouter.use(requireAuth, requireAdmin);

/**
 * GET /api/admin/knowledge-base/errors
 * View silent processing failures. NEVER exposed to professors.
 */
adminKBRouter.get("/errors", async (_req, res) => {
  const errors = await db
    .select()
    .from(processingErrorsTable)
    .orderBy(desc(processingErrorsTable.attemptedAt))
    .limit(200);
  res.json(errors);
});

/**
 * GET /api/admin/knowledge-base/stats
 * Quick counts of AI-generated content.
 */
adminKBRouter.get("/stats", async (_req, res) => {
  const [[fc], [nt], [an], [er]] = await Promise.all([
    db.select({ value: count() }).from(flashcardsTable),
    db.select({ value: count() }).from(notionsTable),
    db.select({ value: count() }).from(annalesTable),
    db.select({ value: count() }).from(processingErrorsTable),
  ]);
  res.json({
    flashcards: Number(fc?.value ?? 0),
    notions:    Number(nt?.value ?? 0),
    annales:    Number(an?.value ?? 0),
    errors:     Number(er?.value ?? 0),
  });
});
