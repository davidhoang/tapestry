import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
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