import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  dialog,
  protocol,
  net,
} from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { startServer } from "../server/index.ts";

const PORT = 5000;

const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];

// APP_ROOT points to the internal application directory (inside ASAR in production)
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(currentDir, "..");
const RENDERER_DIST = path.join(APP_ROOT, "dist");

// DATA_ROOT points to the external directory for user data (Books, etc.)
const getDataRoot = () => {
  if (app.isPackaged) {
    // In production, the EXE sits in the root folder (e.g., Library/)
    return path.dirname(app.getPath("exe"));
  }
  // In development, process.cwd() is Library/Dev
  return process.cwd();
};
const DATA_ROOT = getDataRoot();

// Helper to get Books directory (always outside Dev in development)
const getBooksDir = () => {
  if (app.isPackaged) {
    return path.join(DATA_ROOT, "Books");
  }
  return path.resolve(DATA_ROOT, "..", "Books");
};
const BOOKS_DIR = getBooksDir();
const ATTACHED_ASSETS_DIR = path.join(DATA_ROOT, "attached_assets");
const COVERS_DIR = path.join(BOOKS_DIR, "cover");

let mainWindow: BrowserWindow | null = null;

// Determine the correct icon path (PNG preferred for transparency support)
const ICON_PATH = VITE_DEV_SERVER_URL
  ? path.join(DATA_ROOT, "client/public/Booklogo.png")
  : path.join(APP_ROOT, "dist/Booklogo.png");

const commonOptions = {
  icon: ICON_PATH,
  title: "Library - المكتبة",
};

// Global window listener to ensure consistent branding and Arabic titles
app.on("browser-window-created", (_event, window) => {
  window.setMenu(null);
  window.setIcon(ICON_PATH);

  // Replace "(anonymous)" with Arabic "بدون عنوان"
  window.webContents.on("page-title-updated", (event, title) => {
    if (title === "(anonymous)" || !title || title.trim() === "") {
      event.preventDefault();
      window.setTitle("بدون عنوان - المكتبة");
    }
  });
});

// Register protocol before app ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: "safe-file",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
    },
  },
]);

// Security: Validate path is within allowed directories
const isPathSafe = (targetPath: string, allowedDirs: string[]): boolean => {
  const normalizedPath = path.resolve(targetPath).toLowerCase();
  return allowedDirs.some((dir) => {
    const normalizedDir = path.resolve(dir).toLowerCase();
    // Ensure the path is exactly the directory or inside it (prevents "Books" matching "Bookshelf")
    return (
      normalizedPath === normalizedDir ||
      normalizedPath.startsWith(normalizedDir + path.sep)
    );
  });
};

// Security: Sanitize path to prevent traversal
const sanitizePath = (inputPath: string): string => {
  return inputPath
    .replace(/\.\./g, "") // Remove directory traversal
    .replace(/[<>:"|?*]/g, ""); // Remove invalid characters
};

// Robust path resolution logic (used by multiple handlers)
const resolveToAbsolutePath = (requestedPath: string): string => {
  const decodedPath = decodeURIComponent(requestedPath);
  const sanitizedPath = sanitizePath(decodedPath);
  const relativePath = sanitizedPath.startsWith("/")
    ? sanitizedPath
    : `/${sanitizedPath}`;

  let absolutePath = "";
  if (relativePath.startsWith("/attached_assets")) {
    absolutePath = path.join(DATA_ROOT, relativePath.substring(1));
  } else if (relativePath.startsWith("/books")) {
    const bookPath = relativePath.replace(/^\/books\/?/, "");
    absolutePath = path.join(BOOKS_DIR, bookPath);
  } else if (relativePath.startsWith("/covers")) {
    const coverPath = relativePath.replace(/^\/covers\/?/, "");
    absolutePath = path.join(COVERS_DIR, coverPath);
  } else {
    let cleanPath = decodedPath;
    if (cleanPath.match(/^\/[a-zA-Z]:/)) {
      cleanPath = cleanPath.substring(1);
    }
    absolutePath = path.resolve(DATA_ROOT, cleanPath);
  }
  return absolutePath;
};

// IPC Handlers
ipcMain.handle("open-external", async (_event, filePath: string) => {
  try {
    // Security: Validate input
    if (typeof filePath !== "string" || !filePath) {
      throw new Error("Invalid file path");
    }

    const absolutePath = resolveToAbsolutePath(filePath);

    // Security: Verify path is within allowed directories
    const allowed = isPathSafe(absolutePath, [
      ATTACHED_ASSETS_DIR,
      BOOKS_DIR,
      COVERS_DIR,
      DATA_ROOT,
    ]);

    if (!allowed) {
      console.error(`[IPC] Security: Blocked access to ${absolutePath}`);
      throw new Error("Access denied: Path outside allowed directories");
    }

    console.log(`[IPC] Opening: ${absolutePath}`);

    if (!fs.existsSync(absolutePath)) {
      console.error(`[IPC] File NOT found: ${absolutePath}`);
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${absolutePath}`);
      }
      return await shell.openPath(filePath);
    }

    await shell.openPath(absolutePath);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to open file externally:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("read-file-content", async (_event, filePath: string) => {
  const logPath = path.join(app.getPath("desktop"), "library_debug.log");
  const log = (msg: string) => {
    const entry = `[${new Date().toISOString()}] [READ-FILE] ${msg}\n`;
    fs.appendFileSync(logPath, entry);
    console.log(entry);
  };

  try {
    log(`Request for: ${filePath}`);
    log(`DATA_ROOT: ${DATA_ROOT}`);
    log(`BOOKS_DIR: ${BOOKS_DIR}`);

    const absolutePath = resolveToAbsolutePath(filePath);
    log(`Resolved to: ${absolutePath}`);

    const pathSafe = isPathSafe(absolutePath, [
      ATTACHED_ASSETS_DIR,
      BOOKS_DIR,
      COVERS_DIR,
    ]);
    log(`Path safe check: ${pathSafe}`);

    if (!pathSafe) {
      log(`Access denied - path not in allowed directories`);
      throw new Error("Access denied");
    }

    const exists = fs.existsSync(absolutePath);
    log(`File exists: ${exists}`);

    if (!exists) {
      log(`File not found at: ${absolutePath}`);
      throw new Error("File not found");
    }

    const buffer = fs.readFileSync(absolutePath);
    log(`Successfully read ${buffer.length} bytes`);
    return buffer; // Electron handles Buffer to Uint8Array conversion automatically
  } catch (error: any) {
    const errLog = path.join(DATA_ROOT, "app.log");
    fs.appendFileSync(
      errLog,
      `[${new Date().toISOString()}] [READ-FILE-ERROR] ${error.message}\n`,
    );
    console.error("Failed to read file content:", error);
    throw error;
  }
});

ipcMain.handle("write-log", async (_event, { level, message, context }) => {
  try {
    const logFile = path.join(app.getPath("desktop"), "library_debug.log");
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message} ${context ? JSON.stringify(context) : ""}\n`;
    fs.appendFileSync(logFile, logEntry);
    return { success: true };
  } catch (err) {
    console.error("Failed to write log:", err);
    return { success: false };
  }
});

ipcMain.handle("download-file", async (_event, { url, fileName }) => {
  try {
    const result = await dialog.showSaveDialog({
      defaultPath: fileName,
      title: "حفظ الكتاب",
      filters: [{ name: "PDF Files", extensions: ["pdf"] }],
    });

    if (result.canceled || !result.filePath) return { success: false };

    // Resolve the actual source path
    const decodedUrl = decodeURIComponent(url);
    const sanitizedPath = sanitizePath(decodedUrl);
    const relativePath = sanitizedPath.startsWith("/")
      ? sanitizedPath
      : `/${sanitizedPath}`;
    let sourcePath = sanitizedPath;

    if (relativePath.startsWith("/attached_assets")) {
      sourcePath = path.join(DATA_ROOT, relativePath.substring(1));
    } else if (relativePath.startsWith("/books")) {
      sourcePath = path.join(BOOKS_DIR, path.basename(sanitizedPath));
    } else if (relativePath.startsWith("/covers")) {
      sourcePath = path.join(COVERS_DIR, path.basename(sanitizedPath));
    } else {
      sourcePath = path.resolve(DATA_ROOT, sanitizedPath);
    }

    if (!fs.existsSync(sourcePath)) {
      // Try as absolute path if not found in data root
      if (fs.existsSync(url)) {
        sourcePath = url;
      } else {
        throw new Error(`الملف غير موجود: ${sourcePath}`);
      }
    }

    // Copy the file to the destination
    fs.copyFileSync(sourcePath, result.filePath);
    return { success: true, filePath: result.filePath };
  } catch (error: any) {
    console.error("Failed to download/save file:", error);
    return { success: false, error: error.message };
  }
});

async function createWindow() {
  try {
    // Force 127.0.0.1 and PORT 5000 explicitly
    await startServer(PORT, app.isPackaged, DATA_ROOT);
  } catch (err) {
    console.error("Failed to start server:", err);
  }

  const preloadPath = path.join(currentDir, "preload.cjs");

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Don't show the window until it's ready, prevents white flash
    backgroundColor: "#1a1a1a", // Set a dark background color
    ...commonOptions,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      webSecurity: true, // Security: Enabled for production
      sandbox: true, // Security: Enable sandboxing
      // @ts-ignore - Enable plugins for PDF viewing support
      plugins: true,
    },
  });

  // Handle new windows (e.g. from window.open) to ensure they have the right title and icon
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    return {
      action: "allow",
      overrideBrowserWindowOptions: {
        ...commonOptions,
        autoHideMenuBar: true,
      },
    };
  });

  // Show window when it's ready to avoid white flash
  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  mainWindow.setMenu(null);

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(APP_ROOT, "dist/index.html"));
  }

  // Debug: Always open DevTools to see console errors in EXE
  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Startup logging to diagnose path issues
  const startupLog = path.join(app.getPath("desktop"), "library_debug.log");
  try {
    fs.appendFileSync(
      startupLog,
      `\n[${new Date().toISOString()}] [STARTUP] App started\n`,
    );
    fs.appendFileSync(
      startupLog,
      `[${new Date().toISOString()}] [STARTUP] DATA_ROOT: ${DATA_ROOT}\n`,
    );
    fs.appendFileSync(
      startupLog,
      `[${new Date().toISOString()}] [STARTUP] BOOKS_DIR: ${BOOKS_DIR}\n`,
    );
    fs.appendFileSync(
      startupLog,
      `[${new Date().toISOString()}] [STARTUP] app.isPackaged: ${app.isPackaged}\n`,
    );
  } catch (e) {
    console.error("Failed to write startup log:", e);
  }

  // Handle the custom protocol with security validation
  protocol.handle("safe-file", async (request) => {
    try {
      const requestedUrl = request.url.replace("safe-file://", "");
      const absolutePath = resolveToAbsolutePath(requestedUrl);

      // Security: Validate path is within allowed directories
      const allowed = isPathSafe(absolutePath, [
        ATTACHED_ASSETS_DIR,
        BOOKS_DIR,
        COVERS_DIR,
        DATA_ROOT,
      ]);

      if (!allowed) {
        console.error(`[Protocol] Security: Blocked access to ${absolutePath}`);
        return new Response("Access denied", { status: 403 });
      }

      console.log(`[Protocol] Serving: ${absolutePath}`);

      if (!fs.existsSync(absolutePath)) {
        console.error(`[Protocol] File NOT found: ${absolutePath}`);
        return new Response("File not found", { status: 404 });
      }

      const response = await net.fetch(pathToFileURL(absolutePath).toString());

      // If it's a PDF file, ensure the correct Content-Type is set
      if (absolutePath.toLowerCase().endsWith(".pdf")) {
        const headers = new Headers(response.headers);
        headers.set("Content-Type", "application/pdf");
        headers.set("Content-Disposition", "inline");
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }

      return response;
    } catch (error) {
      console.error("[Protocol] Error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  });

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});
