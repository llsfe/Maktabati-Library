import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);

  app.get(api.books.list.path, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const category = req.query.category as string | undefined;
      const books = await storage.getBooks({ search, status, category });
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.books.get.path, async (req, res) => {
    const book = await storage.getBook(Number(req.params.id));
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  });

  app.post(api.books.create.path, async (req, res) => {
    try {
      const input = api.books.create.input.parse(req.body);
      const book = await storage.createBook(input);
      res.status(201).json(book);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.books.update.path, async (req, res) => {
    try {
      const input = api.books.update.input.parse(req.body);
      const book = await storage.updateBook(Number(req.params.id), input);
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      res.json(book);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.books.delete.path, async (req, res) => {
    await storage.deleteBook(Number(req.params.id));
    res.status(204).end();
  });

  // Seed data function
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingBooks = await storage.getBooks();
  if (existingBooks.length === 0) {
    const booksToSeed = [
      {
        title: "تصميم النظم الموزعة",
        author: "د. أحمد علي",
        category: "تكنولوجيا",
        year: 2023,
        status: "reading",
        coverUrl: "https://placehold.co/400x600/1e293b/white?text=Distributed+Systems",
      },
      {
        title: "تاريخ العمارة الإسلامية",
        author: "محمد حسن",
        category: "تاريخ",
        year: 2021,
        status: "completed",
        coverUrl: "https://placehold.co/400x600/1e293b/white?text=Islamic+Architecture",
      },
      {
        title: "مبادئ التصميم الجرافيكي",
        author: "سارة محمود",
        category: "فنون",
        year: 2022,
        status: "planned",
        coverUrl: "https://placehold.co/400x600/1e293b/white?text=Graphic+Design",
      },
      {
        title: "الطبيعة والبيئة",
        author: "علي يوسف",
        category: "علوم",
        year: 2020,
        status: "planned",
        coverUrl: "https://placehold.co/400x600/1e293b/white?text=Nature",
      },
      {
        title: "الذكاء الاصطناعي",
        author: "نور الدين",
        category: "تكنولوجيا",
        year: 2024,
        status: "reading",
        coverUrl: "https://placehold.co/400x600/1e293b/white?text=AI",
      },
      {
        title: "فلسفة العلم",
        author: "د. محمود زيدان",
        category: "فلسفة",
        year: 2019,
        status: "completed",
        coverUrl: "https://placehold.co/400x600/1e293b/white?text=Philosophy",
      },
    ];

    for (const book of booksToSeed) {
      await storage.createBook(book);
    }
    console.log("Database seeded successfully!");
  }
}
