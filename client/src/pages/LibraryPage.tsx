import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { BookCard } from "@/components/BookCard";
import { useBooks } from "@/hooks/use-books";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LibraryPageProps {
  statusFilter?: string;
}

export default function LibraryPage({ statusFilter }: LibraryPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: books, isLoading, error } = useBooks({ 
    status: statusFilter, 
    search: searchQuery 
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar - Fixed width */}
      <aside className="hidden md:block shrink-0 z-20">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Header onSearch={setSearchQuery} />

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
                  <BookCard key={book.id} book={book} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
