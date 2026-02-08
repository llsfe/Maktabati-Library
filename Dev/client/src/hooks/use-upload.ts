import { useState, useCallback } from "react";
import type { UppyFile } from "@uppy/core";
import { BASE_URL } from "@/lib/queryClient";

interface UploadMetadata {
  name: string;
  size: number;
  contentType: string;
  type?: "cover" | "asset";
}

interface UploadResponse {
  uploadURL: string;
  objectPath: string;
  metadata: UploadMetadata;
  pdfData?: {
    title?: string;
    author?: string;
    pages?: number;
  };
}

interface UseUploadOptions {
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * React hook for handling file uploads with presigned URLs.
 * 
 * This hook implements the two-step presigned URL upload flow:
 * 1. Request a presigned URL from your backend (sends JSON metadata, NOT the file)
 * 2. Upload the file directly to the presigned URL
 */
export function useUpload(options: UseUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  /**
   * Request a presigned URL from the backend.
   * IMPORTANT: Send JSON metadata, NOT the file itself.
   */
  const requestUploadUrl = useCallback(
    async (file: File, type?: "cover" | "asset"): Promise<UploadResponse> => {
      const response = await fetch(`${BASE_URL}/api/uploads/request-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
          type: type || (file.type?.startsWith("image/") ? "cover" : "asset"),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get upload URL");
      }

      return response.json();
    },
    [],
  );

  /**
   * Upload a file directly to the presigned URL.
   */
  const uploadToPresignedUrl = useCallback(
    async (file: File, uploadURL: string): Promise<any> => {
      const formData = new FormData();
      formData.append("file", file);

      // Resolve relative upload URL if necessary
      const fullUploadUrl = uploadURL.startsWith("/") ? `${BASE_URL}${uploadURL}` : uploadURL;

      const response = await fetch(fullUploadUrl, {
        method: "PUT", // Matches the backend's .put route
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file to storage");
      }

      return response.json();
    },
    [],
  );

  /**
   * Upload a file using the presigned URL flow.
   *
   * @param file - The file to upload
   * @param type - Optional upload type (e.g. "cover")
   * @returns The upload response containing the object path
   */
  const uploadFile = useCallback(
    async (file: File, type?: "cover" | "asset"): Promise<UploadResponse | null> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        // Step 1: Request presigned URL (send metadata as JSON)
        setProgress(10);
        const uploadResponse = await requestUploadUrl(file, type);

        // Step 2: Upload file directly to presigned URL
        setProgress(30);
        const serverResponse = await uploadToPresignedUrl(
          file,
          uploadResponse.uploadURL,
        );

        const finalResponse = {
          ...uploadResponse,
          objectPath: serverResponse.objectPath,
          pdfData: serverResponse.pdfData,
        };

        setProgress(100);
        options.onSuccess?.(finalResponse);
        return finalResponse;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload failed");
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [requestUploadUrl, uploadToPresignedUrl, options],
  );

  /**
   * Get upload parameters for Uppy's AWS S3 plugin.
   */
  const getUploadParameters = useCallback(
    async (
      file: UppyFile<Record<string, unknown>, Record<string, unknown>>,
    ): Promise<{
      method: "PUT";
      url: string;
      headers?: Record<string, string>;
    }> => {
      const response = await fetch(`${BASE_URL}/api/uploads/request-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
          type: file.type?.startsWith("image/") ? "cover" : "asset",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const data = await response.json();
      const fullUrl = data.uploadURL.startsWith("/") ? `${BASE_URL}${data.uploadURL}` : data.uploadURL;

      return {
        method: "PUT",
        url: fullUrl,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      };
    },
    [],
  );

  return {
    uploadFile,
    getUploadParameters,
    isUploading,
    error,
    progress,
  };
}
