import { Search, Filter, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { BookDialog } from "./BookDialog";
import { useState } from "react";

interface HeaderProps {
  onSearch: (query: string) => void;
  onToggleFilter: () => void;
}

export function Header({ onSearch, onToggleFilter }: HeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [location] = useLocation();

  const getPageTitle = () => {
    switch (location) {
      case "/reading": return "أقرأ حالياً";
      case "/history": return "سجل القراءة";
      default: return "المكتبة";
    }
  };

  const getPageSubtitle = () => {
    switch (location) {
      case "/reading": return "تابع تقدمك في الكتب التي تقرأها";
      case "/history": return "أرشيف بجميع الكتب التي أتممتها";
      default: return "استعرض ونظم مجموعتك من الكتب الرقمية";
    }
  };

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-8 py-6 backdrop-blur-md">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Right Side: Page Title */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{getPageTitle()}</h1>
          <p className="text-sm text-muted-foreground font-medium">{getPageSubtitle()}</p>
        </div>

        {/* Left Side: Actions */}
        <div className="flex flex-1 items-center gap-4 md:max-w-lg md:justify-end">
          <div className="relative w-full max-w-sm">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ابحث عن كتاب، مؤلف..."
              className="w-full rounded-xl border-border bg-secondary/50 pr-10 text-sm focus:border-primary focus:ring-primary/20"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onToggleFilter}
            className="shrink-0 rounded-xl border-border bg-secondary/30 hover:bg-secondary hover:text-accent"
          >
            <Filter className="h-5 w-5" />
          </Button>

          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="shrink-0 gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30"
          >
            <Plus className="h-5 w-5" />
            <span>إضافة كتاب</span>
          </Button>

          <BookDialog 
            open={isDialogOpen} 
            onOpenChange={setIsDialogOpen} 
          />
        </div>
      </div>
    </header>
  );
}
