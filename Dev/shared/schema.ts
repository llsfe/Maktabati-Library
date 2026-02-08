import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  category: text("category").notNull(),
  year: integer("year").notNull(),
  status: text("status").notNull(), // 'reading', 'completed', 'planned'
  coverUrl: text("cover_url").notNull(),
  fileUrl: text("file_url"),
  extractedContent: text("extracted_content"),
  notes: text("notes"),
  quote: text("quote"),
  lastReadPage: integer("last_read_page").default(1),
  totalPages: integer("total_pages").default(0),
  lastOpenedAt: timestamp("last_opened_at"),
  rating: integer("rating").default(0),
  isFavorite: integer("is_favorite").default(0), // Using 1/0 for boolean compatibility
  tags: text("tags"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookSchema = createInsertSchema(books, {
  lastOpenedAt: z.preprocess(
    (arg) => (typeof arg === "string" ? new Date(arg) : arg),
    z.date().nullish(),
  ),
  createdAt: z.preprocess(
    (arg) => (typeof arg === "string" ? new Date(arg) : arg),
    z.date().nullish(),
  ),
}).omit({
  id: true,
});

export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type UpdateBookRequest = Partial<InsertBook>;
