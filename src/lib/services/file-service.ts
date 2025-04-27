
import { supabase } from "@/integrations/supabase/client";
import type { FileItem } from "@/types/files";

export async function uploadFile(file: File, parentFolderId: string | null = null) {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    if (!user) throw new Error('User not authenticated');

    // Generate a unique file path
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
    
    // First upload to storage
    const { error: uploadError } = await supabase.storage
      .from('file_uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      if (uploadError.message.includes('already exists')) {
        throw new Error('A file with this name already exists. Please try again with a different file.');
      }
      throw new Error(`Storage error: ${uploadError.message}`);
    }

    // Check if file with same name already exists in the same parent
    let checkQuery = supabase
      .from('files')
      .select('id')
      .eq('name', file.name)
      .eq('user_id', user.id);
    
    // Handle null parent folder ID differently
    if (parentFolderId === null) {
      checkQuery = checkQuery.is('parent_folder_id', null);
    } else {
      checkQuery = checkQuery.eq('parent_folder_id', parentFolderId);
    }
    
    const { data: existingFiles, error: checkError } = await checkQuery;
    
    if (checkError) throw new Error(`Error checking for existing files: ${checkError.message}`);
    
    if (existingFiles && existingFiles.length > 0) {
      throw new Error(`A file named "${file.name}" already exists in this location`);
    }
    
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
        user_id: user.id
      })
      .select()
      .single();

    if (dbError) {
      // If database insert fails, try to clean up the uploaded file
      await supabase.storage.from('file_uploads').remove([filePath]);
      throw new Error(`Database error: ${dbError.message}`);
    }
    
    return fileRecord;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

export async function createFolder(name: string, parentFolderId: string | null = null) {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    if (!user) throw new Error('User not authenticated');

    // Check if folder with same name already exists in the same parent
    let query = supabase
      .from('folders')
      .select('id')
      .eq('name', name)
      .eq('user_id', user.id);
    
    // Handle null parent folder ID differently
    if (parentFolderId === null) {
      query = query.is('parent_folder_id', null);
    } else {
      query = query.eq('parent_folder_id', parentFolderId);
    }
    
    const { data: existingFolders, error: checkError } = await query;
    
    if (checkError) throw new Error(`Error checking for existing folders: ${checkError.message}`);
    
    if (existingFolders && existingFolders.length > 0) {
      throw new Error(`A folder named "${name}" already exists in this location`);
    }

    // Create the folder
    const { error, data } = await supabase
      .from('folders')
      .insert({
        name,
        parent_folder_id: parentFolderId,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw new Error(`Database error: ${error.message}`);
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

export async function moveFile(fileId: string, newFolderId: string | null) {
  try {
    // Check if the file exists
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .select('name, parent_folder_id')
      .eq('id', fileId)
      .single();
    
    if (fileError) throw new Error(`Error finding file: ${fileError.message}`);
    if (!fileData) throw new Error('File not found');
    
    // Check if a file with the same name already exists in the destination folder
    let checkQuery = supabase
      .from('files')
      .select('id')
      .eq('name', fileData.name);
    
    // Handle null destination folder ID differently
    if (newFolderId === null) {
      checkQuery = checkQuery.is('parent_folder_id', null);
    } else {
      checkQuery = checkQuery.eq('parent_folder_id', newFolderId);
    }
    
    const { data: existingFiles, error: checkError } = await checkQuery;
    
    if (checkError) throw new Error(`Error checking destination folder: ${checkError.message}`);
    
    if (existingFiles && existingFiles.length > 0) {
      throw new Error(`A file with the name "${fileData.name}" already exists in the destination folder`);
    }
    
    // Move the file
    const { error, data } = await supabase
      .from('files')
      .update({ parent_folder_id: newFolderId })
      .eq('id', fileId)
      .select()
      .single();

    if (error) throw new Error(`Error moving file: ${error.message}`);
    return data;
  } catch (error) {
    console.error('Error moving file:', error);
    throw error;
  }
}

export async function moveFolder(folderId: string, newParentFolderId: string | null) {
  try {
    // Check if the folder exists
    const { data: folderData, error: folderError } = await supabase
      .from('folders')
      .select('name, parent_folder_id')
      .eq('id', folderId)
      .single();
    
    if (folderError) throw new Error(`Error finding folder: ${folderError.message}`);
    if (!folderData) throw new Error('Folder not found');
    
    // Check for circular reference (can't move a folder into itself or its descendants)
    if (newParentFolderId) {
      const isDescendant = await checkIfDescendant(newParentFolderId, folderId);
      if (isDescendant) {
        throw new Error('Cannot move a folder into itself or its descendants');
      }
    }
    
    // Check if a folder with the same name already exists in the destination folder
    let checkQuery = supabase
      .from('folders')
      .select('id')
      .eq('name', folderData.name);
    
    // Handle null destination folder ID differently
    if (newParentFolderId === null) {
      checkQuery = checkQuery.is('parent_folder_id', null);
    } else {
      checkQuery = checkQuery.eq('parent_folder_id', newParentFolderId);
    }
    
    const { data: existingFolders, error: checkError } = await checkQuery;
    
    if (checkError) throw new Error(`Error checking destination folder: ${checkError.message}`);
    
    if (existingFolders && existingFolders.length > 0) {
      throw new Error(`A folder with the name "${folderData.name}" already exists in the destination folder`);
    }
    
    // Move the folder
    const { error, data } = await supabase
      .from('folders')
      .update({ parent_folder_id: newParentFolderId })
      .eq('id', folderId)
      .select()
      .single();

    if (error) throw new Error(`Error moving folder: ${error.message}`);
    return data;
  } catch (error) {
    console.error('Error moving folder:', error);
    throw error;
  }
}

// Helper function to check if a folder is a descendant of another folder
async function checkIfDescendant(folderId: string, potentialAncestorId: string): Promise<boolean> {
  try {
    // If the IDs are the same, it's trying to move into itself
    if (folderId === potentialAncestorId) {
      return true;
    }
    
    const { data: folder, error } = await supabase
      .from('folders')
      .select('parent_folder_id')
      .eq('id', folderId)
      .single();

    if (error) {
      console.error('Error checking folder ancestry:', error);
      return false;
    }

    if (!folder || folder.parent_folder_id === null) {
      return false;
    }

    if (folder.parent_folder_id === potentialAncestorId) {
      return true;
    }

    return checkIfDescendant(folder.parent_folder_id, potentialAncestorId);
  } catch (error) {
    console.error('Error checking folder ancestry:', error);
    return false;
  }
}

function getFileType(mimeType: string): FileItem['type'] {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
}
