
export interface FileItem {
  id: string;
  name: string;
  type: "document" | "image" | "video";
  parentId: string | null;
  path: string;
  size: number;
  content_type: string;
  created_at: string;
  updated_at: string;
}

export interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  created_at: string;
  updated_at: string;
}
