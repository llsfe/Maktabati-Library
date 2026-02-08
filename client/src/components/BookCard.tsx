import { Book } from "@shared/schema";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, BookOpen, Heart, Star } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { BookDialog } from "./BookDialog";
import { useUpdateBook } from "@/hooks/use-books";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const updateBook = useUpdateBook();

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateBook.mutate({
      id: book.id,
      isFavorite: book.isFavorite === 1 ? 0 : 1,
    });
  };

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

  const renderRating = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={cn(
              "h-2.5 w-2.5",
              s <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30",
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -5 }}
        className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:border-primary/50"
      >
        <div className="aspect-[3/4] w-full overflow-hidden bg-secondary relative">
          {/* Quick Favorite Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFavorite}
            className="absolute top-2 left-2 z-30 h-8 w-8 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 hover:text-red-400 transition-all duration-200 border border-white/10"
          >
            <Heart
              className={cn(
                "h-4 w-4",
                book.isFavorite === 1
                  ? "fill-red-500 text-red-500 scale-110"
                  : "text-white",
              )}
            />
          </Button>

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

        <div className="flex flex-1 flex-col p-3">
          <div className="flex justify-between items-start mb-1">
            <h3 className="line-clamp-1 text-base font-bold text-foreground group-hover:text-primary transition-colors flex-1">
              {book.title}
            </h3>
            {book.rating && book.rating > 0 ? renderRating(book.rating) : null}
          </div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {book.author}
          </p>

          <div className="mb-3 space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>التقدم</span>
              <span>
                {book.status === "completed"
                  ? "100%"
                  : book.status === "reading"
                    ? `${book.totalPages && book.totalPages > 0 ? Math.round(((book.lastReadPage || 1) / book.totalPages) * 100) : 0}%`
                    : "0%"}
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary shadow-[0_0_8px_rgba(245,158,11,0.4)] transition-all duration-500"
                style={{
                  width:
                    book.status === "completed"
                      ? "100%"
                      : book.status === "reading"
                        ? `${book.totalPages && book.totalPages > 0 ? Math.round(((book.lastReadPage || 1) / book.totalPages) * 100) : 0}%`
                        : "0%",
                }}
              />
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-2 text-[10px] font-medium text-muted-foreground">
            <span className="bg-secondary/50 px-1.5 py-0.5 rounded-md">
              {book.year}
            </span>
            <span className="text-primary/80">{book.category}</span>
          </div>

          {book.tags && (
            <div className="mt-2 flex flex-wrap gap-1">
              {book.tags.split(",").map((tag) => (
                <span
                  key={tag}
                  className="text-[8px] bg-primary/5 text-primary px-1 rounded-sm border border-primary/10"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}

          {book.lastOpenedAt && (
            <div className="mt-2 text-[10px] text-muted-foreground/60 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              <span>
                آخر فتح:{" "}
                {formatDistanceToNow(new Date(book.lastOpenedAt), {
                  addSuffix: true,
                  locale: ar,
                })}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
