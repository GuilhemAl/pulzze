import { supabase } from "./supabase-client";

const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET;

if (!bucketName) {
  throw new Error("Variable VITE_SUPABASE_STORAGE_BUCKET manquante.");
}

const getUuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export type UploadImageOptions = {
  blob: Blob;
  fileName: string;
  onProgress?: (value: number) => void;
};

export const uploadUserImage = async ({ blob, fileName, onProgress }: UploadImageOptions) => {
  const safeName = fileName.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const storagePath = `user/${Date.now()}-${getUuid()}-${safeName}.webp`;

  onProgress?.(0.05);
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, blob, {
      contentType: "image/webp",
      cacheControl: "3600",
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  onProgress?.(0.7);
  const {
    data: { publicUrl }
  } = supabase.storage.from(bucketName).getPublicUrl(storagePath);

  onProgress?.(1);
  return {
    publicUrl,
    storagePath
  };
};

export type SaveImageMetadataInput = {
  title: string;
  storage_path: string;
  source?: string;
  status?: "draft" | "published" | "archived";
  width?: number;
  height?: number;
  size_bytes?: number;
  content_type?: string;
};

export const saveImageMetadata = async (input: SaveImageMetadataInput) => {
  const { error } = await supabase.from("images").insert(input);

  if (error) {
    throw error;
  }
};

export type GalleryImage = {
  id: string;
  title: string;
  storagePath: string;
  publicUrl: string;
  source: string;
  createdAt: string;
  width?: number | null;
  height?: number | null;
};

export const fetchGalleryImages = async (): Promise<GalleryImage[]> => {
  const { data, error } = await supabase
    .from("images")
    .select("id, title, storage_path, source, status, width, height, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => {
    const {
      data: { publicUrl }
    } = supabase.storage.from(bucketName).getPublicUrl(item.storage_path);

    return {
      id: item.id,
      title: item.title,
      storagePath: item.storage_path,
      publicUrl,
      source: item.source ?? "user",
      createdAt: item.created_at ?? new Date().toISOString(),
      width: item.width,
      height: item.height
    };
  });
};

export const fetchImageById = async (id: string): Promise<GalleryImage | null> => {
  const { data, error } = await supabase
    .from('images')
    .select('id, title, storage_path, source, status, width, height, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const {
    data: { publicUrl }
  } = supabase.storage.from(bucketName).getPublicUrl(data.storage_path);

  return {
    id: data.id,
    title: data.title,
    storagePath: data.storage_path,
    publicUrl,
    source: data.source ?? 'user',
    createdAt: data.created_at ?? new Date().toISOString(),
    width: data.width,
    height: data.height
  };
};

