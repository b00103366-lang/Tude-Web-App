/**
 * Startup migrations — additive-only ALTER TABLE statements that run on every
 * server boot using IF NOT EXISTS so they are safe to repeat.
 *
 * Use this for columns/indexes added after the initial schema was deployed.
 * Anything that changes or drops existing structure belongs in a proper migration.
 */

import { pool } from "@workspace/db";

export async function runStartupMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    // ── 0003: review workflow columns ────────────────────────────────────────
    await client.query(`
      ALTER TABLE knowledge_base_files
        ADD COLUMN IF NOT EXISTS annales_count integer NOT NULL DEFAULT 0;
    `);

    await client.query(`
      ALTER TABLE processing_errors
        ADD COLUMN IF NOT EXISTS kb_file_id integer;
    `);

    // Index for admin error dashboard: filter by kb_file_id
    await client.query(`
      CREATE INDEX IF NOT EXISTS processing_errors_kb_file_id_idx
        ON processing_errors (kb_file_id)
        WHERE kb_file_id IS NOT NULL;
    `);

    console.log("[startup] Schema migrations applied successfully.");
  } catch (err: any) {
    // Log but don't crash — the missing columns will cause individual query
    // failures rather than taking down the whole server.
    console.error("[startup] Migration error (non-fatal):", err.message);
  } finally {
    client.release();
  }
}
