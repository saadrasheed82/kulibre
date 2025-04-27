
import { supabase } from "@/integrations/supabase/client";
import { FileItem, FolderItem } from "@/types/files";

export async function uploadFile(file: File, parentFolderId: string | null = null) {
  try {
    // First upload to storage
    const fileExt = file.name.split('.').pop();
    const filePath = `${crypto.randomUUID()}.${fileExt}`;
    
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('file_uploads')
      .upload(filePath, file);
      
    if (uploadError) throw uploadError;

    // Then create file record in database
    const { error: dbError, data: fileRecord } = await supabase
      .from('files')
      .insert({
        name: file.name,
        type: getFileType(file.type),
        size: file.size,
        content_type: file.type,
        path: filePath,
        parent_folder_id: parentFolderId,
      })
      .select()
      .single();

    if (dbError) throw dbError;
    return fileRecord;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

export async function createFolder(name: string, parentFolderId: string | null = null) {
  try {
    const { error, data } = await supabase
      .from('folders')
      .insert({
        name,
        parent_folder_id: parentFolderId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
}

export async function deleteFile(fileId: string, filePath: string) {
  try {
    // Delete from storage first
    const { error: storageError } = await supabase.storage
      .from('file_uploads')
      .remove([filePath]);

    if (storageError) throw storageError;

    // Then delete from database
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);

    if (dbError) throw dbError;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

export async function deleteFolder(folderId: string) {
  try {
    // Due to CASCADE delete, this will automatically delete all subfolders and files
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
}

export async function renameFile(fileId: string, newName: string) {
  try {
    const { error, data } = await supabase
      .from('files')
      .update({ name: newName })
      .eq('id', fileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error renaming file:', error);
    throw error;
  }
}

export async function renameFolder(folderId: string, newName: string) {
  try {
    const { error, data } = await supabase
      .from('folders')
      .update({ name: newName })
      .eq('id', folderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error renaming folder:', error);
    throw error;
  }
}

export async function getFileUrl(filePath: string) {
  try {
    const { data, error } = await supabase.storage
      .from('file_uploads')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
}

function getFileType(mimeType: string): FileItem['type'] {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
}
