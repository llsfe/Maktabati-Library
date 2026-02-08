import { contextBridge, ipcRenderer } from "electron";

// Security: Input validation helpers
const isValidString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.length < 1000;

const isValidPath = (path: string): boolean =>
  !path.includes("..") &&
  (path.startsWith("/attached_assets") ||
    path.startsWith("/books") ||
    path.startsWith("http"));

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  openExternal: (filePath: string) => {
    // Security: Validate input before sending to main process
    if (!isValidString(filePath)) {
      return Promise.resolve({ success: false, error: "Invalid file path" });
    }
    if (!isValidPath(filePath)) {
      return Promise.resolve({ success: false, error: "Path not allowed" });
    }
    return ipcRenderer.invoke("open-external", filePath);
  },
  readFileContent: (filePath: string) => {
    if (!isValidString(filePath)) return Promise.reject("Invalid path");
    return ipcRenderer.invoke("read-file-content", filePath);
  },
  writeLog: (args: { level: string; message: string; context?: any }) => {
    return ipcRenderer.invoke("write-log", args);
  },
  downloadFile: (args: { url: string; fileName: string }) => {
    if (!isValidString(args.url) || !isValidString(args.fileName)) {
      return Promise.resolve({ success: false });
    }
    return ipcRenderer.invoke("download-file", args);
  },
});
