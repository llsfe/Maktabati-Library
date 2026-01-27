import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutGrid, BookOpen, History, Library, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "المكتبة", href: "/", icon: LayoutGrid },
  { name: "أقرأ حالياً", href: "/reading", icon: BookOpen },
  { name: "سجل القراءة", href: "/history", icon: History },
];

export function Sidebar() {
  const [location] = useLocation();
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
    <div className="flex h-full w-64 flex-col border-l border-border bg-card shadow-xl">
      <div className="flex h-20 items-center justify-start gap-3 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Library className="h-6 w-6 text-primary" />
        </div>
        <span className="text-2xl font-bold text-foreground">مكتبتي</span>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-6">
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
                    : "text-muted-foreground hover:bg-accent/10 hover:text-accent"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6 space-y-4">
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
        
        <p className="text-[10px] text-muted-foreground text-center opacity-50">
          إصدار تجريبي v1.0
        </p>
      </div>
    </div>
  );
}
