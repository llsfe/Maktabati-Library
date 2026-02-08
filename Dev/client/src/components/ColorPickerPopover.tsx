import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorPickerPopoverProps {
  onColorChange: (color: string) => void;
  onRemoveColor: () => void;
  isActive: boolean;
  currentColor?: string;
}

const BASE_COLORS = [
  "#f59e0b", // Amber/Primary
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#10b981", // Green
  "#8b5cf6", // Purple
  "#ec4899", // Pink
];

export function ColorPickerPopover({
  onColorChange,
  onRemoveColor,
  isActive,
  currentColor = "#f59e0b",
}: ColorPickerPopoverProps) {
  const [customColor, setCustomColor] = useState(currentColor);
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // الكشف عن الثيم من خلال CSS
  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    };

    checkTheme();

    // مراقبة التغييرات في الثيم
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // استخدام اللون الأسود في الوضع الفاتح والأبيض في الوضع الداكن
  const removeColor = isDark ? "#ffffff" : "#000000";
  const PRESET_COLORS = [...BASE_COLORS, removeColor];

  const handleColorSelect = (color: string) => {
    setCustomColor(color);
    // التحقق من لون الإزالة (أسود أو أبيض)
    if (color === "#ffffff" || color === "#000000") {
      onRemoveColor();
      setOpen(false);
    } else {
      onColorChange(color);
    }
  };

  const handleCustomColorSubmit = () => {
    if (customColor && /^#[0-9A-F]{6}$/i.test(customColor)) {
      onColorChange(customColor);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 rounded-lg transition-all",
            isActive && "bg-primary/20 shadow-sm shadow-primary/10",
          )}
        >
          <Palette
            className="h-4 w-4"
            style={{ color: isActive ? customColor : undefined }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 font-cairo" align="start" dir="rtl">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground/80">
              كود اللون
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                placeholder="#f59e0b"
                className="font-mono text-sm flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCustomColorSubmit();
                  }
                }}
              />
              <Button
                size="sm"
                onClick={handleCustomColorSubmit}
                className="px-4"
              >
                تطبيق
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground/80">
              اختر لون جاهز
            </label>
            <div className="grid grid-cols-7 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={cn(
                    "w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 active:scale-95",
                    customColor === color
                      ? "border-foreground shadow-lg"
                      : "border-border hover:border-foreground/30",
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
