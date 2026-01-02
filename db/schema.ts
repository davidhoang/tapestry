import { pgTable, text, serial, integer, boolean, timestamp, json, jsonb, index, uniqueIndex, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations, sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

// Enums for type safety
export const recommendationTypeEnum = pgEnum('recommendation_type', [
  'add_to_list',
  'create_list', 
  'update_profile',
  'capture_create_designer',
  'capture_enrich_profile'
]);

export const captureContentTypeEnum = pgEnum('capture_content_type', [
  'text',
  'email',
  'upload'
]);

export const captureStatusEnum = pgEnum('capture_status', [
  'pending',
  'processing',
  'processed',
  'error'
]);

export const recommendationStatusEnum = pgEnum('recommendation_status', [
  'new',
  'approved',
  'applied', 
  'dismissed',
  'snoozed',
  'error'
]);

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
}, (table) => ({
  workspaceIdIdx: index("workspace_members_workspace_id_idx").on(table.workspaceId),
  userIdIdx: index("workspace_members_user_id_idx").on(table.userId),
}));

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
  phoneNumber: text("phone_number"),
  photoUrl: text("photo_url"),
  skills: json("skills").$type<string[]>().notNull(),
  available: boolean("available").default(false),
  description: text("description"),
  notes: text("notes"),
  enrichedAt: timestamp("enriched_at"),
  enrichmentSource: text("enrichment_source"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  workspaceIdIdx: index("designers_workspace_id_idx").on(table.workspaceId),
  createdAtIdx: index("designers_created_at_idx").on(table.createdAt),
  workspaceIdCreatedAtIdx: index("designers_workspace_id_created_at_idx").on(table.workspaceId, table.createdAt),
}));

export const lists = pgTable("lists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  description: text("description"),
  summary: text("summary"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  workspaceIdIdx: index("lists_workspace_id_idx").on(table.workspaceId),
}));

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

export const inboxRecommendations = pgTable("inbox_recommendations", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  recommendationType: recommendationTypeEnum("recommendation_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").default("medium"), // "low", "medium", "high", "urgent"
  status: recommendationStatusEnum("status").default("new"),
  designerId: integer("designer_id").references(() => designers.id, { onDelete: 'cascade' }),
  targetListId: integer("target_list_id").references(() => lists.id, { onDelete: 'cascade' }),
  score: integer("score").default(0),
  groupKey: text("group_key"),
  dedupHash: text("dedup_hash"),
  snoozeUntil: timestamp("snooze_until"),
  appliedAt: timestamp("applied_at"),
  resolvedBy: integer("resolved_by").references(() => users.id, { onDelete: 'set null' }),
  metadata: jsonb("metadata").$type<{
    sourceType?: string;
    sourceId?: number;
    jobId?: number;
    listId?: number;
    filters?: Record<string, any>;
    aiReasoning?: string;
    candidateCount?: number;
    estimatedValue?: string;
    actionUrl?: string;
    expiresAt?: string;
    [key: string]: any;
  }>(),
  actionTaken: text("action_taken"), // Track what action was taken when acted upon
  actionMetadata: jsonb("action_metadata"), // Additional data about the action taken
  seenAt: timestamp("seen_at"),
  actedUponAt: timestamp("acted_upon_at"),
  dismissedAt: timestamp("dismissed_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Composite index for efficient multi-tenant queries
    workspaceStatusTypeScoreIdx: index("inbox_recommendations_workspace_status_type_score_idx")
      .on(table.workspaceId, table.status, table.recommendationType, table.score.desc()),
    
    // GIN index on metadata for fast JSONB queries
    metadataGinIdx: index("inbox_recommendations_metadata_gin_idx")
      .using("gin", table.metadata),
    
    // Robust composite uniqueness constraint to prevent duplicate recommendations
    // Note: This will be enhanced with COALESCE after creation via raw SQL
    robustDedupUniqueIdx: uniqueIndex("inbox_recommendations_robust_dedup_unique_idx")
      .on(
        table.workspaceId, 
        table.recommendationType, 
        table.designerId,
        table.targetListId, 
        table.groupKey,
        table.dedupHash
      ),
    
    // Partial index for open items (high-frequency queries)
    openItemsIdx: index("inbox_recommendations_open_items_idx")
      .on(table.workspaceId, table.status, table.score.desc())
      .where(sql`${table.status} IN ('new', 'snoozed')`),
    
    // Individual indexes for common queries
    workspaceIdIdx: index("inbox_recommendations_workspace_id_idx").on(table.workspaceId),
    statusIdx: index("inbox_recommendations_status_idx").on(table.status),
    workspaceIdStatusIdx: index("inbox_recommendations_workspace_id_status_idx").on(table.workspaceId, table.status),
    scoreIdx: index("inbox_recommendations_score_idx").on(table.score),
  };
});

export const inboxRecommendationCandidates = pgTable("inbox_recommendation_candidates", {
  id: serial("id").primaryKey(),
  recommendationId: integer("recommendation_id").references(() => inboxRecommendations.id, { onDelete: 'cascade' }).notNull(),
  designerId: integer("designer_id").references(() => designers.id, { onDelete: 'cascade' }).notNull(),
  score: integer("score"), // Match score from 0-100
  rank: integer("rank"), // Ranking within this recommendation
  reasoning: text("reasoning"), // AI reasoning for why this candidate was recommended
  metadata: jsonb("metadata").$type<{
    skillMatches?: string[];
    experienceMatch?: number;
    locationMatch?: boolean;
    availabilityMatch?: boolean;
    portfolioRelevance?: number;
    previousFeedback?: string;
    confidence?: number;
    [key: string]: any;
  }>(),
  isSelected: boolean("is_selected").default(false), // Whether this candidate was chosen when acting on the recommendation
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Performance indexes for candidates
    recommendationIdIdx: index("inbox_recommendation_candidates_recommendation_id_idx")
      .on(table.recommendationId),
    designerIdIdx: index("inbox_recommendation_candidates_designer_id_idx")
      .on(table.designerId),
    
    // GIN index on metadata for fast JSONB queries
    metadataGinIdx: index("inbox_recommendation_candidates_metadata_gin_idx")
      .using("gin", table.metadata),
  };
});

export const inboxRecommendationEvents = pgTable("inbox_recommendation_events", {
  id: serial("id").primaryKey(),
  recommendationId: integer("recommendation_id").references(() => inboxRecommendations.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }),
  eventType: text("event_type").notNull(), // "created", "viewed", "seen", "dismissed", "acted_upon", "expired", "updated"
  description: text("description"), // Human-readable description of the event
  metadata: json("metadata").$type<{
    previousStatus?: string;
    newStatus?: string;
    actionTaken?: string;
    candidatesSelected?: number[];
    userAgent?: string;
    ipAddress?: string;
    source?: string;
    [key: string]: any;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Performance indexes for events
    recommendationIdIdx: index("inbox_recommendation_events_recommendation_id_idx")
      .on(table.recommendationId),
    createdAtDescIdx: index("inbox_recommendation_events_created_at_desc_idx")
      .on(table.createdAt.desc()),
  };
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
  inboxRecommendations: many(inboxRecommendations),
  savedSearches: many(savedSearches),
  activities: many(workspaceActivities),
  captureEntries: many(captureEntries),
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

export const inboxRecommendationRelations = relations(inboxRecommendations, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [inboxRecommendations.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [inboxRecommendations.userId],
    references: [users.id],
  }),
  candidates: many(inboxRecommendationCandidates),
  events: many(inboxRecommendationEvents),
}));

export const inboxRecommendationCandidateRelations = relations(inboxRecommendationCandidates, ({ one }) => ({
  recommendation: one(inboxRecommendations, {
    fields: [inboxRecommendationCandidates.recommendationId],
    references: [inboxRecommendations.id],
  }),
  designer: one(designers, {
    fields: [inboxRecommendationCandidates.designerId],
    references: [designers.id],
  }),
}));

export const inboxRecommendationEventRelations = relations(inboxRecommendationEvents, ({ one }) => ({
  recommendation: one(inboxRecommendations, {
    fields: [inboxRecommendationEvents.recommendationId],
    references: [inboxRecommendations.id],
  }),
  user: one(users, {
    fields: [inboxRecommendationEvents.userId],
    references: [users.id],
  }),
}));

export const savedSearches = pgTable("saved_searches", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(),
  searchType: text("search_type").notNull(),
  searchValue: text("search_value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  workspaceIdIdx: index("saved_searches_workspace_id_idx").on(table.workspaceId),
  userIdIdx: index("saved_searches_user_id_idx").on(table.userId),
  uniqueSearch: uniqueIndex("saved_searches_unique_idx").on(table.workspaceId, table.userId, table.searchType, table.searchValue),
}));

export const savedSearchRelations = relations(savedSearches, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [savedSearches.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [savedSearches.userId],
    references: [users.id],
  }),
}));

export const workspaceActivities = pgTable("workspace_activities", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  activityType: text("activity_type").notNull(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  entityName: text("entity_name"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  workspaceIdIdx: index("workspace_activities_workspace_id_idx").on(table.workspaceId),
  createdAtIdx: index("workspace_activities_created_at_idx").on(table.createdAt),
  workspaceIdCreatedAtIdx: index("workspace_activities_workspace_id_created_at_idx").on(table.workspaceId, table.createdAt),
}));

export const workspaceActivityRelations = relations(workspaceActivities, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceActivities.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [workspaceActivities.userId],
    references: [users.id],
  }),
}));

// Capture system tables
export const captureEntries = pgTable("capture_entries", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  creatorId: integer("creator_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  listId: integer("list_id").references(() => lists.id, { onDelete: 'set null' }),
  contentType: captureContentTypeEnum("content_type").notNull(),
  contentRaw: text("content_raw"),
  status: captureStatusEnum("status").default("pending"),
  processedAt: timestamp("processed_at"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").$type<{
    source?: string;
    emailFrom?: string;
    emailTo?: string;
    emailSubject?: string;
    emailReceivedAt?: string;
    extractedUrls?: string[];
    [key: string]: any;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  workspaceIdIdx: index("capture_entries_workspace_id_idx").on(table.workspaceId),
  creatorIdIdx: index("capture_entries_creator_id_idx").on(table.creatorId),
  listIdIdx: index("capture_entries_list_id_idx").on(table.listId),
  statusIdx: index("capture_entries_status_idx").on(table.status),
  createdAtIdx: index("capture_entries_created_at_idx").on(table.createdAt),
}));

export const captureAssets = pgTable("capture_assets", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").references(() => captureEntries.id, { onDelete: 'cascade' }).notNull(),
  storageUrl: text("storage_url").notNull(),
  originalFilename: text("original_filename"),
  assetType: text("asset_type").notNull(),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  extractedText: text("extracted_text"),
  metadata: jsonb("metadata").$type<{
    width?: number;
    height?: number;
    ocrConfidence?: number;
    [key: string]: any;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  entryIdIdx: index("capture_assets_entry_id_idx").on(table.entryId),
}));

export const captureAnnotations = pgTable("capture_annotations", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").references(() => captureEntries.id, { onDelete: 'cascade' }).notNull(),
  aiSummary: text("ai_summary"),
  extractedEntities: jsonb("extracted_entities").$type<{
    names?: Array<{ value: string; confidence: number }>;
    companies?: Array<{ value: string; confidence: number }>;
    skills?: Array<{ value: string; confidence: number }>;
    emails?: string[];
    linkedinUrls?: string[];
    portfolioUrls?: string[];
    locations?: string[];
    titles?: string[];
    [key: string]: any;
  }>(),
  suggestedActions: jsonb("suggested_actions").$type<Array<{
    actionType: 'create_designer' | 'enrich_profile' | 'add_to_list';
    confidence: number;
    targetDesignerId?: number;
    targetListId?: number;
    reasoning: string;
    extractedData?: Record<string, any>;
  }>>(),
  matchedDesignerId: integer("matched_designer_id").references(() => designers.id, { onDelete: 'set null' }),
  processingModel: text("processing_model"),
  processingDuration: integer("processing_duration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  entryIdIdx: index("capture_annotations_entry_id_idx").on(table.entryId),
  matchedDesignerIdIdx: index("capture_annotations_matched_designer_id_idx").on(table.matchedDesignerId),
}));

export const captureEntryRelations = relations(captureEntries, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [captureEntries.workspaceId],
    references: [workspaces.id],
  }),
  creator: one(users, {
    fields: [captureEntries.creatorId],
    references: [users.id],
  }),
  list: one(lists, {
    fields: [captureEntries.listId],
    references: [lists.id],
  }),
  assets: many(captureAssets),
  annotations: many(captureAnnotations),
}));

export const captureAssetRelations = relations(captureAssets, ({ one }) => ({
  entry: one(captureEntries, {
    fields: [captureAssets.entryId],
    references: [captureEntries.id],
  }),
}));

export const captureAnnotationRelations = relations(captureAnnotations, ({ one }) => ({
  entry: one(captureEntries, {
    fields: [captureAnnotations.entryId],
    references: [captureEntries.id],
  }),
  matchedDesigner: one(designers, {
    fields: [captureAnnotations.matchedDesignerId],
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

export const insertInboxRecommendationSchema = createInsertSchema(inboxRecommendations);
export const selectInboxRecommendationSchema = createSelectSchema(inboxRecommendations);
export type InsertInboxRecommendation = typeof inboxRecommendations.$inferInsert;
export type SelectInboxRecommendation = typeof inboxRecommendations.$inferSelect;

export const insertInboxRecommendationCandidateSchema = createInsertSchema(inboxRecommendationCandidates);
export const selectInboxRecommendationCandidateSchema = createSelectSchema(inboxRecommendationCandidates);
export type InsertInboxRecommendationCandidate = typeof inboxRecommendationCandidates.$inferInsert;
export type SelectInboxRecommendationCandidate = typeof inboxRecommendationCandidates.$inferSelect;

export const insertInboxRecommendationEventSchema = createInsertSchema(inboxRecommendationEvents);
export const selectInboxRecommendationEventSchema = createSelectSchema(inboxRecommendationEvents);
export type InsertInboxRecommendationEvent = typeof inboxRecommendationEvents.$inferInsert;
export type SelectInboxRecommendationEvent = typeof inboxRecommendationEvents.$inferSelect;

export const insertSavedSearchSchema = createInsertSchema(savedSearches);
export const selectSavedSearchSchema = createSelectSchema(savedSearches);
export type InsertSavedSearch = typeof savedSearches.$inferInsert;
export type SelectSavedSearch = typeof savedSearches.$inferSelect;

export const insertWorkspaceActivitySchema = createInsertSchema(workspaceActivities);
export const selectWorkspaceActivitySchema = createSelectSchema(workspaceActivities);
export type InsertWorkspaceActivity = typeof workspaceActivities.$inferInsert;
export type SelectWorkspaceActivity = typeof workspaceActivities.$inferSelect;

export const insertCaptureEntrySchema = createInsertSchema(captureEntries);
export const selectCaptureEntrySchema = createSelectSchema(captureEntries);
export type InsertCaptureEntry = typeof captureEntries.$inferInsert;
export type SelectCaptureEntry = typeof captureEntries.$inferSelect;

export const insertCaptureAssetSchema = createInsertSchema(captureAssets);
export const selectCaptureAssetSchema = createSelectSchema(captureAssets);
export type InsertCaptureAsset = typeof captureAssets.$inferInsert;
export type SelectCaptureAsset = typeof captureAssets.$inferSelect;

export const insertCaptureAnnotationSchema = createInsertSchema(captureAnnotations);
export const selectCaptureAnnotationSchema = createSelectSchema(captureAnnotations);
export type InsertCaptureAnnotation = typeof captureAnnotations.$inferInsert;
export type SelectCaptureAnnotation = typeof captureAnnotations.$inferSelect;

// Personal Access Tokens for MCP/API authentication
export const apiTokens = pgTable("api_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(),
  tokenHash: text("token_hash").notNull(),
  tokenPrefix: text("token_prefix").notNull(),
  role: text("role").notNull().default("editor"),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("api_tokens_user_id_idx").on(table.userId),
  workspaceIdIdx: index("api_tokens_workspace_id_idx").on(table.workspaceId),
  tokenHashIdx: index("api_tokens_token_hash_idx").on(table.tokenHash),
}));

export const apiTokensRelations = relations(apiTokens, ({ one }) => ({
  user: one(users, {
    fields: [apiTokens.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [apiTokens.workspaceId],
    references: [workspaces.id],
  }),
}));

export const insertApiTokenSchema = createInsertSchema(apiTokens);
export const selectApiTokenSchema = createSelectSchema(apiTokens);
export type InsertApiToken = typeof apiTokens.$inferInsert;
export type SelectApiToken = typeof apiTokens.$inferSelect;