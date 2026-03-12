import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roleEnum = pgEnum("role", ["student", "professor", "admin"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("student"),
  fullName: text("full_name").notNull(),
  profilePhoto: text("profile_photo"),
  city: text("city"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studentProfilesTable = pgTable("student_profiles", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  gradeLevel: text("grade_level"),
  schoolName: text("school_name"),
  preferredSubjects: text("preferred_subjects").array().notNull().default([]),
  parentContact: text("parent_contact"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export const insertStudentProfileSchema = createInsertSchema(studentProfilesTable).omit({ id: true, createdAt: true });

export type User = typeof usersTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type StudentProfile = typeof studentProfilesTable.$inferSelect;
export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;
