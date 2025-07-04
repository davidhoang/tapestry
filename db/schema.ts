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
  systemPromptId: integer("system_prompt_id").references(() => aiSystemPrompts.id, { onDelete: "set null" }),
  matchScore: integer("match_score").notNull(), // Original AI match score
  feedbackType: text("feedback_type").notNull(), // "irrelevant_experience", "under_qualified", "over_qualified", "location_mismatch", "good_match"
  rating: integer("rating"), // 1-5 scale optional rating
  comments: text("comments"), // Optional user comments
  jobDescription: text("job_description"), // Store job description for context
  designerSnapshot: json("designer_snapshot"), // Store designer data at time of feedback
  aiReasoning: text("ai_reasoning"), // Store original AI reasoning
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiSystemPrompts = pgTable("ai_system_prompts", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  isActive: boolean("is_active").default(false),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  designerId: integer("designer_id").references(() => designers.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  tagline: text("tagline"),
  isPublic: boolean("is_public").default(true),
  isActive: boolean("is_active").default(true),
  theme: text("theme").default("modern"), // "modern", "minimal", "creative", "professional"
  primaryColor: text("primary_color").default("#C8944B"),
  customDomain: text("custom_domain"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  socialLinks: json("social_links").$type<{
    website?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    dribbble?: string;
    behance?: string;
    github?: string;
  }>(),
  contactInfo: json("contact_info").$type<{
    email?: string;
    phone?: string;
    location?: string;
    timezone?: string;
    availableForWork?: boolean;
    hourlyRate?: string;
    preferredContact?: string;
  }>(),
  settings: json("settings").$type<{
    showContact?: boolean;
    showSocialLinks?: boolean;
    showResume?: boolean;
    showAvailability?: boolean;
    allowMessages?: boolean;
    requireApproval?: boolean;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const portfolioProjects = pgTable("portfolio_projects", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").references(() => portfolios.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  content: text("content"), // Rich text/markdown content
  category: text("category"), // "web", "mobile", "branding", "illustration", etc.
  tags: json("tags").$type<string[]>().default([]),
  coverImageUrl: text("cover_image_url"),
  status: text("status").default("published"), // "draft", "published", "archived"
  isPublic: boolean("is_public").default(true),
  isFeatured: boolean("is_featured").default(false),
  sortOrder: integer("sort_order").default(0),
  projectUrl: text("project_url"), // Live project URL
  sourceUrl: text("source_url"), // GitHub/source code URL
  clientName: text("client_name"),
  projectDate: timestamp("project_date"),
  duration: text("duration"), // "2 weeks", "3 months", etc.
  technologies: json("technologies").$type<string[]>().default([]),
  role: text("role"), // "Lead Designer", "UI/UX Designer", etc.
  teamSize: text("team_size"),
  challenges: text("challenges"),
  solution: text("solution"),
  results: text("results"),
  testimonial: json("testimonial").$type<{
    content?: string;
    author?: string;
    position?: string;
    company?: string;
    rating?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const portfolioMedia = pgTable("portfolio_media", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").references(() => portfolios.id, { onDelete: 'cascade' }).notNull(),
  projectId: integer("project_id").references(() => portfolioProjects.id, { onDelete: 'cascade' }),
  filename: text("filename").notNull(),
  originalFilename: text("original_filename").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(), // "image", "video", "document", "audio"
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  width: integer("width"),
  height: integer("height"),
  duration: integer("duration"), // For video/audio files
  alt: text("alt"),
  caption: text("caption"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const portfolioViews = pgTable("portfolio_views", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").references(() => portfolios.id, { onDelete: 'cascade' }).notNull(),
  projectId: integer("project_id").references(() => portfolioProjects.id, { onDelete: 'cascade' }),
  viewerIp: text("viewer_ip"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  country: text("country"),
  city: text("city"),
  device: text("device"), // "desktop", "tablet", "mobile"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const portfolioInquiries = pgTable("portfolio_inquiries", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").references(() => portfolios.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  subject: text("subject"),
  message: text("message").notNull(),
  phone: text("phone"),
  budget: text("budget"),
  timeline: text("timeline"),
  projectType: text("project_type"),
  status: text("status").default("new"), // "new", "read", "replied", "archived"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  aiSystemPrompts: many(aiSystemPrompts),
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

export const designerRelations = relations(designers, ({ one, many }) => ({
  user: one(users, {
    fields: [designers.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [designers.workspaceId],
    references: [workspaces.id],
  }),
  portfolios: many(portfolios),
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
  systemPrompt: one(aiSystemPrompts, {
    fields: [recommendationFeedback.systemPromptId],
    references: [aiSystemPrompts.id],
  }),
}));

export const aiSystemPromptRelations = relations(aiSystemPrompts, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [aiSystemPrompts.workspaceId],
    references: [workspaces.id],
  }),
  createdBy: one(users, {
    fields: [aiSystemPrompts.createdBy],
    references: [users.id],
  }),
}));

export const portfolioRelations = relations(portfolios, ({ one, many }) => ({
  designer: one(designers, {
    fields: [portfolios.designerId],
    references: [designers.id],
  }),
  projects: many(portfolioProjects),
  media: many(portfolioMedia),
  views: many(portfolioViews),
  inquiries: many(portfolioInquiries),
}));

export const portfolioProjectRelations = relations(portfolioProjects, ({ one, many }) => ({
  portfolio: one(portfolios, {
    fields: [portfolioProjects.portfolioId],
    references: [portfolios.id],
  }),
  media: many(portfolioMedia),
  views: many(portfolioViews),
}));

export const portfolioMediaRelations = relations(portfolioMedia, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [portfolioMedia.portfolioId],
    references: [portfolios.id],
  }),
  project: one(portfolioProjects, {
    fields: [portfolioMedia.projectId],
    references: [portfolioProjects.id],
  }),
}));

export const portfolioViewRelations = relations(portfolioViews, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [portfolioViews.portfolioId],
    references: [portfolios.id],
  }),
  project: one(portfolioProjects, {
    fields: [portfolioViews.projectId],
    references: [portfolioProjects.id],
  }),
}));

export const portfolioInquiryRelations = relations(portfolioInquiries, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [portfolioInquiries.portfolioId],
    references: [portfolios.id],
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

export const insertAiSystemPromptSchema = createInsertSchema(aiSystemPrompts);
export const selectAiSystemPromptSchema = createSelectSchema(aiSystemPrompts);
export type InsertAiSystemPrompt = typeof aiSystemPrompts.$inferInsert;
export type SelectAiSystemPrompt = typeof aiSystemPrompts.$inferSelect;

export const insertPortfolioSchema = createInsertSchema(portfolios);
export const selectPortfolioSchema = createSelectSchema(portfolios);
export type InsertPortfolio = typeof portfolios.$inferInsert;
export type SelectPortfolio = typeof portfolios.$inferSelect;

export const insertPortfolioProjectSchema = createInsertSchema(portfolioProjects);
export const selectPortfolioProjectSchema = createSelectSchema(portfolioProjects);
export type InsertPortfolioProject = typeof portfolioProjects.$inferInsert;
export type SelectPortfolioProject = typeof portfolioProjects.$inferSelect;

export const insertPortfolioMediaSchema = createInsertSchema(portfolioMedia);
export const selectPortfolioMediaSchema = createSelectSchema(portfolioMedia);
export type InsertPortfolioMedia = typeof portfolioMedia.$inferInsert;
export type SelectPortfolioMedia = typeof portfolioMedia.$inferSelect;

export const insertPortfolioViewSchema = createInsertSchema(portfolioViews);
export const selectPortfolioViewSchema = createSelectSchema(portfolioViews);
export type InsertPortfolioView = typeof portfolioViews.$inferInsert;
export type SelectPortfolioView = typeof portfolioViews.$inferSelect;

export const insertPortfolioInquirySchema = createInsertSchema(portfolioInquiries);
export const selectPortfolioInquirySchema = createSelectSchema(portfolioInquiries);
export type InsertPortfolioInquiry = typeof portfolioInquiries.$inferInsert;
export type SelectPortfolioInquiry = typeof portfolioInquiries.$inferSelect;