import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { BookCard } from "@/components/BookCard";
import { useBooks } from "@/hooks/use-books";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Edit, Settings, FileText } from "lucide-react";
import { 
  ContextMenu, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuTrigger 
} from "@/components/ui/context-menu";
import { BookDialog } from "@/components/BookDialog";
import { Book } from "@shared/schema";

interface LibraryPageProps {
  statusFilter?: string;
}

export default function LibraryPage({ statusFilter }: LibraryPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const { data: books, isLoading, error } = useBooks({ 
    status: statusFilter, 
    search: searchQuery,
    ...activeFilters
  });

  const handleOpenBook = (book: Book) => {
    if (book.fileUrl) {
      window.open(book.fileUrl, "_blank");
    } else {
      // Mock open for demonstration if no fileUrl
      window.open(`https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`, "_blank");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar - Fixed width */}
      <aside className="hidden md:block shrink-0 z-20">
        <Sidebar 
          showFilter={showFilter} 
          onCloseFilter={() => setShowFilter(false)} 
          onFilterChange={setActiveFilters}
        />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Header 
          onSearch={setSearchQuery} 
          onToggleFilter={() => setShowFilter(!showFilter)}
        />

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {isLoading ? (
            <div className="flex h-[50vh] w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex h-[50vh] w-full flex-col items-center justify-center text-center">
              <p className="text-destructive mb-2 font-bold text-lg">حدث خطأ أثناء تحميل الكتب</p>
              <p className="text-muted-foreground text-sm">يرجى المحاولة مرة أخرى لاحقاً</p>
            </div>
          ) : !books || books.length === 0 ? (
            <div className="flex h-[50vh] w-full flex-col items-center justify-center text-center opacity-60">
              <div className="mb-4 rounded-full bg-muted p-6">
                <span className="text-4xl">📚</span>
              </div>
              <h3 className="text-xl font-bold mb-1">لا توجد كتب هنا</h3>
              <p className="text-muted-foreground">أضف بعض الكتب لبدء مكتبتك الخاصة</p>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
              layout
            >
              <AnimatePresence>
                {books.map((book) => (
                  <ContextMenu key={book.id}>
                    <ContextMenuTrigger>
                      <motion.div 
                        layout 
                        onClick={() => handleOpenBook(book)} 
                        className="cursor-pointer"
                      >
                        <BookCard book={book} />
                      </motion.div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-56 font-cairo">
                      <ContextMenuItem onClick={() => handleOpenBook(book)} className="gap-2">
                        <FileText className="h-4 w-4" />
                        <span>فتح الكتاب</span>
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => setEditingBook(book)} className="gap-2">
                        <Edit className="h-4 w-4" />
                        <span>تعديل البيانات</span>
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => setEditingBook(book)} className="gap-2">
                        <Settings className="h-4 w-4" />
                        <span>إعدادات الكتاب</span>
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
    </div>
  );
}
