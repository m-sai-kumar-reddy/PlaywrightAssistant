import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  baseUrl: text("base_url").notNull(),
  jsonDefinition: jsonb("json_definition").notNull(),
  generatedCode: text("generated_code"),
  lastModified: timestamp("last_modified").defaultNow(),
  userId: integer("user_id"),
});

export const executionSessions = pgTable("execution_sessions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  status: text("status").notNull().default("idle"), // idle, running, paused, manual, completed, error
  currentStep: integer("current_step").default(0),
  totalSteps: integer("total_steps").default(0),
  logs: jsonb("logs").default([]),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  lastModified: true,
});

export const insertExecutionSessionSchema = createInsertSchema(executionSessions).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const TestScenarioSchema = z.object({
  scenarios: z.array(z.object({
    name: z.string(),
    steps: z.array(z.object({
      action: z.enum(['navigate', 'fill', 'click', 'waitForSelector', 'expect']),
      selector: z.string().optional(),
      value: z.string().optional(),
      url: z.string().optional(),
      humanVerification: z.boolean().optional(),
      timeout: z.number().optional(),
    }))
  }))
});