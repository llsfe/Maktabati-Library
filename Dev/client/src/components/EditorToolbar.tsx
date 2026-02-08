import { useEffect, useState } from "react";
import { type Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Type,
  AlignLeft as AlignLeftIcon,
  AlignCenter as AlignCenterIcon,
  AlignRight as AlignRightIcon,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import { ColorPickerPopover } from "@/components/ColorPickerPopover";
import { HighlightColorPicker } from "@/components/HighlightColorPicker";

interface EditorToolbarProps {
  editor: Editor | null;
  orientation?: "horizontal" | "vertical";
  showSidebarToggle?: boolean;
  onToggleSidebar?: () => void;
  className?: string;
  isSidebarOpen?: boolean;
  onlyToggle?: boolean;
}

export function EditorToolbar({
  editor,
  orientation = "horizontal",
  showSidebarToggle = false,
  onToggleSidebar,
  className,
  isSidebarOpen = false,
  onlyToggle = false,
}: EditorToolbarProps) {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => forceUpdate({});

    editor.on("transaction", handleUpdate);
    editor.on("selectionUpdate", handleUpdate);

    return () => {
      editor.off("transaction", handleUpdate);
      editor.off("selectionUpdate", handleUpdate);
    };
  }, [editor]);

  if (!editor) return null;

  const isVertical = orientation === "vertical";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5",
        !isVertical && "justify-between w-full",
        isVertical && "flex-col w-full items-stretch",
        className,
      )}
    >
      {/* Sidebar Toggle Button (Far Right in RTL because it is first) */}
      {showSidebarToggle && (
        <div
          className={cn(
            "flex items-center gap-1 bg-background/40 dark:bg-black/40 p-1 rounded-xl mb-1",
            isVertical && "w-full justify-center",
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSidebar?.();
            }}
            className={cn(
              "h-8 w-8 p-0 rounded-lg transition-all hover:bg-primary/20 hover:text-primary",
              isSidebarOpen && "bg-primary/20 text-primary",
            )}
            title={
              isSidebarOpen
                ? "إخفاء الأدوات الجانبية"
                : "نقل الأدوات للشريط الجانبي"
            }
          >
            {isSidebarOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Tools Section - Only render if not in 'onlyToggle' mode */}
      {!onlyToggle && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-1.5",
            !isVertical && "flex-row-reverse",
            isVertical && "flex-col w-full",
          )}
        >
          {/* Colors Group */}
          <div
            className={cn(
              "flex items-center gap-1 bg-background/40 dark:bg-black/40 p-1 rounded-xl",
              isVertical && "w-full justify-center flex-wrap",
            )}
          >
            <HighlightColorPicker
              onColorChange={(color) =>
                editor.chain().focus().toggleHighlight({ color }).run()
              }
              onRemoveHighlight={() =>
                editor.chain().focus().unsetHighlight().run()
              }
              isActive={editor.isActive("highlight")}
              currentColor={
                editor.getAttributes("highlight").color || "#fef08a"
              }
            />
            <ColorPickerPopover
              onColorChange={(color) =>
                editor.chain().focus().setColor(color).run()
              }
              onRemoveColor={() => editor.chain().focus().unsetColor().run()}
              isActive={
                editor.isActive("textStyle") &&
                editor.getAttributes("textStyle").color !== "#ffffff" &&
                editor.getAttributes("textStyle").color !== "#000000"
              }
              currentColor={
                editor.getAttributes("textStyle").color || "#f59e0b"
              }
            />
          </div>

          {!isVertical && <div className="w-px h-5 bg-border mx-1" />}

          {/* Text Style Group */}
          <div
            className={cn(
              "flex items-center gap-1 bg-background/40 dark:bg-black/40 p-1 rounded-xl",
              isVertical && "w-full justify-center flex-wrap",
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn(
                "h-8 w-8 p-0 rounded-lg transition-all",
                editor.isActive("bold") &&
                  "bg-primary/20 text-primary shadow-sm shadow-primary/10",
              )}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn(
                "h-8 w-8 p-0 rounded-lg transition-all",
                editor.isActive("italic") &&
                  "bg-primary/20 text-primary shadow-sm shadow-primary/10",
              )}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={cn(
                "h-8 w-8 p-0 rounded-lg transition-all",
                editor.isActive("underline") &&
                  "bg-primary/20 text-primary shadow-sm shadow-primary/10",
              )}
              title="Underline"
            >
              <Underline className="h-4 w-4" />
            </Button>
          </div>

          {!isVertical && <div className="w-px h-5 bg-border mx-1" />}

          {/* Heading Group */}
          <div
            className={cn(
              "flex items-center gap-1 bg-background/40 dark:bg-black/40 p-1 rounded-xl",
              isVertical && "w-full justify-center flex-wrap",
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={cn(
                "h-8 w-8 p-0 px-1 font-extrabold rounded-lg transition-all",
                editor.isActive("heading", { level: 1 }) &&
                  "bg-primary/20 text-primary shadow-sm shadow-primary/10",
              )}
              title="Heading 1"
            >
              <span className="text-xs">H1</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={cn(
                "h-8 w-8 p-0 px-1 font-extrabold rounded-lg transition-all",
                editor.isActive("heading", { level: 2 }) &&
                  "bg-primary/20 text-primary shadow-sm shadow-primary/10",
              )}
              title="Heading 2"
            >
              <span className="text-xs">H2</span>
            </Button>
          </div>

          {!isVertical && <div className="w-px h-5 bg-border mx-1" />}

          {/* Alignment Group */}
          <div
            className={cn(
              "flex items-center gap-1 bg-background/40 dark:bg-black/40 p-1 rounded-xl",
              isVertical && "w-full justify-center flex-wrap",
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={cn(
                "h-8 w-8 p-0 rounded-lg transition-all",
                editor.isActive({ textAlign: "right" }) &&
                  "bg-primary/20 text-primary shadow-sm shadow-primary/10",
              )}
            >
              <AlignRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              className={cn(
                "h-8 w-8 p-0 rounded-lg transition-all",
                editor.isActive({ textAlign: "center" }) &&
                  "bg-primary/20 text-primary shadow-sm shadow-primary/10",
              )}
            >
              <AlignCenterIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={cn(
                "h-8 w-8 p-0 rounded-lg transition-all",
                editor.isActive({ textAlign: "left" }) &&
                  "bg-primary/20 text-primary shadow-sm shadow-primary/10",
              )}
            >
              <AlignLeftIcon className="h-4 w-4" />
            </Button>
          </div>

          {!isVertical && <div className="w-px h-5 bg-border mx-1" />}

          {/* Lists Group */}
          <div
            className={cn(
              "flex items-center gap-1 bg-background/40 dark:bg-black/40 p-1 rounded-xl",
              isVertical && "w-full justify-center flex-wrap",
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn(
                "h-8 w-8 p-0 rounded-lg transition-all",
                editor.isActive("bulletList") &&
                  "bg-primary/20 text-primary shadow-sm shadow-primary/10",
              )}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn(
                "h-8 w-8 p-0 rounded-lg transition-all",
                editor.isActive("orderedList") &&
                  "bg-primary/20 text-primary shadow-sm shadow-primary/10",
              )}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
