import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutGrid, BookOpen, History, Library, Sun, Moon, ChevronRight, ChevronLeft, Filter as FilterIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "المكتبة", href: "/", icon: LayoutGrid },
  { name: "أقرأ حالياً", href: "/reading", icon: BookOpen },
  { name: "سجل القراءة", href: "/history", icon: History },
];

interface SidebarProps {
  showFilter?: boolean;
  onCloseFilter?: () => void;
  onFilterChange?: (filters: any) => void;
}

export function Sidebar({ showFilter, onCloseFilter, onFilterChange }: SidebarProps) {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <div className={cn(
      "relative flex h-full flex-col border-l border-border bg-card shadow-xl transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-3 top-22 z-20 h-6 w-6 rounded-full border border-border bg-background shadow-sm hover:bg-accent"
      >
        {isCollapsed ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </Button>

      <div className={cn("flex h-20 items-center gap-3 px-6", isCollapsed && "justify-center px-0")}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Library className="h-6 w-6 text-primary" />
        </div>
        {!isCollapsed && <span className="text-2xl font-bold text-foreground">مكتبتي</span>}
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {showFilter && !isCollapsed ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FilterIcon className="h-4 w-4" />
                تصفية الكتب
              </h3>
              <Button variant="ghost" size="sm" onClick={onCloseFilter} className="h-7 px-2 text-xs">إغلاق</Button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">التصنيف</label>
                <select 
                  onChange={(e) => onFilterChange?.({ category: e.target.value })}
                  className="w-full rounded-lg border border-border bg-secondary/30 p-2 text-sm focus:ring-1 focus:ring-primary"
                >
                  <option value="">الكل</option>
                  <option value="تكنولوجيا">تكنولوجيا</option>
                  <option value="تاريخ">تاريخ</option>
                  <option value="فنون">فنون</option>
                  <option value="علوم">علوم</option>
                  <option value="فلسفة">فلسفة</option>
                </select>
              </div>
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
                    isCollapsed && "justify-center px-0"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      <div className={cn("p-6 space-y-4", isCollapsed && "px-0 items-center flex flex-col")}>
        {!isCollapsed && (
          <div className="rounded-xl bg-secondary/50 p-4 border border-border/50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-foreground">الوضع النهاري</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-8 w-8 rounded-lg hover:bg-background"
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
        
        {isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-10 w-10 rounded-xl hover:bg-accent/10"
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        )}

        <p className={cn("text-[10px] text-muted-foreground text-center opacity-50", isCollapsed && "hidden")}>
          إصدار تجريبي v1.0
        </p>
      </div>
    </div>
  );
}
