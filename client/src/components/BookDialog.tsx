import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Book } from "@shared/schema";
import { useCreateBook, useUpdateBook, useDeleteBook } from "@/hooks/use-books";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookSchema } from "@shared/schema";
import { z } from "zod";
import { useEffect } from "react";
import { Trash2 } from "lucide-react";

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
    },
  });

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
      });
    }
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

  const handleDelete = async () => {
    if (book && confirm("هل أنت متأكد من حذف هذا الكتاب؟")) {
      await deleteBook.mutateAsync(book.id);
      onOpenChange(false);
    }
  };

  const isPending = createBook.isPending || updateBook.isPending || deleteBook.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-border bg-card shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {book ? "تعديل الكتاب" : "إضافة كتاب جديد"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="title">عنوان الكتاب</Label>
              <Input {...form.register("title")} className="bg-background" placeholder="مثال: مقدمة ابن خلدون" />
              {form.formState.errors.title && <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>}
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="author">المؤلف</Label>
              <Input {...form.register("author")} className="bg-background" placeholder="اسم المؤلف" />
              {form.formState.errors.author && <p className="text-xs text-red-500">{form.formState.errors.author.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">التصنيف</Label>
              <Input {...form.register("category")} className="bg-background" placeholder="مثال: تاريخ" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">سنة النشر</Label>
              <Input {...form.register("year")} type="number" className="bg-background" />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="status">الحالة</Label>
              <Select 
                onValueChange={(value) => form.setValue("status", value as any)} 
                defaultValue={form.getValues("status")}
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
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="coverUrl">رابط صورة الغلاف</Label>
              <Input {...form.register("coverUrl")} className="bg-background" placeholder="https://..." />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            {book && (
              <Button 
                type="button" 
                variant="destructive" 
                size="icon" 
                onClick={handleDelete}
                disabled={isPending}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <div className="flex flex-1 justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground font-bold hover:bg-primary/90">
                {isPending ? "جاري الحفظ..." : (book ? "حفظ التغييرات" : "إضافة الكتاب")}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
