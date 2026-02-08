import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useBooks } from "@/hooks/use-books";
import {
  Trash2,
  Moon,
  Sun,
  Settings,
  AlertTriangle,
  X,
  LayoutGrid,
  Users,
  Pencil,
  Check,
} from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: "light" | "dark";
  onThemeChange: () => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  theme,
  onThemeChange,
}: SettingsDialogProps) {
  const { data: books } = useBooks();
  const { toast } = useToast();

  // Extract unique options
  const uniqueAuthors = Array.from(
    new Set(books?.map((b) => b.author).filter(Boolean) as string[]),
  ).sort();
  const uniqueCategories = Array.from(
    new Set(books?.map((b) => b.category).filter(Boolean) as string[]),
  ).sort();

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "category" | "author";
    name: string;
  } | null>(null);
  const [editTarget, setEditTarget] = useState<{
    type: "category" | "author";
    name: string;
  } | null>(null);
  const [newName, setNewName] = useState("");

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "category") {
        await apiRequest(
          "DELETE",
          `/api/categories?name=${encodeURIComponent(deleteTarget.name)}`,
        );
      } else {
        await apiRequest(
          "DELETE",
          `/api/authors?name=${encodeURIComponent(deleteTarget.name)}`,
        );
      }

      toast({
        title: "تم الحذف بنجاح",
        description: `تم حذف ${deleteTarget.type === "category" ? "التصنيف" : "المؤلف"} وكل ما يتعلق به.`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء عملية الحذف.",
        variant: "destructive",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleEditClick = (type: "category" | "author", name: string) => {
    setEditTarget({ type, name });
    setNewName(name);
  };

  const confirmEdit = async () => {
    if (!editTarget || !newName.trim() || newName === editTarget.name) {
      setEditTarget(null);
      return;
    }

    try {
      const body = { oldName: editTarget.name, newName: newName.trim() };
      if (editTarget.type === "category") {
        await apiRequest("PUT", "/api/categories", body);
      } else {
        await apiRequest("PUT", "/api/authors", body);
      }

      toast({
        title: "تم التعديل بنجاح",
        description: `تم تغيير الاسم إلى "${newName}".`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء عملية التعديل.",
        variant: "destructive",
      });
    } finally {
      setEditTarget(null);
      setNewName("");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border shadow-2xl [&>button]:hidden gap-0">
          {/* Custom Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/10 bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">الإعدادات</h2>
                <p className="text-xs text-muted-foreground font-medium">
                  تخصيص التطبيق وإدارة البيانات
                </p>
              </div>
            </div>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>

          <Tabs
            defaultValue="general"
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4">
              <TabsList className="grid w-full grid-cols-2 p-1 bg-secondary/30 rounded-xl">
                <TabsTrigger
                  value="general"
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300"
                >
                  عام
                </TabsTrigger>
                <TabsTrigger
                  value="data"
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300"
                >
                  إدارة البيانات
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="general"
              className="flex-1 p-6 m-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between p-5 rounded-2xl bg-secondary/10 border border-border/50 hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {theme === "dark" ? (
                        <Moon className="h-5 w-5 text-primary" />
                      ) : (
                        <Sun className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-base font-semibold">المظهر</Label>
                      <p className="text-sm text-muted-foreground">
                        التبديل بين الوضع النهاري والليلي
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={onThemeChange}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="data"
              className="flex-1 flex flex-col overflow-hidden m-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <ScrollArea className="flex-1 px-6 pb-6">
                <Accordion type="single" collapsible className="space-y-4">
                  {/* Categories Section */}
                  <AccordionItem
                    value="categories"
                    className="border border-border/40 rounded-xl px-4 bg-muted/5 data-[state=open]:bg-muted/10 transition-all duration-300"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-primary font-semibold">
                        <LayoutGrid className="w-4 h-4" />
                        <span>التصنيفات</span>
                        <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                          {uniqueCategories.length}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {uniqueCategories.map((cat) => (
                          <div
                            key={cat}
                            className="flex items-center justify-between p-3 pl-4 pr-3 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 hover:bg-accent/5 transition-all duration-200 group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-1 h-8 rounded-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
                              <span className="font-medium text-sm truncate">
                                {cat}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200"
                                onClick={() => handleEditClick("category", cat)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: "category",
                                    name: cat,
                                  })
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {uniqueCategories.length === 0 && (
                          <div className="col-span-2 flex flex-col items-center justify-center py-8 text-center bg-secondary/5 rounded-xl border border-dashed border-border/50">
                            <LayoutGrid className="h-8 w-8 text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">
                              لا توجد تصنيفات حالياً
                            </p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Authors Section */}
                  <AccordionItem
                    value="authors"
                    className="border border-border/40 rounded-xl px-4 bg-muted/5 data-[state=open]:bg-muted/10 transition-all duration-300"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-primary font-semibold">
                        <Users className="w-4 h-4" />
                        <span>المؤلفون</span>
                        <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                          {uniqueAuthors.length}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {uniqueAuthors.map((author) => (
                          <div
                            key={author}
                            className="flex items-center justify-between p-3 pl-4 pr-3 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 hover:bg-accent/5 transition-all duration-200 group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-1 h-8 rounded-full bg-indigo-500/20 group-hover:bg-indigo-500 transition-colors"></div>
                              <span className="font-medium text-sm truncate">
                                {author}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200"
                                onClick={() =>
                                  handleEditClick("author", author)
                                }
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: "author",
                                    name: author,
                                  })
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {uniqueAuthors.length === 0 && (
                          <div className="col-span-2 flex flex-col items-center justify-center py-8 text-center bg-secondary/5 rounded-xl border border-dashed border-border/50">
                            <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">
                              لا يوجد مؤلفون حالياً
                            </p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle className="flex items-center justify-start gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>تحذير: حذف نهائي</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-right">
              <p>
                أنت على وشك حذف
                <span className="font-bold text-foreground mx-1">
                  {deleteTarget?.type === "category" ? "التصنيف" : "المؤلف"} "
                  {deleteTarget?.name}"
                </span>
              </p>
              <div className="flex justify-end">
                <span className="font-medium text-destructive/90 bg-destructive/10 p-2 rounded-md text-sm border border-destructive/20 inline-block">
                  سيؤدي هذا الإجراء إلى حذف جميع الكتب والملفات والمجلدات
                  المرتبطة به نهائياً من جهازك. لا يمكن التراجع عن هذا الإجراء.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              نعم، حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center justify-start gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              <span>تعديل الاسم</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="الاسم الجديد..."
              className="text-right"
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmEdit();
              }}
            />
          </div>
          <DialogFooter className="mr-auto w-full flex-row-reverse sm:justify-start gap-2">
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              إلغاء
            </Button>
            <Button onClick={confirmEdit} className="gap-2">
              <Check className="h-4 w-4" />
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
