import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  BookOpen,
  Book,
  History,
  Library,
  Sun,
  Moon,
  ChevronRight,
  ChevronLeft,
  Filter as FilterIcon,
  Search,
  XCircle,
  Star,
  Heart,
  PenTool,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditorToolbar } from "@/components/EditorToolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsDialog } from "./SettingsDialog";

const navigation = [
  { name: "المكتبة", href: "/", icon: LayoutGrid },
  { name: "أقرأ حالياً", href: "/reading", icon: BookOpen },
  { name: "سجل القراءة", href: "/history", icon: History },
];

interface SidebarProps {
  showFilter?: boolean;
  onCloseFilter?: () => void;
  onFilterChange?: (filters: any) => void;
  editor?: any;
  showEditorTools?: boolean;
  onCloseEditorTools?: () => void;
}

export function Sidebar({
  showFilter,
  onCloseFilter,
  onFilterChange,
  editor,
  showEditorTools,
  onCloseEditorTools,
}: SidebarProps) {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "dark";
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Auto-expand sidebar when tools are shown
  useEffect(() => {
    if (showEditorTools && isCollapsed) {
      setIsCollapsed(false);
    }
  }, [showEditorTools]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [isFavorite, setIsFavorite] = useState<boolean | undefined>(undefined);
  const [minRating, setMinRating] = useState<number>(0);
  const [tag, setTag] = useState("");

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const updateFilters = (updates: any) => {
    // Collect effective values, preferring explicit updates over current state
    const effectiveSearch =
      updates.search !== undefined ? updates.search : search;
    const effectiveCategory =
      updates.category !== undefined
        ? updates.category === "all"
          ? ""
          : updates.category
        : category === "all"
          ? ""
          : category;
    const effectiveFavorite =
      updates.isFavorite !== undefined ? updates.isFavorite : isFavorite;
    const effectiveRating =
      updates.minRating !== undefined ? updates.minRating : minRating;
    const effectiveTag = updates.tag !== undefined ? updates.tag : tag;

    onFilterChange?.({
      search: effectiveSearch,
      category: effectiveCategory,
      isFavorite: effectiveFavorite,
      minRating: effectiveRating,
      tag: effectiveTag,
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    updateFilters({ search: value });
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    updateFilters({ category: value });
  };

  const handleFavoriteToggle = () => {
    const newVal = isFavorite ? undefined : true;
    setIsFavorite(newVal);
    updateFilters({ isFavorite: newVal });
  };

  const handleRatingChange = (val: number) => {
    const newVal = minRating === val ? 0 : val;
    setMinRating(newVal);
    updateFilters({ minRating: newVal });
  };

  const handleTagChange = (value: string) => {
    setTag(value);
    updateFilters({ tag: value });
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setIsFavorite(undefined);
    setMinRating(0);
    setTag("");
    onFilterChange?.({
      search: "",
      category: "",
      isFavorite: undefined,
      minRating: 0,
      tag: "",
    });
  };

  return (
    <>
      <div
        className={cn(
          "relative flex h-full flex-col border-l border-border bg-card shadow-xl transition-all duration-300",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute -left-4 top-6 z-50 h-8 w-8 rounded-full transition-all duration-300",
            "bg-transparent text-[#f59e0b] drop-shadow-md",
            "hover:bg-[#f59e0b] hover:text-white hover:scale-110 hover:shadow-[0_4px_12px_rgba(245,158,11,0.5)]",
            "group flex items-center justify-center",
          )}
          title={isCollapsed ? "فتح القائمة" : "طي القائمة"}
        >
          {isCollapsed ? (
            <Book className="h-4 w-4 stroke-[2.5] fill-[#f59e0b] transition-all duration-300 group-hover:fill-white group-hover:scale-110" />
          ) : (
            <BookOpen className="h-4 w-4 stroke-[2.5] fill-[#f59e0b] transition-all duration-300 group-hover:fill-white group-hover:scale-110" />
          )}
        </Button>

        <div
          className={cn(
            "flex h-20 items-center gap-3 px-6",
            isCollapsed && "justify-center px-0",
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Library className="h-6 w-6 text-primary" />
          </div>
          {!isCollapsed && (
            <span className="text-2xl font-bold text-foreground">مكتبتي</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
          {showEditorTools && editor && !isCollapsed ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-primary" />
                  أدوات التنسيق
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCloseEditorTools}
                  className="h-7 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                >
                  إغلاق
                </Button>
              </div>

              <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
                <EditorToolbar editor={editor} orientation="vertical" />
              </div>
            </div>
          ) : showFilter && !isCollapsed ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FilterIcon className="h-4 w-4 text-primary" />
                  تصفية الكتب
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCloseFilter}
                  className="h-7 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                >
                  إغلاق
                </Button>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                    بحث بالعنوان
                  </label>
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      placeholder="ابحث عن كتاب..."
                      value={search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-9 bg-secondary/20 border-border/50 focus:border-primary/50 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                    التصنيف
                  </label>
                  <Select value={category} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="bg-secondary/20 border-border/50 focus:ring-primary/20">
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border shadow-2xl">
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="تكنولوجيا">تكنولوجيا</SelectItem>
                      <SelectItem value="تاريخ">تاريخ</SelectItem>
                      <SelectItem value="فنون">فنون</SelectItem>
                      <SelectItem value="علوم">علوم</SelectItem>
                      <SelectItem value="فلسفة">فلسفة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 pt-2 border-t border-border/30">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      المفضلة فقط
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleFavoriteToggle}
                      className={cn(
                        "h-8 w-8 rounded-full transition-all",
                        isFavorite
                          ? "bg-red-500/10 text-red-500"
                          : "text-muted-foreground/40 hover:text-muted-foreground",
                      )}
                    >
                      <Heart
                        className={cn("h-4 w-4", isFavorite && "fill-current")}
                      />
                    </Button>
                  </div>

                  <div className="space-y-2 px-1">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      الحد الأدنى للتقييم
                    </label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleRatingChange(s)}
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-lg border transition-all",
                            s <= minRating
                              ? "border-yellow-400 bg-yellow-400/10 text-yellow-500 shadow-sm"
                              : "border-border/50 bg-secondary/10 text-muted-foreground/40 hover:border-border hover:text-muted-foreground",
                          )}
                        >
                          <Star
                            className={cn(
                              "h-3.5 w-3.5",
                              s <= minRating && "fill-current",
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                      الوسوم
                    </label>
                    <Input
                      placeholder="بحث بالوسوم..."
                      value={tag}
                      onChange={(e) => handleTagChange(e.target.value)}
                      className="h-8 text-xs bg-secondary/20 border-border/50 focus:border-primary/50"
                    />
                  </div>
                </div>

                {(search ||
                  category !== "all" ||
                  isFavorite !== undefined ||
                  minRating > 0 ||
                  tag) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full h-8 text-[11px] font-medium gap-2 border-dashed border-primary/30 hover:bg-primary/5 hover:border-primary/50 text-primary transition-all duration-200"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    مسح جميع الفلاتر
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "text-muted-foreground hover:bg-accent/10 hover:text-accent",
                      isCollapsed && "justify-center px-0",
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5",
                        isActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground",
                      )}
                    />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div
          className={cn(
            "p-6 space-y-4",
            isCollapsed && "px-0 items-center flex flex-col",
          )}
        >
          {!isCollapsed && (
            <div className="rounded-xl bg-secondary/50 p-4 border border-border/50">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-foreground">
                  الإعدادات
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSettingsOpen(true)}
                  className="h-8 w-8 rounded-lg hover:bg-background"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              className="h-10 w-10 rounded-xl hover:bg-accent/10"
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}

          <p
            className={cn(
              "text-[10px] text-muted-foreground text-center opacity-50",
              isCollapsed && "hidden",
            )}
          >
            إصدار تجريبي v1.3
          </p>
        </div>
      </div>

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        theme={theme}
        onThemeChange={toggleTheme}
      />
    </>
  );
}
