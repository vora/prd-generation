import { pgTable, text, serial, timestamp, json, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const prds = pgTable("prds", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: json("content").notNull(), // Contains the full PRD structure
  status: text("status").notNull().default("draft"), // draft, complete, in_review
  originalFileName: text("original_file_name"),
  processingTime: integer("processing_time"), // in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPrdSchema = createInsertSchema(prds).omit({
  id: true,
  createdAt: true,
});

export type InsertPrd = z.infer<typeof insertPrdSchema>;
export type Prd = typeof prds.$inferSelect;

// PRD Content Structure
export const prdContentSchema = z.object({
  overview: z.string(),
  goals: z.array(z.string()),
  features: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })),
  technicalRequirements: z.array(z.string()),
  userPersonas: z.array(z.object({
    name: z.string(),
    description: z.string(),
    painPoints: z.array(z.string()),
  })).optional(),
  acceptanceCriteria: z.array(z.string()).optional(),
});

export type PrdContent = z.infer<typeof prdContentSchema>;

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string(),
  mimetype: z.string(),
  size: z.number().max(10 * 1024 * 1024), // 10MB max
});

export type FileUpload = z.infer<typeof fileUploadSchema>;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
