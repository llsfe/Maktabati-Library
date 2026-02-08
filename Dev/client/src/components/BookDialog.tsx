import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Book } from "@shared/schema";
import {
  useCreateBook,
  useUpdateBook,
  useDeleteBook,
  useBooks,
} from "@/hooks/use-books";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookSchema } from "@shared/schema";
import { z } from "zod";
import { useEffect, useState } from "react";
import {
  Trash2,
  Upload,
  FileText,
  CheckCircle2,
  Star,
  Heart,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useUpload } from "@/hooks/use-upload";
import { cn } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";

interface BookDialogProps {
  book?: Book;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Ensure year is coerced to number for the form
const formSchema = insertBookSchema.extend({
  year: z.coerce.number().min(1000).max(new Date().getFullYear()),
});

type FormValues = z.infer<typeof formSchema>;

export function BookDialog({ book, open, onOpenChange }: BookDialogProps) {
  const createBook = useCreateBook();
  const updateBook = useUpdateBook();
  const deleteBook = useDeleteBook();
  const { data: books } = useBooks();

  // Extract unique options
  const uniqueAuthors = Array.from(
    new Set(books?.map((b) => b.author).filter(Boolean) as string[]),
  ).sort();
  const uniqueCategories = Array.from(
    new Set(books?.map((b) => b.category).filter(Boolean) as string[]),
  ).sort();

  const { uploadFile, isUploading } = useUpload();
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [coverUploadStatus, setCoverUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      author: "",
      category: "",
      year: new Date().getFullYear(),
      status: "planned",
      coverUrl: "",
      fileUrl: "",
      extractedContent: "",
      rating: 0,
      isFavorite: 0,
      tags: "",
    },
  });

  // const extractedContent = form.watch("extractedContent"); // Removed as per request

  useEffect(() => {
    if (book) {
      form.reset({
        title: book.title,
        author: book.author,
        category: book.category,
        year: book.year,
        status: book.status as any,
        coverUrl: book.coverUrl,
        fileUrl: book.fileUrl || "",
        extractedContent: book.extractedContent || "",
        rating: book.rating || 0,
        isFavorite: book.isFavorite || 0,
        tags: book.tags || "",
      });
    } else {
      form.reset({
        title: "",
        author: "",
        category: "",
        year: new Date().getFullYear(),
        status: "planned",
        coverUrl: "",
        fileUrl: "",
        extractedContent: "",
        rating: 0,
        isFavorite: 0,
        tags: "",
      });
    }
    setUploadStatus("idle");
    setCoverUploadStatus("idle");
    setShowDeleteAlert(false);
  }, [book, open, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (book) {
        await updateBook.mutateAsync({ id: book.id, ...data });
      } else {
        await createBook.mutateAsync(data);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission error", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus("uploading");
    try {
      const response = await uploadFile(file);
      if (response) {
        form.setValue("fileUrl", response.objectPath);

        // Auto-fill from PDF metadata if available
        if (response.pdfData) {
          if (response.pdfData.title && !form.getValues("title")) {
            form.setValue("title", response.pdfData.title);
          }
          if (response.pdfData.author && !form.getValues("author")) {
            form.setValue("author", response.pdfData.author);
          }
        } else if (!form.getValues("title")) {
          // Fallback to filename if no title in metadata
          const fileName = file.name.replace(/\.[^/.]+$/, "");
          form.setValue("title", fileName);
        }

        setUploadStatus("success");
      } else {
        setUploadStatus("error");
      }
    } catch (error) {
      setUploadStatus("error");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverUploadStatus("uploading");
    try {
      const response = await uploadFile(file, "cover");
      if (response) {
        form.setValue("coverUrl", response.objectPath);
        setCoverUploadStatus("success");
      } else {
        setCoverUploadStatus("error");
      }
    } catch (error) {
      setCoverUploadStatus("error");
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (book) {
      await deleteBook.mutateAsync(book.id);
      setShowDeleteAlert(false);
      onOpenChange(false);
    }
  };

  const isPending =
    createBook.isPending || updateBook.isPending || deleteBook.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] p-0 border-border bg-card shadow-2xl overflow-hidden flex flex-col">
          <DialogHeader className="p-6 pb-2 border-b border-border/10">
            <DialogTitle className="text-xl font-bold text-foreground">
              {book ? "تعديل الكتاب" : "إضافة كتاب جديد"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="title">عنوان الكتاب</Label>
                  <Input
                    {...form.register("title")}
                    className="bg-background"
                    placeholder="مثال: مقدمة ابن خلدون"
                  />
                  {form.formState.errors.title && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="author">المؤلف</Label>
                  <Controller
                    name="author"
                    control={form.control}
                    render={({ field }) => (
                      <Combobox
                        value={field.value}
                        onChange={field.onChange}
                        options={uniqueAuthors}
                        placeholder="ابحث عن مؤلف أو أضف جديد."
                        emptyText="لا يوجد مؤلف بهذا الاسم."
                        className="w-full"
                      />
                    )}
                  />
                  {form.formState.errors.author && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.author.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">التصنيف</Label>
                  <Controller
                    name="category"
                    control={form.control}
                    render={({ field }) => (
                      <Combobox
                        value={field.value}
                        onChange={field.onChange}
                        options={uniqueCategories}
                        placeholder="اختر تصنيفاً أو أضف جديد."
                        emptyText="لا يوجد تصنيف بهذا الاسم."
                        className="w-full"
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">سنة النشر</Label>
                  <Input
                    {...form.register("year")}
                    type="number"
                    className="bg-background"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="status">الحالة</Label>
                  <Controller
                    name="status"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planned">سأقرأه</SelectItem>
                          <SelectItem value="reading">جاري القراءة</SelectItem>
                          <SelectItem value="completed">تمت قراءته</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="col-span-2 space-y-4 py-2 border-y border-border/50">
                  <div className="flex items-center justify-between">
                    <Label>التقييم</Label>
                    <Controller
                      name="rating"
                      control={form.control}
                      render={({ field }) => (
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              onClick={() => field.onChange(s)}
                              className={cn(
                                "h-5 w-5 cursor-pointer transition-transform hover:scale-110",
                                s <= (field.value || 0)
                                  ? "fill-yellow-400 text-yellow-400 shadow-yellow-200"
                                  : "text-muted-foreground/30",
                              )}
                            />
                          ))}
                        </div>
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>أضف للمفضلة</Label>
                    <Controller
                      name="isFavorite"
                      control={form.control}
                      render={({ field }) => (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            field.onChange(field.value === 1 ? 0 : 1)
                          }
                          className={cn(
                            "h-10 w-10 rounded-full transition-all duration-300",
                            field.value === 1
                              ? "bg-red-500/10 text-red-500"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Heart
                            className={cn(
                              "h-5 w-5",
                              field.value === 1 && "fill-current",
                            )}
                          />
                        </Button>
                      )}
                    />
                  </div>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="tags">الوسوم (مفصولة بفاصلة)</Label>
                  <Input
                    {...form.register("tags")}
                    className="bg-background"
                    placeholder="مثال: تاريخ، فلسفة، مهم"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="coverUrl">
                    صورة الغلاف (رابط أو رفع من الجهاز)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      {...form.register("coverUrl")}
                      className="bg-background flex-1"
                      placeholder="https://..."
                    />
                    <div className="relative">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="cover-upload"
                        disabled={isUploading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-10 p-0 border-2 border-dashed border-border aspect-square"
                        asChild
                      >
                        <Label
                          htmlFor="cover-upload"
                          className="cursor-pointer flex items-center justify-center w-full h-full"
                        >
                          {coverUploadStatus === "uploading" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : coverUploadStatus === "success" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Upload className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Label>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>ملف الكتاب (PDF)</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="pdf-upload"
                        disabled={isUploading}
                      />
                      <Label
                        htmlFor="pdf-upload"
                        className={
                          z.string().min(1).safeParse(form.getValues("fileUrl"))
                            .success
                            ? "flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 px-4 py-3 transition-colors hover:bg-primary/10"
                            : "flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/30 px-4 py-3 transition-colors hover:bg-secondary/50"
                        }
                      >
                        {uploadStatus === "uploading" ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : uploadStatus === "success" ||
                          form.getValues("fileUrl") ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Upload className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium">
                          {uploadStatus === "uploading"
                            ? "جاري الرفع..."
                            : uploadStatus === "success" ||
                                form.getValues("fileUrl")
                              ? "تم رفع الملف بنجاح"
                              : "اضغط لرفع ملف PDF"}
                        </span>
                      </Label>
                    </div>
                    {form.getValues("fileUrl") && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          window.open(form.getValues("fileUrl")!, "_blank")
                        }
                        className="shrink-0 rounded-xl"
                      >
                        <FileText className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                  <Input type="hidden" {...form.register("fileUrl")} />
                  <Input type="hidden" {...form.register("extractedContent")} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-6 pt-4 border-t border-border/10 bg-card/80 backdrop-blur-md">
              {book && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={handleDeleteClick}
                  disabled={isPending || isUploading}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <div className="flex flex-1 justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isUploading}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || isUploading}
                  className="bg-primary text-primary-foreground font-bold hover:bg-primary/90"
                >
                  {isPending
                    ? "جاري الحفظ..."
                    : book
                      ? "حفظ التغييرات"
                      : "إضافة الكتاب"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="border-border bg-card" dir="rtl">
          <AlertDialogHeader className="text-right sm:text-right">
            <AlertDialogTitle className="flex items-center gap-2 text-destructive font-bold justify-start">
              <AlertTriangle className="h-5 w-5" />
              حذف الكتاب
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground pt-2 text-right">
              هل أنت متأكد من أنك تريد حذف هذا الكتاب؟ هذا الإجراء لا يمكن
              التراجع عنه وسيؤدي إلى حذف جميع الملاحظات والبيانات المتعلقة به.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:justify-start">
            <AlertDialogCancel className="border-border bg-transparent hover:bg-secondary/50">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              نعم، احذف الكتاب
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
