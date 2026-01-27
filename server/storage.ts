import { db } from "./db";
import { books, type Book, type InsertBook, type UpdateBookRequest } from "@shared/schema";
import { eq, ilike, or } from "drizzle-orm";

export interface IStorage {
  getBooks(params?: { search?: string; status?: string; category?: string }): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, updates: UpdateBookRequest): Promise<Book>;
  deleteBook(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getBooks(params?: { search?: string; status?: string; category?: string }): Promise<Book[]> {
    let query = db.select().from(books);
    
    if (params?.status) {
      query.where(eq(books.status, params.status));
    }

    if (params?.category) {
      query.where(eq(books.category, params.category));
    }

    if (params?.search) {
      const searchPattern = `%${params.search}%`;
      query.where(or(
        ilike(books.title, searchPattern),
        ilike(books.author, searchPattern)
      ));
    }

    return await query;
  }

  async getBook(id: number): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book;
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const [book] = await db.insert(books).values(insertBook).returning();
    return book;
  }

  async updateBook(id: number, updates: UpdateBookRequest): Promise<Book> {
    const [updated] = await db.update(books)
      .set(updates)
      .where(eq(books.id, id))
      .returning();
    return updated;
  }

  async deleteBook(id: number): Promise<void> {
    await db.delete(books).where(eq(books.id, id));
  }
}

export const storage = new DatabaseStorage();
