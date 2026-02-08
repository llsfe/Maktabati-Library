// PDF Viewer Dialog using react-pdf - Professional Implementation
import {
  Dialog as RadixDialog,
  DialogContent as RadixDialogContent,
  DialogHeader as RadixDialogHeader,
  DialogTitle as RadixDialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ChevronLeft,
  ZoomOut,
  ZoomIn,
  Maximize2,
  Minimize2,
  X,
  ExternalLink,
  Download,
  RotateCcw,
  Loader2,
  Search,
  BookOpen,
  Edit2,
  Check,
} from "lucide-react";

import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Document, Page, pdfjs } from "react-pdf";
import { Book } from "@shared/schema";
import { useUpdateBook } from "@/hooks/use-books";
import debounce from "lodash.debounce";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set worker URL for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: Book | null;
}

declare global {
  interface Window {
    electronAPI?: {
      isElectron?: boolean;
      openExternal: (
        path: string,
      ) => Promise<{ success: boolean; error?: string }>;
      readFileContent: (path: string) => Promise<Uint8Array>;
      writeLog: (args: {
        level: "info" | "error" | "warn";
        message: string;
        context?: any;
      }) => Promise<{ success: boolean }>;
      downloadFile: (args: {
        url: string;
        fileName: string;
      }) => Promise<{ success: boolean; filePath?: string }>;
    };
  }
}

export function PDFViewerDialog({
  open,
  onOpenChange,
  book,
}: PDFViewerDialogProps) {
  const fileUrl = book?.fileUrl || "";
  const title = book?.title || "";

  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(book?.lastReadPage || 1);
  const [scale, setScale] = useState(1.0);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [inputPage, setInputPage] = useState(String(pageNumber));
  const { mutate: updateBook } = useUpdateBook();

  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const isElectron = window.electronAPI?.isElectron === true;

  // Use the safe-file protocol if in Electron, otherwise use direct URL
  const secureUrl = isElectron ? `safe-file://${fileUrl}` : fileUrl;

  // Function to log errors back to the main process
  const logToMain = (message: string, context?: any) => {
    window.electronAPI?.writeLog({ level: "error", message, context });
  };

  // Reset state when file changes or dialog opens
  useEffect(() => {
    if (open && book) {
      setPageNumber(book.lastReadPage || 1);
      setScale(1.0);
      setIsLoading(true);
      setPdfData(null);

      // In Electron, fetch raw file content to bypass protocol/security issues
      if (isElectron && window.electronAPI && book.fileUrl) {
        window.electronAPI
          .readFileContent(book.fileUrl)
          .then((data) => {
            setPdfData(data);
          })
          .catch((err) => {
            console.error("Failed to read PDF file via IPC:", err);
            logToMain("Failed to read PDF file via IPC", {
              err: err.message,
              fileUrl: book.fileUrl,
            });
            setIsLoading(false);
          });
      }
    }
  }, [open, book?.id]);

  // Debounced save for reading progress
  const debouncedSaveProgress = useMemo(
    () =>
      debounce((bookId: number, page: number, total: number) => {
        updateBook({ id: bookId, lastReadPage: page, totalPages: total });
      }, 1000),
    [updateBook],
  );

  useEffect(() => {
    if (
      open &&
      book &&
      (pageNumber !== book.lastReadPage || numPages !== book.totalPages)
    ) {
      debouncedSaveProgress(book.id, pageNumber, numPages);
    }
  }, [pageNumber, numPages, book?.id, open]);

  useEffect(() => {
    return () => {
      debouncedSaveProgress.cancel();
    };
  }, [debouncedSaveProgress]);

  // Handle Ctrl + Scroll for Zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          // scroll up -> zoom in
          setScale((prev) => Math.min(prev + 0.1, 3.0));
        } else {
          // scroll down -> zoom out
          setScale((prev) => Math.max(prev - 0.1, 0.5));
        }
      }
    };

    if (open) {
      window.addEventListener("wheel", handleWheel, { passive: false });
    }
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [open]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
    // If we don't have total pages saved, save it now
    if (book && (!book.totalPages || book.totalPages === 0)) {
      updateBook({ id: book.id, totalPages: numPages });
    }
  }

  function onDocumentLoadError(error: Error) {
    console.error("Error loading PDF:", error);
    logToMain("react-pdf Document Load Error", {
      error: error.message,
      fileUrl: book?.fileUrl,
      hasData: !!pdfData,
      dataLength: pdfData?.length,
    });
    setIsLoading(false);
  }

  const handleOpenExternal = async () => {
    if (isElectron && window.electronAPI) {
      const result = await window.electronAPI.openExternal(fileUrl);
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "خطأ في فتح الملف",
          description: result.error || "فشل فتح الملف في النظام الخارجي.",
        });
      }
    } else {
      window.open(secureUrl, "_blank");
    }
  };

  const handleDownload = async () => {
    // Sanitized filename
    const cleanTitle = (title || "book").replace(/[/\\?%*:|"<>]/g, "-");
    const fileName = `${cleanTitle}.pdf`;

    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.downloadFile({
          url: fileUrl,
          fileName,
        });
        if (result.success && result.filePath) {
          toast({
            title: "تم التحميل بنجاح",
            description: `تم حفظ نسخة من الكتاب في: ${result.filePath}`,
            variant: "default",
          });
        }
      } catch (error: any) {
        toast({
          title: "خطأ في التحميل",
          description: error.message || "حدث خطأ غير متوقع أثناء حفظ الملف",
          variant: "destructive",
        });
      }
    } else {
      const link = document.createElement("a");
      link.href = secureUrl;
      link.download = fileName;
      link.click();
      toast({
        title: "بدأ التحميل",
        description: "يتم تحميل الملف عبر المتصفح",
      });
    }
  };

  const goToPrevPage = () => {
    const newPage = Math.max(pageNumber - 1, 1);
    setPageNumber(newPage);
    setInputPage(String(newPage));
  };
  const goToNextPage = () => {
    const newPage = Math.min(pageNumber + 1, numPages || pageNumber);
    setPageNumber(newPage);
    setInputPage(String(newPage));
  };
  const handlePageSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const newPage = parseInt(inputPage);
    if (!isNaN(newPage) && newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
      setIsEditingPage(false);
    } else {
      setInputPage(String(pageNumber));
      setIsEditingPage(false);
    }
  };
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));

  const progress = numPages > 0 ? (pageNumber / numPages) * 100 : 0;

  return (
    <RadixDialog open={open} onOpenChange={onOpenChange}>
      <RadixDialogContent
        className={cn(
          "bg-background border-border transition-all duration-300 p-0 flex flex-col [&>button]:hidden",
          isFullScreen
            ? "max-w-none w-screen h-screen rounded-none z-[100]"
            : "sm:max-w-[95vw] h-[95vh] rounded-2xl shadow-2xl overflow-hidden border-2",
        )}
      >
        <RadixDialogHeader className="p-4 bg-card border-b border-border flex flex-row items-center justify-between space-y-0 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-primary/10 p-2 rounded-lg" title="قراءة الكتاب">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>

            <RadixDialogTitle className="text-foreground font-bold text-lg truncate max-w-[200px] md:max-w-md">
              {title || "قراءة الكتاب"}
            </RadixDialogTitle>
          </div>

          <div className="flex items-center gap-2">
            {/* Navigation Controls */}
            {!isLoading && numPages && (
              <div className="flex items-center bg-secondary/30 rounded-xl p-1 gap-1 border border-border/50 mr-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {isEditingPage ? (
                  <form
                    onSubmit={handlePageSubmit}
                    className="flex items-center gap-1 mx-2"
                  >
                    <input
                      autoFocus
                      type="text"
                      value={inputPage}
                      onChange={(e) => setInputPage(e.target.value)}
                      onBlur={() => handlePageSubmit()}
                      className="w-12 h-7 bg-background border border-primary/30 rounded text-center text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground">
                      / {numPages}
                    </span>
                  </form>
                ) : (
                  <div
                    className="group flex items-center gap-1 px-3 py-1 hover:bg-primary/5 rounded-md cursor-pointer transition-colors"
                    onClick={() => {
                      setInputPage(String(pageNumber));
                      setIsEditingPage(true);
                    }}
                  >
                    <span className="text-xs font-bold text-primary leading-none">
                      صفحة {pageNumber} من {numPages}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-md mr-1 leading-none">
                      {Math.round(progress)}%
                    </span>
                    <Edit2 className="h-3 w-3 text-primary/40 group-hover:text-primary transition-colors" />
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="hidden md:flex items-center bg-secondary/30 rounded-xl p-1 gap-1 border border-border/50 mr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={zoomOut}
                className="h-8 w-8"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium px-1 min-w-[40px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={zoomIn}
                className="h-8 w-8"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center bg-secondary/30 rounded-xl p-1 gap-1 border border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenExternal}
                className="text-primary hover:text-primary hover:bg-primary/10 h-9 gap-2 px-4 font-bold rounded-lg"
                title="فتح في تطبيق خارجي"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden lg:inline text-xs">فتح خارجي</span>
              </Button>
              <div className="w-px h-5 bg-border/50 mx-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="text-muted-foreground hover:text-foreground hover:bg-background/50 h-9 gap-2 px-4 font-bold rounded-lg"
                title="تحميل الكتاب"
              >
                <Download className="h-4 w-4" />
                <span className="hidden lg:inline text-xs">تحميل</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors h-10 w-10 ml-2"
            >
              {isFullScreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors h-10 w-10 border border-transparent hover:border-destructive/20"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </RadixDialogHeader>

        {/* Premium Progress Bar */}
        {!isLoading && numPages > 0 && (
          <div className="h-1.5 w-full bg-secondary/20 relative overflow-hidden shrink-0">
            <div
              className="absolute top-0 bottom-0 right-0 bg-primary transition-all duration-500 ease-out shadow-[0_0_8px_rgba(var(--primary),0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="flex-1 relative bg-neutral-900 flex flex-col items-center overflow-auto p-4 custom-scrollbar">
          {pdfData || (!isElectron && secureUrl) ? (
            <div className="min-h-full flex items-center justify-center">
              <Document
                file={isElectron ? { data: pdfData || undefined } : secureUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex flex-col items-center justify-center text-muted-foreground py-20">
                    <Loader2 className="h-12 w-12 mb-4 animate-spin opacity-50" />
                    <p className="font-medium text-lg">جاري تحميل الصفحات...</p>
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center text-destructive py-20">
                    <X className="h-12 w-12 mb-4 opacity-50" />
                    <p className="font-medium text-lg">
                      فشل تحميل الملف. يرجى التأكد من مسار الملف أو فتحه
                      خارجياً.
                    </p>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  className="shadow-2xl border-4 border-white/5"
                  renderAnnotationLayer={true}
                  renderTextLayer={true}
                  loading={
                    <div className="bg-white/5 w-[600px] h-[800px] animate-pulse rounded-lg" />
                  }
                />
              </Document>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground h-full">
              <Loader2 className="h-12 w-12 mb-4 animate-spin opacity-20" />
              <p className="font-medium italic text-lg">
                بانتظار معالجة طلب القراءة...
              </p>
            </div>
          )}
        </div>
      </RadixDialogContent>
    </RadixDialog>
  );
}
