import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  username: text("username").unique(),
  profilePhotoUrl: text("profile_photo_url"),
  isAdmin: boolean("is_admin").default(false),
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
  onboardingDebugMode: boolean("onboarding_debug_mode").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workspaceMembers = pgTable("workspace_members", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: text("role").notNull().default("member"), // "owner", "admin", "member"
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const workspaceInvitations = pgTable("workspace_invitations", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("member"),
  token: text("token").notNull().unique(),
  invitedBy: integer("invited_by").references(() => users.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const designers = pgTable("designers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  location: text("location"),
  company: text("company"),
  level: text("level").notNull(),
  website: text("website"),
  linkedIn: text("linkedin"),
  email: text("email"),
  photoUrl: text("photo_url"),
  skills: json("skills").$type<string[]>().notNull(),
  available: boolean("available").default(false),
  description: text("description"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lists = pgTable("lists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  summary: text("summary"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const listDesigners = pgTable("list_designers", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").references(() => lists.id, { onDelete: 'cascade' }),
  designerId: integer("designer_id").references(() => designers.id),
  notes: text("notes"),
  addedAt: timestamp("added_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  recommendations: json("recommendations"), // Store match recommendations
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(), // Markdown content
  status: text("status").notNull().default("draft"), // "draft", "active", "paused", "closed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const recommendationFeedback = pgTable("recommendation_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "cascade" }),
  designerId: integer("designer_id").references(() => designers.id, { onDelete: "cascade" }).notNull(),
  matchScore: integer("match_score").notNull(), // Original AI match score
  feedbackType: text("feedback_type").notNull(), // "irrelevant_experience", "under_qualified", "over_qualified", "location_mismatch", "good_match"
  rating: integer("rating"), // 1-5 scale optional rating
  comments: text("comments"), // Optional user comments
  jobDescription: text("job_description"), // Store job description for context
  designerSnapshot: json("designer_snapshot"), // Store designer data at time of feedback
  aiReasoning: text("ai_reasoning"), // Store original AI reasoning
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workspaceRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id],
  }),
  members: many(workspaceMembers),
  designers: many(designers),
  lists: many(lists),
  conversations: many(conversations),
  invitations: many(workspaceInvitations),
  jobs: many(jobs),
}));

export const workspaceMemberRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id],
  }),
}));

export const workspaceInvitationRelations = relations(workspaceInvitations, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceInvitations.workspaceId],
    references: [workspaces.id],
  }),
  inviter: one(users, {
    fields: [workspaceInvitations.invitedBy],
    references: [users.id],
  }),
}));

export const designerRelations = relations(designers, ({ one }) => ({
  user: one(users, {
    fields: [designers.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [designers.workspaceId],
    references: [workspaces.id],
  }),
}));

export const listRelations = relations(lists, ({ one, many }) => ({
  user: one(users, {
    fields: [lists.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [lists.workspaceId],
    references: [workspaces.id],
  }),
  designers: many(listDesigners),
}));

export const listDesignerRelations = relations(listDesigners, ({ one }) => ({
  list: one(lists, {
    fields: [listDesigners.listId],
    references: [lists.id],
  }),
  designer: one(designers, {
    fields: [listDesigners.designerId],
    references: [designers.id],
  }),
}));

export const conversationRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, { fields: [conversations.userId], references: [users.id] }),
  messages: many(messages),
}));

export const messageRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
}));

export const jobRelations = relations(jobs, ({ one, many }) => ({
  user: one(users, {
    fields: [jobs.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [jobs.workspaceId],
    references: [workspaces.id],
  }),
  feedback: many(recommendationFeedback),
}));

export const recommendationFeedbackRelations = relations(recommendationFeedback, ({ one }) => ({
  user: one(users, {
    fields: [recommendationFeedback.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [recommendationFeedback.workspaceId],
    references: [workspaces.id],
  }),
  job: one(jobs, {
    fields: [recommendationFeedback.jobId],
    references: [jobs.id],
  }),
  designer: one(designers, {
    fields: [recommendationFeedback.designerId],
    references: [designers.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export const insertWorkspaceSchema = createInsertSchema(workspaces);
export const selectWorkspaceSchema = createSelectSchema(workspaces);
export type InsertWorkspace = typeof workspaces.$inferInsert;
export type SelectWorkspace = typeof workspaces.$inferSelect;

export const insertWorkspaceMemberSchema = createInsertSchema(workspaceMembers);
export const selectWorkspaceMemberSchema = createSelectSchema(workspaceMembers);
export type InsertWorkspaceMember = typeof workspaceMembers.$inferInsert;
export type SelectWorkspaceMember = typeof workspaceMembers.$inferSelect;

export const insertWorkspaceInvitationSchema = createInsertSchema(workspaceInvitations);
export const selectWorkspaceInvitationSchema = createSelectSchema(workspaceInvitations);
export type InsertWorkspaceInvitation = typeof workspaceInvitations.$inferInsert;
export type SelectWorkspaceInvitation = typeof workspaceInvitations.$inferSelect;

export const insertDesignerSchema = createInsertSchema(designers);
export const selectDesignerSchema = createSelectSchema(designers);
export type InsertDesigner = typeof designers.$inferInsert;
export type SelectDesigner = typeof designers.$inferSelect;

export const insertListSchema = createInsertSchema(lists);
export const selectListSchema = createSelectSchema(lists);
export type InsertList = typeof lists.$inferInsert;
export type SelectList = typeof lists.$inferSelect & {
  designers?: Array<{
    designer: SelectDesigner;
    notes?: string;
  }>;
};

export const insertListDesignerSchema = createInsertSchema(listDesigners);
export const selectListDesignerSchema = createSelectSchema(listDesigners);
export type InsertListDesigner = typeof listDesigners.$inferInsert;
export type SelectListDesigner = typeof listDesigners.$inferSelect;

export const insertConversationSchema = createInsertSchema(conversations);
export const selectConversationSchema = createSelectSchema(conversations);
export type InsertConversation = typeof conversations.$inferInsert;
export type SelectConversation = typeof conversations.$inferSelect;

export const insertMessageSchema = createInsertSchema(messages);
export const selectMessageSchema = createSelectSchema(messages);
export type InsertMessage = typeof messages.$inferInsert;
export type SelectMessage = typeof messages.$inferSelect;

export const insertJobSchema = createInsertSchema(jobs);
export const selectJobSchema = createSelectSchema(jobs);
export type InsertJob = typeof jobs.$inferInsert;
export type SelectJob = typeof jobs.$inferSelect;

export const insertRecommendationFeedbackSchema = createInsertSchema(recommendationFeedback);
export const selectRecommendationFeedbackSchema = createSelectSchema(recommendationFeedback);
export type InsertRecommendationFeedback = typeof recommendationFeedback.$inferInsert;
export type SelectRecommendationFeedback = typeof recommendationFeedback.$inferSelect;