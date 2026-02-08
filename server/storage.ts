import { db } from "./db";
import {
  books,
  type Book,
  type InsertBook,
  type UpdateBookRequest,
} from "@shared/schema";
import { eq, ilike, or, gte } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { encrypt, decrypt } from "./crypto";

export interface IStorage {
  getBooks(params?: {
    search?: string;
    status?: string;
    category?: string;
  }): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, updates: UpdateBookRequest): Promise<Book>;
  deleteBook(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getBooks(params?: {
    search?: string;
    status?: string;
    category?: string;
    isFavorite?: boolean | string;
    minRating?: number;
    tag?: string;
  }): Promise<Book[]> {
    if (!db) throw new Error("Database not initialized");
    let query = db.select().from(books).$dynamic();

    if (params?.status && params.status !== "history") {
      query = query.where(eq(books.status, params.status));
    }

    if (params?.category) {
      query = query.where(eq(books.category, params.category));
    }

    if (params?.isFavorite !== undefined) {
      const favValue =
        params.isFavorite === true || params.isFavorite === "true" ? 1 : 0;
      query = query.where(eq(books.isFavorite, favValue));
    }

    if (params?.minRating) {
      query = query.where(gte(books.rating, params.minRating));
    }

    if (params?.tag) {
      query = query.where(ilike(books.tags, `%${params.tag}%`));
    }

    if (params?.search) {
      const searchPattern = `%${params.search}%`;
      query = query.where(
        or(
          ilike(books.title, searchPattern),
          ilike(books.author, searchPattern),
          ilike(books.extractedContent, searchPattern),
          ilike(books.tags, searchPattern),
        ),
      );
    }

    const results = await query;

    if (params?.status === "history") {
      return results
        .filter((b) => b.lastOpenedAt !== null)
        .sort((a, b) => {
          const tA = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : 0;
          const tB = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : 0;
          return tB - tA;
        });
    }

    // Default sort by createdAt descending
    return results.sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tB - tA;
    });
  }

  async getBook(id: number): Promise<Book | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [book] = await db.select().from(books).where(eq(books.id, id));
    if (book && book.extractedContent) {
      book.extractedContent = decrypt(book.extractedContent);
    }
    return book;
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    if (!db) throw new Error("Database not initialized");
    const toInsert = {
      ...insertBook,
      extractedContent: insertBook.extractedContent
        ? encrypt(insertBook.extractedContent)
        : null,
    };
    const [book] = await db.insert(books).values(toInsert).returning();
    if (book.extractedContent) {
      book.extractedContent = decrypt(book.extractedContent);
    }
    return book;
  }

  async updateBook(id: number, updates: UpdateBookRequest): Promise<Book> {
    if (!db) throw new Error("Database not initialized");
    const toUpdate = {
      ...updates,
      extractedContent: updates.extractedContent
        ? encrypt(updates.extractedContent)
        : updates.extractedContent,
    };
    const [updated] = await db
      .update(books)
      .set(toUpdate)
      .where(eq(books.id, id))
      .returning();
    if (updated.extractedContent) {
      updated.extractedContent = decrypt(updated.extractedContent);
    }
    return updated;
  }

  async deleteBook(id: number): Promise<void> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(books).where(eq(books.id, id));
  }
}

export class MemStorage implements IStorage {
  private books: Map<number, Book>;
  private currentId: number;
  private filePath: string;

  constructor() {
    this.books = new Map();
    this.currentId = 1;
    this.filePath = path.resolve(process.cwd(), "db.json");
    this.load();
  }

  setStoragePath(dataDir: string) {
    this.filePath = path.resolve(dataDir, "db.json");
    this.load(); // Reload from new path
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
        // Handle serialization: Map doesn't JSON stringify well directly
        if (Array.isArray(data.books)) {
          this.books = new Map(data.books);
          this.currentId = data.currentId || 1;
        }
      }
    } catch (err) {
      console.error("Failed to load database:", err);
    }
  }

  private save() {
    try {
      const data = {
        books: Array.from(this.books.entries()),
        currentId: this.currentId,
      };
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("Failed to save database:", err);
    }
  }

  async getBooks(params?: {
    search?: string;
    status?: string;
    category?: string;
    isFavorite?: boolean | string;
    minRating?: number;
    tag?: string;
  }): Promise<Book[]> {
    let books = Array.from(this.books.values());

    if (params?.status && params.status !== "history") {
      books = books.filter((b) => b.status === params.status);
    }

    if (params?.isFavorite !== undefined) {
      const favValue =
        params.isFavorite === true || params.isFavorite === "true" ? 1 : 0;
      books = books.filter((b) => b.isFavorite === favValue);
    }

    if (params?.minRating) {
      books = books.filter((b) => (b.rating || 0) >= params.minRating!);
    }

    if (params?.tag) {
      const tagLower = params.tag.toLowerCase();
      books = books.filter((b) => b.tags?.toLowerCase().includes(tagLower));
    }

    if (params?.category) {
      books = books.filter((b) => b.category === params.category);
    }

    if (params?.search) {
      const search = params.search.toLowerCase();
      books = books.filter(
        (b) =>
          b.title.toLowerCase().includes(search) ||
          b.author.toLowerCase().includes(search) ||
          b.tags?.toLowerCase().includes(search) ||
          (b.extractedContent &&
            decrypt(b.extractedContent).toLowerCase().includes(search)),
      );
    }

    if (params?.status === "history") {
      // Sort by lastOpenedAt descending
      return books
        .filter((b) => b.lastOpenedAt !== null && b.lastOpenedAt !== undefined)
        .sort((a, b) => {
          const tA = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : 0;
          const tB = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : 0;
          return tB - tA;
        });
    }

    // Sort by createdAt descending (newest first)
    return books.sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tB - tA;
    });
  }

  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const id = this.currentId++;
    const book: Book = {
      ...insertBook,
      id,
      createdAt: new Date(),
      lastOpenedAt: null,
      fileUrl: insertBook.fileUrl ?? null,
      extractedContent: insertBook.extractedContent
        ? encrypt(insertBook.extractedContent)
        : null,
      notes: insertBook.notes ?? null,
      quote: insertBook.quote ?? null,
      lastReadPage: insertBook.lastReadPage ?? 1,
      totalPages: insertBook.totalPages ?? 0,
      rating: insertBook.rating ?? 0,
      isFavorite: insertBook.isFavorite ?? 0,
      tags: insertBook.tags ?? null,
    };
    this.books.set(id, book);
    this.save();

    // Return decrypted version
    return {
      ...book,
      extractedContent: book.extractedContent
        ? decrypt(book.extractedContent)
        : null,
    };
  }

  async updateBook(id: number, updates: UpdateBookRequest): Promise<Book> {
    const book = this.books.get(id);
    if (!book) throw new Error("Book not found");
    const updated: Book = {
      ...book,
      ...updates,
      fileUrl: updates.fileUrl ?? book.fileUrl,
      extractedContent: updates.extractedContent
        ? encrypt(updates.extractedContent)
        : updates.extractedContent === null
          ? null
          : book.extractedContent,
      quote: updates.quote ?? book.quote,
      lastOpenedAt: (updates as any).lastOpenedAt ?? book.lastOpenedAt,
      rating: updates.rating ?? book.rating,
      isFavorite: updates.isFavorite ?? book.isFavorite,
      tags: updates.tags ?? book.tags,
    };
    this.books.set(id, updated);
    this.save();

    // Return decrypted version
    return {
      ...updated,
      extractedContent: updated.extractedContent
        ? decrypt(updated.extractedContent)
        : null,
    };
  }

  async deleteBook(id: number): Promise<void> {
    this.books.delete(id);
    this.save();
  }
}

export const storage = db ? new DatabaseStorage() : new MemStorage();
