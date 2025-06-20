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

export const designers = pgTable("designers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  title: text("title").notNull(),
  location: text("location"),
  company: text("company"),
  level: text("level").notNull(),
  website: text("website"),
  linkedIn: text("linkedin"),
  email: text("email").unique().notNull(),
  photoUrl: text("photo_url"),
  skills: json("skills").$type<string[]>().notNull(),
  available: boolean("available").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lists = pgTable("lists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
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

export const designerRelations = relations(designers, ({ one }) => ({
  user: one(users, {
    fields: [designers.userId],
    references: [users.id],
  }),
}));

export const listRelations = relations(lists, ({ one, many }) => ({
  user: one(users, {
    fields: [lists.userId],
    references: [users.id],
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

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

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