
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import * as fileService from '@/lib/services/file-service';
import { useToast } from '@/hooks/use-toast';
import { FileItem, FolderItem } from '@/types/files';

export function useFiles(parentFolderId: string | null = null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: files,
    isLoading: isLoadingFiles,
    error: filesError
  } = useQuery({
    queryKey: ['files', parentFolderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('parent_folder_id', parentFolderId);
      
      if (error) throw error;
      return data;
    }
  });

  const {
    data: folders,
    isLoading: isLoadingFolders,
    error: foldersError
  } = useQuery({
    queryKey: ['folders', parentFolderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('parent_folder_id', parentFolderId);
      
      if (error) throw error;
      return data;
    }
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: ({ file, parentFolderId }: { file: File; parentFolderId: string | null }) =>
      fileService.uploadFile(file, parentFolderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', parentFolderId] });
      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file.",
        variant: "destructive"
      });
    }
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: ({ name, parentFolderId }: { name: string; parentFolderId: string | null }) =>
      fileService.createFolder(name, parentFolderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', parentFolderId] });
      toast({
        title: "Folder created",
        description: "Your folder has been created successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Creation failed",
        description: "There was an error creating your folder.",
        variant: "destructive"
      });
    }
  });

  // Delete mutations
  const deleteFileMutation = useMutation({
    mutationFn: ({ fileId, filePath }: { fileId: string; filePath: string }) =>
      fileService.deleteFile(fileId, filePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', parentFolderId] });
      toast({
        title: "File deleted",
        description: "The file has been deleted successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Deletion failed",
        description: "There was an error deleting the file.",
        variant: "destructive"
      });
    }
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: string) => fileService.deleteFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', parentFolderId] });
      toast({
        title: "Folder deleted",
        description: "The folder and its contents have been deleted successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Deletion failed",
        description: "There was an error deleting the folder.",
        variant: "destructive"
      });
    }
  });

  // Rename mutations
  const renameFileMutation = useMutation({
    mutationFn: ({ fileId, newName }: { fileId: string; newName: string }) =>
      fileService.renameFile(fileId, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', parentFolderId] });
      toast({
        title: "File renamed",
        description: "The file has been renamed successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Rename failed",
        description: "There was an error renaming the file.",
        variant: "destructive"
      });
    }
  });

  const renameFolderMutation = useMutation({
    mutationFn: ({ folderId, newName }: { folderId: string; newName: string }) =>
      fileService.renameFolder(folderId, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', parentFolderId] });
      toast({
        title: "Folder renamed",
        description: "The folder has been renamed successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Rename failed",
        description: "There was an error renaming the folder.",
        variant: "destructive"
      });
    }
  });

  return {
    files,
    folders,
    isLoading: isLoadingFiles || isLoadingFolders,
    error: filesError || foldersError,
    uploadFile: uploadFileMutation.mutateAsync,
    createFolder: createFolderMutation.mutateAsync,
    deleteFile: deleteFileMutation.mutateAsync,
    deleteFolder: deleteFolderMutation.mutateAsync,
    renameFile: renameFileMutation.mutateAsync,
    renameFolder: renameFolderMutation.mutateAsync,
    getFileUrl: fileService.getFileUrl,
  };
}
