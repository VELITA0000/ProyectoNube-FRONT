import type { Photo } from "@/types";
import { apiFetch } from "@/lib/api";

interface PresignInput {
  portfolioId: string;
  fileName: string;
  contentType: string;
}

interface PresignResult {
  url: string;
  photoId: string;
  key: string;
}

export const photoService = {
  async getPresignedUpload(input: PresignInput): Promise<PresignResult> {
    return apiFetch<PresignResult>("/photos/presign", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async uploadToPresigned(presigned: PresignResult, file: File): Promise<Photo> {
    const put = await fetch(presigned.url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    if (!put.ok) {
      throw new Error(`Upload to S3 failed: ${put.status}`);
    }
    return apiFetch<Photo>(`/photos/${presigned.photoId}`);
  },

  async getById(photoId: string): Promise<Photo> {
    return apiFetch<Photo>(`/photos/${photoId}`);
  },

  async listByPortfolio(portfolioId: string): Promise<Photo[]> {
    return apiFetch<Photo[]>(`/photos?portfolioId=${encodeURIComponent(portfolioId)}`);
  },

  async remove(id: string): Promise<void> {
    await apiFetch<void>(`/photos/${id}`, { method: "DELETE" });
  },

  async getOriginalDownloadUrl(photoId: string): Promise<string> {
    const { url } = await apiFetch<{ url: string; expiresIn: number }>(
      `/photos/${photoId}/original`,
    );
    return url;
  },
};
