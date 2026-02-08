import { Book } from "@shared/schema";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateBook } from "@/hooks/use-books";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  BookOpen,
  Save,
  Loader2,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Edit2,
  Check,
  X,
  AlignRight,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import debounce from "lodash.debounce";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TiptapUnderline from "@tiptap/extension-underline";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Type,
  Maximize2,
  Minimize2,
  Highlighter,
  Palette,
  AlignLeft as AlignLeftIcon,
  AlignCenter as AlignCenterIcon,
  AlignRight as AlignRightIcon,
} from "lucide-react";
import { EditorToolbar } from "@/components/EditorToolbar";

interface NotesDashboardProps {
  book: Book;
  onClose: () => void;
  onOpenPDF: (book: Book) => void;
  onEdit?: (book: Book) => void;
  onEditorReady?: (editor: any) => void;
  onToggleSidebarTools?: () => void;
  isSidebarToolsOpen?: boolean;
}

export function NotesDashboard({
  book,
  onClose,
  onOpenPDF,
  onEdit,
  onEditorReady,
  onToggleSidebarTools,
  isSidebarToolsOpen,
}: NotesDashboardProps) {
  const [notes, setNotes] = useState(book.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState(book.quote || "");
  const [activeQuote, setActiveQuote] = useState(book.quote || "");
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const { mutate: updateBook } = useUpdateBook();
  const { toast } = useToast();

  useEffect(() => {
    setQuoteDraft(book.quote || "");
    setActiveQuote(book.quote || "");
  }, [book.quote]);

  // Handle auto-save
  const debouncedSave = useCallback(
    debounce((newNotes: string) => {
      if (newNotes === book.notes) return;

      setIsSaving(true);
      updateBook(
        { id: book.id, notes: newNotes },
        {
          onSuccess: () => {
            setIsSaving(false);
          },
          onError: () => {
            setIsSaving(false);
            toast({
              variant: "destructive",
              title: "خطأ في الحفظ",
              description: "فشل الحفظ التلقائي للملاحظات.",
            });
          },
        },
      );
    }, 1500),
    [book.id, book.notes, updateBook, toast],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
      }),
      TiptapUnderline,
    ],
    content: book.notes || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-lg dark:prose-invert focus:outline-none max-w-none min-h-[300px] px-4 py-4 font-cairo",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setNotes(html);
      setIsSaving(true);
      debouncedSave(html);
    },
    onCreate: ({ editor }) => {
      onEditorReady?.(editor);
    },
  });

  useEffect(() => {
    if (editor && book.notes !== editor.getHTML()) {
      editor.commands.setContent(book.notes || "");
    }
  }, [book.notes, editor]);

  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNotes(value);
    debouncedSave(value);
  };

  const handleManualSave = () => {
    setIsSaving(true);
    updateBook(
      { id: book.id, notes },
      {
        onSuccess: () => {
          setIsSaving(false);
        },
        onError: () => {
          setIsSaving(false);
        },
      },
    );
  };

  const handleSaveQuote = () => {
    setIsSaving(true);
    updateBook(
      { id: book.id, quote: quoteDraft },
      {
        onSuccess: () => {
          setIsSaving(false);
          setIsEditingQuote(false);
          setActiveQuote(quoteDraft);
        },
        onError: () => {
          setIsSaving(false);
          toast({
            variant: "destructive",
            title: "خطأ في الحفظ",
            description: "فشل حفظ الاقتباس.",
          });
        },
      },
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col min-h-full bg-background relative font-cairo"
    >
      {/* Background decorative elements - removed yellow blurs for cleaner look */}

      {/* Top Header */}
      <header className="flex items-center justify-between px-10 py-7 bg-gradient-to-b from-background/90 via-background/60 to-transparent backdrop-blur-3xl z-20 transition-all duration-700 shadow-[0_10px_60px_-15px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            className="rounded-xl border-border/40 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 shadow-sm group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          </Button>
          <div className="flex flex-col">
            <h2 className="text-2xl font-black tracking-tight text-foreground line-clamp-1">
              {book.title}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground/80">
              <span className="font-semibold">{book.author}</span>
              <span className="opacity-40">•</span>
              <span>{book.category}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border-r border-border/40 pr-4 mr-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenPDF(book)}
              className="gap-2 font-bold px-5 h-10 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-md"
            >
              <BookOpen className="h-4 w-4" />
              <span>فتح للقراءة</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => onEdit?.(book)}
              className="gap-2 font-bold px-5 h-10 rounded-xl shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] hover:scale-105 transition-all duration-300"
            >
              <Edit2 className="h-4 w-4" />
              <span>تعديل</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        {/* Editor Area */}
        <main className="flex-1 p-4 sm:p-6 request-layout overflow-hidden flex flex-col relative w-full">
          <div className="max-w-[1920px] mx-auto w-full h-full flex flex-col">
            <header className="mb-4 flex items-center justify-between px-2">
              <div className="space-y-1">
                <h3 className="text-2xl font-black flex items-center gap-3 text-foreground/90">
                  <AlignRight className="h-6 w-6 text-primary" />
                  <span>مساحة التفكير</span>
                </h3>

                <p className="text-muted-foreground/60 text-sm font-medium pr-1">
                  سجل هنا اقتباساتك وتأملاتك
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
                className={`rounded-xl h-10 w-10 transition-all duration-300 ${showSidebar ? "text-primary" : "text-muted-foreground/40"} hover:bg-primary/20 hover:scale-110 active:scale-95`}
                title={showSidebar ? "إخفاء التفاصيل" : "إظهار التفاصيل"}
              >
                {showSidebar ? (
                  <PanelLeftClose className="h-5 w-5" />
                ) : (
                  <PanelLeftOpen className="h-5 w-5" />
                )}
              </Button>
            </header>

            <div
              className={cn(
                "flex-1 flex flex-col bg-card dark:bg-[#0a0b0d] border rounded-[2rem] transition-all duration-300",
                isEditorFocused
                  ? "border-primary/30 shadow-[0_0_0_4px_rgba(245,158,11,0.1),0_20px_80px_-20px_rgba(245,158,11,0.3)]"
                  : "border-border dark:border-white/5 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.5)]",
              )}
            >
              {editor && (
                <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1.5 bg-muted/50 dark:bg-white/5 backdrop-blur-md border-b border-border dark:border-white/10 p-3 px-4 rounded-t-[2rem]">
                  {!isSidebarToolsOpen && (
                    <EditorToolbar
                      editor={editor}
                      orientation="horizontal"
                      showSidebarToggle={true}
                      onToggleSidebar={onToggleSidebarTools}
                      isSidebarOpen={isSidebarToolsOpen}
                    />
                  )}
                  {isSidebarToolsOpen && (
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-medium pr-2">
                        الأدوات في الشريط الجانبي
                      </span>
                      <EditorToolbar
                        editor={editor}
                        orientation="horizontal"
                        showSidebarToggle={true}
                        onToggleSidebar={onToggleSidebarTools}
                        isSidebarOpen={isSidebarToolsOpen}
                        onlyToggle={true}
                        className="w-auto"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex-1 p-4 sm:p-6 relative">
                <EditorContent editor={editor} />
              </div>

              {/* Editor footer info */}
              <div className="shrink-0 px-10 py-4 bg-muted/50 dark:bg-white/5 border-t border-border dark:border-white/10 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 pointer-events-none rounded-b-[2rem]">
                <div className="flex items-center gap-2">
                  <span className="text-primary font-black">
                    {
                      notes
                        .replace(/<[^>]*>/g, "")
                        .trim()
                        .split(/\s+/)
                        .filter(Boolean).length
                    }
                  </span>
                  <span>كلمة</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-border" />
                <div className="flex items-center gap-2">
                  <span className="text-primary/70 font-black">
                    {notes.replace(/<[^>]*>/g, "").length}
                  </span>
                  <span>حرف</span>
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-1.5 opacity-80">
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isSaving ? "bg-primary animate-pulse" : "bg-green-500",
                    )}
                  />
                  <span>
                    {isSaving ? "جاري الحفظ..." : "تم الحفظ تلقائياً"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Info Sidebar */}
        <AnimatePresence mode="wait">
          {showSidebar && (
            <motion.aside
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-[22rem] bg-card/10 backdrop-blur-3xl p-10 flex flex-col h-full border-r border-white/5 overflow-y-auto custom-scrollbar shadow-[-20px_0_80px_rgba(0,0,0,0.5)] z-10"
            >
              <div className="relative group perspective-1000 mb-10">
                {/* Book Cover with 3D Effect */}
                <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/10 group-hover:rotate-y-[-5deg] transition-transform duration-700">
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-white/10 opacity-60" />
                </div>
              </div>

              <div className="space-y-8">
                <section className="space-y-3">
                  <h4 className="text-[10px] font-black text-primary/70 uppercase tracking-[0.2em]">
                    عن الكتاب
                  </h4>
                  <div className="grid gap-4">
                    <div className="bg-card/40 rounded-2xl p-4 border border-border/40 shadow-sm hover:border-primary/30 transition-colors">
                      <span className="text-[10px] block text-muted-foreground/60 mb-1 font-bold">
                        التصنيف
                      </span>
                      <span className="text-foreground font-black text-sm">
                        {book.category}
                      </span>
                    </div>

                    <div className="bg-card/40 rounded-2xl p-4 border border-border/40 shadow-sm hover:border-primary/30 transition-colors">
                      <span className="text-[10px] block text-muted-foreground/60 mb-1 font-bold">
                        سنة النشر
                      </span>
                      <span className="text-foreground font-black text-sm">
                        {book.year}
                      </span>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h4 className="text-[10px] font-black text-primary/70 uppercase tracking-[0.2em]">
                    حالة القراءة
                  </h4>
                  <div className="bg-card/40 rounded-2xl p-5 border border-border/40 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-black">
                        {book.status === "reading"
                          ? "جاري الاستمتاع بالقراءة"
                          : book.status === "completed"
                            ? "تم إنهاء الرحلة بنجاح"
                            : "في قائمة الانتظار"}
                      </span>
                      <div
                        className={`w-3 h-3 rounded-full blur-[2px] ${
                          book.status === "reading"
                            ? "bg-primary shadow-[0_0_8px_var(--primary)]"
                            : book.status === "completed"
                              ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)]"
                              : "bg-muted shadow-none"
                        }`}
                      />
                    </div>
                    {/* Dynamic Progress Bar */}
                    <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          book.status === "reading"
                            ? "bg-primary"
                            : book.status === "completed"
                              ? "bg-green-500"
                              : ""
                        }`}
                        style={{
                          width: `${
                            book.status === "completed"
                              ? 100
                              : book.totalPages && book.totalPages > 0
                                ? Math.round(
                                    ((book.lastReadPage || 0) /
                                      book.totalPages) *
                                      100,
                                  )
                                : 0
                          }%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] font-black text-muted-foreground/40">
                      <span>
                        {book.status === "completed"
                          ? "100%"
                          : book.totalPages && book.totalPages > 0
                            ? `${Math.round(
                                ((book.lastReadPage || 0) / book.totalPages) *
                                  100,
                              )}%`
                            : "0%"}
                      </span>
                      <span>التقدم</span>
                    </div>
                  </div>
                </section>
              </div>

              <ContextMenu>
                <ContextMenuTrigger>
                  <div className="mt-auto pt-10">
                    <div className="bg-primary/10 rounded-2xl p-6 border border-primary/20 text-center shadow-[0_0_40px_rgba(245,158,11,0.05)]">
                      <span className="text-[10px] font-black uppercase tracking-widest block mb-3 text-primary/80">
                        اقتباس من الكتاب
                      </span>
                      {isEditingQuote ? (
                        <div className="space-y-3">
                          <Textarea
                            value={quoteDraft}
                            onChange={(e) => setQuoteDraft(e.target.value)}
                            placeholder="اكتب هنا..."
                            className="text-xs bg-background/80 border-primary/30 min-h-[100px] resize-none text-center font-cairo focus-visible:ring-primary/20"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              onClick={handleSaveQuote}
                              className="h-8 px-3 gap-1 text-[10px] font-bold bg-primary hover:bg-primary/90"
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}{" "}
                              وحفظ
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setIsEditingQuote(false);
                                setQuoteDraft(book.quote || "");
                              }}
                              className="h-8 px-3 gap-1 text-[10px] font-bold border-border/40"
                              disabled={isSaving}
                            >
                              <X className="h-3 w-3" /> إلغاء
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm font-black leading-relaxed italic text-primary/90 drop-shadow-sm">
                          "{activeQuote || "لا يوجد اقتباس بعد..."}"
                        </p>
                      )}
                    </div>
                  </div>
                </ContextMenuTrigger>
                {!isEditingQuote && (
                  <ContextMenuContent className="w-48 font-cairo">
                    <ContextMenuItem
                      onClick={() => {
                        setIsEditingQuote(true);
                        setQuoteDraft(book.quote || "");
                      }}
                      className="gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span>تعديل الاقتباس</span>
                    </ContextMenuItem>
                  </ContextMenuContent>
                )}
              </ContextMenu>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
