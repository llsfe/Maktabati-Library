import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  api,
  buildUrl,
  type BookInput,
  type BookUpdateInput,
} from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/lib/queryClient";

const getFullUrl = (path: string) =>
  path.startsWith("/") ? `${BASE_URL}${path}` : `${BASE_URL}/${path}`;

export function useBooks(params?: {
  search?: string;
  status?: string;
  category?: string;
  isFavorite?: boolean;
  minRating?: number;
  tag?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append("search", params.search);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.category) queryParams.append("category", params.category);
  if (params?.isFavorite !== undefined)
    queryParams.append("isFavorite", String(params.isFavorite));
  if (params?.minRating)
    queryParams.append("minRating", String(params.minRating));
  if (params?.tag) queryParams.append("tag", params.tag);

  const queryString = queryParams.toString();
  const url = `${api.books.list.path}${queryString ? `?${queryString}` : ""}`;

  return useQuery({
    queryKey: [api.books.list.path, params],
    queryFn: async () => {
      const res = await fetch(getFullUrl(url), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch books");
      return api.books.list.responses[200].parse(await res.json());
    },
  });
}

export function useBook(id: number) {
  return useQuery({
    queryKey: [api.books.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.books.get.path, { id });
      const res = await fetch(getFullUrl(url), { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch book details");
      return api.books.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: BookInput) => {
      const res = await fetch(getFullUrl(api.books.create.path), {
        method: api.books.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create book");
      }
      return api.books.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.books.list.path] });
      toast({
        title: "تم إضافة الكتاب",
        description: "تمت إضافة الكتاب الجديد إلى مكتبتك بنجاح.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    },
  });
}

export function useUpdateBook() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: number } & BookUpdateInput) => {
      const url = buildUrl(api.books.update.path, { id });
      const res = await fetch(getFullUrl(url), {
        method: api.books.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update book");
      }
      return api.books.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.books.list.path] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.books.delete.path, { id });
      const res = await fetch(getFullUrl(url), {
        method: api.books.delete.method,
        credentials: "include",
      });
      if (!res.ok && res.status !== 404) {
        throw new Error("Failed to delete book");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.books.list.path] });
      toast({
        title: "تم حذف الكتاب",
        description: "تمت إزالة الكتاب من مكتبتك.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    },
  });
}
