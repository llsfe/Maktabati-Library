import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Highlighter } from "lucide-react";
import { cn } from "@/lib/utils";

interface HighlightColorPickerProps {
  onColorChange: (color: string) => void;
  onRemoveHighlight: () => void;
  isActive: boolean;
  currentColor?: string;
}

const HIGHLIGHT_COLORS = [
  "#fef08a", // Yellow (فاتح)
  "#fca5a5", // Red (فاتح)
  "#93c5fd", // Blue (فاتح)
  "#86efac", // Green (فاتح)
  "#d8b4fe", // Purple (فاتح)
  "#fbcfe8", // Pink (فاتح)
];

export function HighlightColorPicker({
  onColorChange,
  onRemoveHighlight,
  isActive,
  currentColor = "#fef08a",
}: HighlightColorPickerProps) {
  const [customColor, setCustomColor] = useState(currentColor);
  const [open, setOpen] = useState(false);

  const handleColorSelect = (color: string) => {
    setCustomColor(color);
    onColorChange(color);
  };

  const handleRemoveHighlight = () => {
    onRemoveHighlight();
    setOpen(false);
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
            isActive &&
              "bg-yellow-400/20 text-yellow-500 shadow-sm shadow-yellow-500/10",
          )}
          title="اختيار لون التظليل"
        >
          <Highlighter
            className="h-4 w-4"
            style={{ color: isActive ? customColor : undefined }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 font-cairo" align="start" dir="rtl">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground/80">
              كود لون التظليل
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                placeholder="#fef08a"
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
              اختر لون تظليل جاهز
            </label>
            <div className="grid grid-cols-7 gap-2">
              {/* مربع إزالة التظليل */}
              <button
                onClick={handleRemoveHighlight}
                className={cn(
                  "w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 active:scale-95 relative bg-background",
                  "border-border hover:border-foreground/30",
                )}
                title="إزالة التظليل"
              >
                {/* خط قطري أحمر */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-red-500 rotate-45 origin-center" />
                </div>
              </button>

              {/* الألوان الجاهزة */}
              {HIGHLIGHT_COLORS.map((color) => (
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
