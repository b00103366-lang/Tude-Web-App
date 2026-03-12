import { pgTable, serial, text, integer, real, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const professorStatusEnum = pgEnum("professor_status", ["pending", "approved", "rejected"]);

export const professorsTable = pgTable("professors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  subjects: text("subjects").array().notNull().default([]),
  gradeLevels: text("grade_levels").array().notNull().default([]),
  yearsOfExperience: integer("years_of_experience"),
  bio: text("bio"),
  qualifications: text("qualifications"),
  status: professorStatusEnum("status").notNull().default("pending"),
  isVerified: boolean("is_verified").notNull().default(false),
  rating: real("rating"),
  totalReviews: integer("total_reviews").notNull().default(0),
  totalStudents: integer("total_students").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProfessorSchema = createInsertSchema(professorsTable).omit({ id: true, createdAt: true });

export type Professor = typeof professorsTable.$inferSelect;
export type InsertProfessor = z.infer<typeof insertProfessorSchema>;
