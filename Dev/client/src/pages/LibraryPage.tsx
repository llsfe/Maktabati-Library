// Library Page
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { BookCard } from "@/components/BookCard";
import { useBooks, useUpdateBook } from "@/hooks/use-books";
import { type Editor } from "@tiptap/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Edit, FileText } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { BookDialog } from "@/components/BookDialog";
import { PDFViewerDialog } from "@/components/PDFViewerDialog";
import { NotesDashboard } from "@/components/NotesDashboard";
import { Book } from "@shared/schema";
import { cn } from "@/lib/utils";

interface LibraryPageProps {
  statusFilter?: string;
}

export default function LibraryPage({ statusFilter }: LibraryPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [activeBookIdForNotes, setActiveBookIdForNotes] = useState<
    number | null
  >(null);
  const [activeBookIdForViewer, setActiveBookIdForViewer] = useState<
    number | null
  >(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const [showSidebarTools, setShowSidebarTools] = useState(false);

  const {
    data: books,
    isLoading,
    error,
  } = useBooks({
    status: statusFilter,
    search: searchQuery,
    ...activeFilters,
  });

  const updateBook = useUpdateBook();

  const handleOpenBookForNotes = (book: Book) => {
    setActiveBookIdForNotes(book.id);
    updateBook.mutate({ id: book.id, lastOpenedAt: new Date() });
  };
  const handleReadBook = (book: Book) => {
    setActiveBookIdForViewer(book.id);
    setIsViewerOpen(true);
    updateBook.mutate({ id: book.id, lastOpenedAt: new Date() });
  };

  const activeBookForNotes =
    (activeBookIdForNotes
      ? books?.find((b) => b.id === activeBookIdForNotes)
      : null) || null;
  const activeBookForViewer =
    (activeBookIdForViewer
      ? books?.find((b) => b.id === activeBookIdForViewer)
      : null) || null;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar - Fixed width */}
      <aside className="hidden md:block shrink-0 z-20">
        <Sidebar
          showFilter={showFilter}
          onCloseFilter={() => setShowFilter(false)}
          onFilterChange={setActiveFilters}
          editor={editorInstance}
          showEditorTools={showSidebarTools}
          onCloseEditorTools={() => setShowSidebarTools(false)}
        />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Header
          onSearch={setSearchQuery}
          onToggleFilter={() => setShowFilter(!showFilter)}
        />

        <div
          className={cn(
            "flex-1 overflow-y-auto custom-scrollbar",
            activeBookForNotes ? "p-0" : "p-8",
          )}
        >
          {activeBookForNotes ? (
            <NotesDashboard
              book={activeBookForNotes}
              onClose={() => {
                setActiveBookIdForNotes(null);
                setEditorInstance(null);
                setShowSidebarTools(false);
              }}
              onOpenPDF={handleReadBook}
              onEdit={(book) => setEditingBook(book)}
              onEditorReady={setEditorInstance}
              isSidebarToolsOpen={showSidebarTools}
              onToggleSidebarTools={() => setShowSidebarTools((prev) => !prev)}
            />
          ) : isLoading ? (
            <div className="flex h-[50vh] w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex h-[50vh] w-full flex-col items-center justify-center text-center">
              <p className="text-destructive mb-2 font-bold text-lg">
                حدث خطأ أثناء تحميل الكتب
              </p>
              <p className="text-muted-foreground text-sm">
                يرجى المحاولة مرة أخرى لاحقاً
              </p>
            </div>
          ) : !books || books.length === 0 ? (
            <div className="flex h-[50vh] w-full flex-col items-center justify-center text-center opacity-60">
              <div className="mb-4 rounded-full bg-muted p-6">
                <span className="text-4xl">
                  {statusFilter === "history" ? "⏳" : "📚"}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-1">
                {statusFilter === "history"
                  ? "لا توجد سجلات فتح مؤخراً"
                  : "لا توجد كتب هنا"}
              </h3>
              <p className="text-muted-foreground">
                {statusFilter === "history"
                  ? "ابدأ بقراءة الكتب أو تصفح الملاحظات لتراها هنا"
                  : "أضف بعض الكتب لبدء مكتبتك الخاصة"}
              </p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7"
              layout
            >
              <AnimatePresence>
                {books.map((book) => (
                  <ContextMenu key={book.id}>
                    <ContextMenuTrigger>
                      <motion.div
                        layout
                        onClick={() => handleOpenBookForNotes(book)}
                        className="cursor-pointer"
                      >
                        <BookCard book={book} />
                      </motion.div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-56 font-cairo">
                      <ContextMenuItem
                        onClick={() => handleReadBook(book)}
                        className="gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        <span>فتح الكتاب للقراءة</span>
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => handleOpenBookForNotes(book)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>كتابة ملاحظات</span>
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => setEditingBook(book)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>تعديل البيانات</span>
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>

      <BookDialog
        open={!!editingBook}
        onOpenChange={(open) => !open && setEditingBook(null)}
        book={editingBook || undefined}
      />

      <PDFViewerDialog
        open={isViewerOpen}
        onOpenChange={setIsViewerOpen}
        book={activeBookForViewer}
      />
    </div>
  );
}
