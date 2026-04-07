/**
 * Admin-only knowledge base upload tracking.
 * Stores metadata + processing status for files uploaded via /kb.
 * Never exposed to professors or students.
 */
import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const knowledgeBaseFilesTable = pgTable("knowledge_base_files", {
  id:              serial("id").primaryKey(),
  fileName:        text("file_name").notNull(),
  fileUrl:         text("file_url").notNull(),
  fileType:        text("file_type"),
  subject:         text("subject").notNull(),
  gradeLevel:      text("grade_level").notNull(),
  sectionKey:      text("section_key"),
  topic:           text("topic").notNull(),
  contentType:     text("content_type").notNull(), // 'cours' | 'examen' | 'exercices' | 'annale' | 'resume' | 'manuel'
  notes:           text("notes"),
  uploadedBy:      integer("uploaded_by").references(() => usersTable.id, { onDelete: "set null" }),
  status:          text("status").notNull().default("processing"), // 'processing' | 'processed' | 'error'
  errorMessage:    text("error_message"),
  questionsCount:  integer("questions_count").notNull().default(0),
  flashcardsCount: integer("flashcards_count").notNull().default(0),
  notionsCount:    integer("notions_count").notNull().default(0),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
  processedAt:     timestamp("processed_at"),
});

export type KnowledgeBaseFile = typeof knowledgeBaseFilesTable.$inferSelect;
