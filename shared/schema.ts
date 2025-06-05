import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  gmailConnected: boolean("gmail_connected").default(false),
  gmailToken: text("gmail_token"),
  apollioApiKey: text("apollio_api_key"),
  geminiApiKey: text("gemini_api_key"),
});

export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  company: text("company").notNull(),
  position: text("position").notNull(),
  jobDescription: text("job_description").notNull(),
  recruiterName: text("recruiter_name"),
  recruiterEmail: text("recruiter_email"),
  recruiterTitle: text("recruiter_title"),
  status: text("status").notNull().default("draft"), // draft, scheduled, sent, delivered, opened, replied, bounced
  emailSubject: text("email_subject"),
  emailContent: text("email_content"),
  coverLetter: text("cover_letter"),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emailAnalytics = pgTable("email_analytics", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull(),
  event: text("event").notNull(), // sent, delivered, opened, clicked, replied, bounced
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: json("metadata"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  gmailConnected: true,
  gmailToken: true,
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertResumeSchema = createInsertSchema(resumes).omit({
  id: true,
  createdAt: true,
});

export const insertEmailAnalyticsSchema = createInsertSchema(emailAnalytics).omit({
  id: true,
  timestamp: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type Resume = typeof resumes.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type EmailAnalytics = typeof emailAnalytics.$inferSelect;
export type InsertEmailAnalytics = z.infer<typeof insertEmailAnalyticsSchema>;
