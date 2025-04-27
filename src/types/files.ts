export interface FileItem {
  id: string;
  name: string;
  type: "document" | "image" | "video";
  parentId: string | null;
}

export interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
}