import { Book } from "@shared/schema";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, BookOpen } from "lucide-react";
import { useState } from "react";
import { BookDialog } from "./BookDialog";

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "reading":
        return (
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
            <BookOpen className="h-3 w-3" />
            <span>جاري القراءة</span>
          </div>
        );
      case "completed":
        return (
          <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-bold text-green-500 border border-green-500/20">
            <CheckCircle2 className="h-3 w-3" />
            <span>تمت قراءته</span>
          </div>
        );
      case "planned":
        return (
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground border border-border">
            <Clock className="h-3 w-3" />
            <span>سأقرأه</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -5 }}
        onClick={() => setIsEditOpen(true)}
        className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:border-primary/50"
      >
        <div className="aspect-[2/3] w-full overflow-hidden bg-secondary relative">
          {/* Fallback pattern if image fails or isn't provided */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary to-background p-6">
            <BookOpen className="h-12 w-12 text-muted-foreground/20" />
          </div>
          <img
            src={book.coverUrl}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 relative z-10"
            onError={(e) => {
              (e.target as HTMLImageElement).style.opacity = "0"; // Hide broken image to show fallback
            }}
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 z-20" />
          
          <div className="absolute bottom-3 right-3 z-30">
            {getStatusBadge(book.status)}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-1 text-lg font-bold text-foreground group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          <p className="mb-3 text-sm font-medium text-muted-foreground">{book.author}</p>

          {book.status === "reading" && (
            <div className="mb-4 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>التقدم</span>
                <span>65%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-[65%] rounded-full bg-primary shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              </div>
            </div>
          )}

          <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3 text-xs font-medium text-muted-foreground">
            <span className="bg-secondary/50 px-2 py-1 rounded-md">{book.year}</span>
            <span className="text-primary/80">{book.category}</span>
          </div>
        </div>
      </motion.div>

      <BookDialog 
        book={book} 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
      />
    </>
  );
}
