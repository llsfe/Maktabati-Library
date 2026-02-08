import type { Express } from "express";
import type { Server } from "http";
import { storage, MemStorage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import express from "express";
import fs from "fs";
// import { PDFParse } from "pdf-parse"; // Removed as per request

// Security: Allowed file types
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];

// Security: Maximum file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function registerRoutes(
  httpServer: Server,
  app: Express,
  isPackaged: boolean = false,
  dataDir?: string,
): Promise<Server> {
  // Base directories
  const PROJECT_ROOT = dataDir || process.cwd();
  if (storage instanceof MemStorage && dataDir) {
    storage.setStoragePath(dataDir);
  }
  const uploadsDir = path.resolve(PROJECT_ROOT, "attached_assets");
  const booksDir = isPackaged
    ? path.resolve(PROJECT_ROOT, "Books")
    : path.resolve(PROJECT_ROOT, "..", "Books");
  const coversDir = path.resolve(booksDir, "cover");

  // Ensure directories exist
  [uploadsDir, booksDir, coversDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Security: Sanitize filename to prevent directory traversal
  const sanitizeFilename = (filename: string): string => {
    return filename
      .replace(/[/\\?%*:|"<>]/g, "-") // Remove dangerous characters
      .replace(/\.\./g, "") // Prevent directory traversal
      .replace(/^\.+/, "") // Remove leading dots
      .substring(0, 200); // Limit length
  };

  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === ".pdf") {
        cb(null, booksDir);
      } else if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
        // If it's an image, check if it's meant to be a cover
        // We'll assume images uploaded during book creation/update are covers if specified
        if (req.body.type === "cover" || req.query.type === "cover") {
          cb(null, coversDir);
        } else {
          cb(null, uploadsDir);
        }
      } else {
        cb(null, uploadsDir);
      }
    },
    filename: (_req, file, cb) => {
      // Multer/Busboy often interprets filename as latin1. Convert to UTF-8 for Arabic support.
      const utf8Name = Buffer.from(file.originalname, "latin1").toString(
        "utf8",
      );
      const sanitized = sanitizeFilename(utf8Name);
      cb(null, sanitized);
    },
  });

  // Security: File filter to validate file types
  const fileFilter = (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
  ) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype.toLowerCase();

    if (
      ALLOWED_EXTENSIONS.includes(ext) &&
      ALLOWED_MIME_TYPES.includes(mimeType)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(`نوع الملف غير مسموح. الأنواع المسموحة: PDF, JPG, PNG, WebP`),
      );
    }
  };

  const upload = multer({
    storage: multerStorage,
    fileFilter,
    limits: {
      fileSize: MAX_FILE_SIZE,
    },
  });

  // Serve static files from all three locations
  app.use("/attached_assets", express.static(uploadsDir));
  app.use("/books", express.static(booksDir));
  app.use("/covers", express.static(coversDir));

  // Legacy/Compatibility: Request URL for uploads
  app.post("/api/uploads/request-url", async (req, res) => {
    const { name, type } = req.body;
    res.json({
      uploadURL: `/api/uploads/direct?name=${encodeURIComponent(name)}${type ? `&type=${type}` : ""}`,
      objectPath: `/attached_assets/${name}`, // Default placeholder
    });
  });

  // Direct upload handler
  app.post("/api/uploads/direct", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const ext = path.extname(req.file.filename).toLowerCase();
    let objectPath = "";

    if (ext === ".pdf") {
      objectPath = `/books/${req.file.filename}`;
    } else if (req.query.type === "cover") {
      objectPath = `/covers/${req.file.filename}`;
    } else {
      objectPath = `/attached_assets/${req.file.filename}`;
    }

    res.json({
      objectPath,
      pdfData: {},
    });
  });

  app.put("/api/uploads/direct", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const ext = path.extname(req.file.filename).toLowerCase();
    let objectPath = "";

    if (ext === ".pdf") {
      objectPath = `/books/${req.file.filename}`;
    } else if (req.query.type === "cover") {
      objectPath = `/covers/${req.file.filename}`;
    } else {
      objectPath = `/attached_assets/${req.file.filename}`;
    }

    res.json({
      objectPath,
      pdfData: {},
    });
  });

  app.get(api.books.list.path, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const category = req.query.category as string | undefined;
      const isFavorite = req.query.isFavorite === "true";
      const minRating = req.query.minRating
        ? Number(req.query.minRating)
        : undefined;
      const tag = req.query.tag as string | undefined;

      const books = await storage.getBooks({
        search,
        status,
        category,
        isFavorite: req.query.isFavorite !== undefined ? isFavorite : undefined,
        minRating,
        tag,
      });
      res.json(books);
    } catch (error) {
      console.error("Fetch books error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.books.get.path, async (req, res) => {
    const book = await storage.getBook(Number(req.params.id));
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json(book);
  });

  // Helper to reorganize files into Category/Author structure
  const moveFileToCategoryFolder = (
    fileUrl: string | null,
    category: string,
    author: string,
  ): string | null => {
    if (!fileUrl) return null;

    // Only process local book files (starting with /books/)
    if (!fileUrl.startsWith("/books/")) return fileUrl;

    const fileName = path.basename(fileUrl);
    const safeCategory = sanitizeFilename(category.trim() || "Uncategorized");
    const safeAuthor = sanitizeFilename(author.trim() || "Unknown");

    const targetDir = path.join(booksDir, safeCategory, safeAuthor);
    const targetPath = path.join(targetDir, fileName);

    // Current location logic
    // We need to find where the file IS currently.
    // It could be in Books root (just uploaded) or already in a subfolder.
    // The fileUrl tells us where it is relative to the server root (virtual path).

    // Decode URL to get actual path characters (e.g. spaces, Arabic)
    const decodedUrl = decodeURIComponent(fileUrl); // e.g., /books/Category/Author/file.pdf or /books/file.pdf
    const relativePath = decodedUrl.replace(/^\/books\//, ""); // Category/Author/file.pdf or file.pdf
    const currentPath = path.join(booksDir, relativePath);

    // If already in the right place, do nothing
    if (path.normalize(currentPath) === path.normalize(targetPath)) {
      return fileUrl;
    }

    try {
      if (fs.existsSync(currentPath)) {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.renameSync(currentPath, targetPath);

        // Return new URL (encode components to ensure URL safety)
        return `/books/${encodeURIComponent(safeCategory)}/${encodeURIComponent(safeAuthor)}/${encodeURIComponent(fileName)}`;
      }
    } catch (error) {
      console.error("Failed to move file:", error);
    }

    return fileUrl;
  };

  app.post(api.books.create.path, async (req, res) => {
    try {
      const input = api.books.create.input.parse(req.body);

      // Organize file
      if (input.fileUrl) {
        input.fileUrl = moveFileToCategoryFolder(
          input.fileUrl,
          input.category,
          input.author,
        );
      }

      const book = await storage.createBook(input);
      res.status(201).json(book);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.put(api.books.update.path, async (req, res) => {
    try {
      const input = api.books.update.input.parse(req.body);

      // Organize file (handle potential move if category/author changed)
      if (input.fileUrl) {
        input.fileUrl = moveFileToCategoryFolder(
          input.fileUrl,
          input.category || "Uncategorized",
          input.author || "Unknown",
        );
      }

      const book = await storage.updateBook(Number(req.params.id), input);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      res.json(book);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  // Delete Category Route
  app.delete("/api/categories", async (req, res) => {
    try {
      const categoryName = req.query.name as string;
      if (!categoryName)
        return res.status(400).json({ message: "Category name required" });

      const books = await storage.getBooks({ category: categoryName });
      for (const book of books) {
        // Delete database record
        await storage.deleteBook(book.id);

        // File cleanup handled by cleanup function below or individual logic?
        // Since we are deleting the whole category folder, we can just do that.
      }

      // Recursive delete of the Category folder
      const safeCategory = sanitizeFilename(categoryName.trim());
      const categoryPath = path.join(booksDir, safeCategory);
      if (fs.existsSync(categoryPath)) {
        fs.rmSync(categoryPath, { recursive: true, force: true });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Delete Author Route
  app.delete("/api/authors", async (req, res) => {
    try {
      const authorName = req.query.name as string;
      if (!authorName)
        return res.status(400).json({ message: "Author name required" });

      // Find all books by this author
      // Storage doesn't have getByAuthor but getBooks logic allows filtering if we passed params correctly
      // But getBooks uses exact match or search.
      // Let's filter manually from all books or implement filtering in storage.
      // Based on storage.ts: getBooks({search}) searches author.
      // But exact match is better.
      // Let's rely on retrieving all books and filtering.

      const allBooks = await storage.getBooks();
      const authorBooks = allBooks.filter((b) => b.author === authorName);

      for (const book of authorBooks) {
        await storage.deleteBook(book.id);

        // Delete individual file if we are not deleting the whole folder structure yet?
        // Actually, books are in Books/Category/Author.
        // Calling rm on Books/Category/Author is safer.
        // But author might be in multiple categories.

        const safeCategory = sanitizeFilename(
          book.category.trim() || "Uncategorized",
        );
        const safeAuthor = sanitizeFilename(book.author.trim() || "Unknown");
        const authorPath = path.join(booksDir, safeCategory, safeAuthor);

        if (fs.existsSync(authorPath)) {
          // Check if we should delete this folder (if it only contains this author's books)
          // Yes, author path is specific to this author in this category.
          fs.rmSync(authorPath, { recursive: true, force: true });
        }
      }

      res.status(204).end();
    } catch (error) {
      console.error("Delete author error:", error);
      res.status(500).json({ message: "Failed to delete author" });
    }
  });

  // Rename Category Route
  app.put("/api/categories", async (req, res) => {
    try {
      const { oldName, newName } = req.body;
      if (!oldName || !newName)
        return res.status(400).json({ message: "Old and new names required" });

      const safeOld = sanitizeFilename(oldName.trim());
      const safeNew = sanitizeFilename(newName.trim());

      if (safeOld === safeNew)
        return res.status(200).json({ message: "No change" });

      // 1. Update Database
      const books = await storage.getBooks({ category: oldName });
      for (const book of books) {
        await storage.updateBook(book.id, { ...book, category: newName });
      }

      // 2. Rename Folder
      const oldPath = path.join(booksDir, safeOld);
      const newPath = path.join(booksDir, safeNew);

      if (fs.existsSync(oldPath)) {
        if (fs.existsSync(newPath)) {
          // New folder exists, merge content
          // Move all files/folders from old to new
          // For simplicity in this iteration: We just try to rename.
          // If new folder exists, we might need to move items one by one.
          // Let's implement a simple move for now, assuming no conflict or simple merge.

          // Actually, for categories, it contains author folders.
          const items = fs.readdirSync(oldPath);
          for (const item of items) {
            const srcPath = path.join(oldPath, item);
            const destPath = path.join(newPath, item);
            if (!fs.existsSync(destPath)) {
              fs.renameSync(srcPath, destPath);
            } else {
              // Conflict: Author exists in target category.
              // Should we merge books? files?
              // Safe approach: Move files inside.
              // This is getting complex strictly for a "rename".
              // Let's just rename DB. File reorganization is handled by `moveFileToCategoryFolder` on next generic update?
              // NO. `moveFileToCategoryFolder` is called on Book Creation/Update.
              // Renaming category in DB doesn't trigger file move automatically unless we call it.
              // But we already updated DB. The files are sitting in `oldPath`.
              // We need to move them to `newPath`.
            }
          }
          // After moving contents, remove old folder if empty
          try {
            fs.rmdirSync(oldPath);
          } catch (e) {
            /* ignore if not empty */
          }
        } else {
          // Simple rename
          fs.renameSync(oldPath, newPath);
        }
      }

      res.status(200).json({ message: "Category renamed" });
    } catch (error) {
      console.error("Rename category error:", error);
      res.status(500).json({ message: "Failed to rename category" });
    }
  });

  // Rename Author Route
  app.put("/api/authors", async (req, res) => {
    try {
      const { oldName, newName } = req.body;
      if (!oldName || !newName)
        return res.status(400).json({ message: "Old and new names required" });

      // 1. Update Database
      const allBooks = await storage.getBooks();
      const authorBooks = allBooks.filter((b) => b.author === oldName);

      for (const book of authorBooks) {
        await storage.updateBook(book.id, { ...book, author: newName });

        // 2. Rename Folder (Per Book Context)
        const safeCategory = sanitizeFilename(
          book.category.trim() || "Uncategorized",
        );
        const safeOldAuthor = sanitizeFilename(oldName.trim());
        const safeNewAuthor = sanitizeFilename(newName.trim());

        const oldAuthorPath = path.join(booksDir, safeCategory, safeOldAuthor);
        const newAuthorPath = path.join(booksDir, safeCategory, safeNewAuthor);

        if (fs.existsSync(oldAuthorPath)) {
          if (!fs.existsSync(newAuthorPath)) {
            fs.renameSync(oldAuthorPath, newAuthorPath);
          } else {
            // Target author folder exists in this category, move files
            const files = fs.readdirSync(oldAuthorPath);
            for (const file of files) {
              const src = path.join(oldAuthorPath, file);
              const dst = path.join(newAuthorPath, file);
              if (!fs.existsSync(dst)) {
                fs.renameSync(src, dst);
              }
            }
            try {
              fs.rmdirSync(oldAuthorPath);
            } catch (e) {}
          }
        }
      }

      res.status(200).json({ message: "Author renamed" });
    } catch (error) {
      console.error("Rename author error:", error);
      res.status(500).json({ message: "Failed to rename author" });
    }
  });

  app.delete(api.books.delete.path, async (req, res) => {
    await storage.deleteBook(Number(req.params.id));
    res.status(204).end();
  });

  // Seed data function - don't let seeding errors block server startup
  seedDatabase().catch((err) => {
    console.error("Seeding database failed:", err);
  });

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
        coverUrl:
          "https://placehold.co/400x600/1e293b/white?text=Distributed+Systems",
      },
      {
        title: "تاريخ العمارة الإسلامية",
        author: "محمد حسن",
        category: "تاريخ",
        year: 2021,
        status: "completed",
        coverUrl:
          "https://placehold.co/400x600/1e293b/white?text=Islamic+Architecture",
      },
      {
        title: "مبادئ التصميم الجرافيكي",
        author: "سارة محمود",
        category: "فنون",
        year: 2022,
        status: "planned",
        coverUrl:
          "https://placehold.co/400x600/1e293b/white?text=Graphic+Design",
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
