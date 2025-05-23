import {
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const prds = pgTable("prds", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: json("content").$type<PrdContent>().notNull(), // Contains the full PRD structure
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
  purposeAndVision: z.string(),
  scope: z.object({
    inScope: z.array(z.string()),
    outOfScope: z.array(z.string()),
  }),
  targetUsersAndPersonas: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      characteristics: z.array(z.string()),
      needs: z.array(z.string()),
    })
  ),
  coreFeatures: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      priority: z.string(),
      userStory: z.string(),
    })
  ),
  uiUxAspirations: z.object({
    style: z.string(),
    tone: z.string(),
    userExperience: z.string(),
  }),
  nonFunctionalRequirements: z.array(
    z.object({
      type: z.string(),
      requirement: z.string(),
      rationale: z.string(),
    })
  ),
  assumptions: z.array(z.string()),
  dependencies: z.array(
    z.object({
      type: z.string(),
      dependency: z.string(),
      impact: z.string(),
    })
  ),
  risksAndMitigations: z.array(
    z.object({
      risk: z.string(),
      impact: z.string(),
      mitigation: z.string(),
    })
  ),
  successMetrics: z.array(
    z.object({
      metric: z.string(),
      target: z.string(),
      timeframe: z.string(),
    })
  ),
  futureRoadmap: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      businessValue: z.string(),
      timeframe: z.string(),
    })
  ),
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

// Epic schema
export const epics = pgTable("epics", {
  id: serial("id").primaryKey(),
  prdId: integer("prd_id")
    .references(() => prds.id)
    .notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull().default("medium"), // high, medium, low
  estimatedEffort: text("estimated_effort"), // e.g., "2-3 weeks"
  userStories: json("user_stories").$type<UserStory[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEpicSchema = createInsertSchema(epics).omit({
  id: true,
  createdAt: true,
});

export type InsertEpic = z.infer<typeof insertEpicSchema>;
export type EpicRecord = typeof epics.$inferSelect;

// User Story schema (embedded in epics)
export const userStorySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  acceptanceCriteria: z.array(z.string()),
  priority: z.enum(["high", "medium", "low"]),
  estimatedPoints: z.number().optional(),
  status: z.enum(["todo", "in-progress", "done"]).default("todo"),
});

export type UserStory = z.infer<typeof userStorySchema>;

// Epic with generated content schema
export const epicContentSchema = z.object({
  goals: z.array(z.string()),
  userStories: z.array(userStorySchema),
  dependencies: z.array(z.string()).optional(),
  risks: z.array(z.string()).optional(),
});

export type EpicContent = z.infer<typeof epicContentSchema>;
