import { useState } from "react";
import { useFiles } from "@/hooks/useFiles";
import { UploadDialog } from "@/components/files/UploadDialog";
import { CreateFolderDialog } from "@/components/files/CreateFolderDialog";
import { RenameDialog } from "@/components/files/RenameDialog";
import { DeleteDialog } from "@/components/files/DeleteDialog";
import { FilePreviewDialog } from "@/components/files/FilePreviewDialog";
import { FileCard } from "@/components/files/FileCard";
import { FolderCard } from "@/components/files/FolderCard";
import { EmptyState } from "@/components/files/EmptyState";
import { BreadcrumbNav } from "@/components/files/BreadcrumbNav";
import { FileItem } from "@/types/files";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Upload, FolderPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Files() {
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{id: string | null, name: string}[]>([
    { id: null, name: "Home" }
  ]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  
  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<{id: string, name: string, type: "file" | "folder"} | null>(null);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string, type: "file" | "folder"} | null>(null);

  const {
    files,
    folders,
    isLoading,
    uploadFile,
    createFolder,
    deleteFile,
    deleteFolder,
    renameFile,
    renameFolder,
    getFileUrl
  } = useFiles(currentFolderId);

  const { toast } = useToast();

  const handleUploadComplete = async (file: File) => {
    try {
      await uploadFile({ file, parentFolderId: currentFolderId });
      setUploadDialogOpen(false);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      await createFolder({ name, parentFolderId: currentFolderId });
      setCreateFolderDialogOpen(false);
    } catch (error) {
      console.error('Create folder error:', error);
    }
  };

  const handleFileDownload = async (fileId: string, filePath: string) => {
    try {
      const url = await getFileUrl(filePath);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.click();
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the file.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (itemToDelete?.type === 'file') {
      await deleteFile({ fileId: id, filePath: itemToDelete.path });
    } else {
      await deleteFolder(id);
    }
    setItemToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleRename = async (id: string, newName: string) => {
    if (itemToRename?.type === 'file') {
      await renameFile({ fileId: id, newName });
    } else {
      await renameFolder({ folderId: id, newName });
    }
    setItemToRename(null);
    setRenameDialogOpen(false);
  };
  
  // Navigate to a folder
  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    
    // Update breadcrumbs
    setBreadcrumbs(prev => {
      // Find if we're already in the breadcrumb trail
      const existingIndex = prev.findIndex(crumb => crumb.id === folderId);
      
      if (existingIndex >= 0) {
        // If we're navigating to a folder in our trail, trim the trail
        return prev.slice(0, existingIndex + 1);
      } else {
        // Otherwise add to the trail
        return [...prev, { id: folderId, name: folderName }];
      }
    });
  };
  
  // Navigate using breadcrumbs
  const navigateToBreadcrumb = (index: number) => {
    const targetCrumb = breadcrumbs[index];
    setCurrentFolderId(targetCrumb.id);
    setBreadcrumbs(prev => prev.slice(0, index + 1));
  };
  
  // Handle file click to open preview
  const handleFileClick = (file: FileItem) => {
    setSelectedFile(file);
    setPreviewDialogOpen(true);
  };
  
  // Open rename dialog for a file
  const openRenameDialog = (item: {id: string, name: string, type: "file" | "folder"}) => {
    setItemToRename(item);
    setRenameDialogOpen(true);
  };
  
  // Open delete dialog for a file or folder
  const openDeleteDialog = (item: {id: string, name: string, type: "file" | "folder"}) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Files</h1>
        <p className="text-muted-foreground mt-1">Manage your project files</p>
      </div>
      
      {/* Breadcrumb navigation */}
      <div className="bg-muted/30 rounded-md p-2">
        <div className="flex items-center mb-1">
          <FolderOpen className="h-4 w-4 text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">Current location:</span>
        </div>
        <nav className="flex items-center flex-wrap space-x-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <span className="mx-1 text-muted-foreground">/</span>}
              <button
                onClick={() => navigateToBreadcrumb(index)}
                className={`hover:underline ${
                  index === breadcrumbs.length - 1 
                    ? "font-medium text-foreground" 
                    : "text-muted-foreground"
                }`}
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </nav>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files and folders..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            className="gap-2"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Upload Files
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setCreateFolderDialogOpen(true)}
          >
            <FolderPlus className="h-4 w-4" />
            New Folder
          </Button>
        </div>
      </div>

      {currentFolders.length === 0 && currentFiles.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-creatively-purple/10 flex items-center justify-center mb-4">
            <FolderOpen className="h-10 w-10 text-creatively-purple" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            No files uploaded yet
          </h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Start by uploading your first project files or creating folders to organize your work.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              className="gap-2"
              onClick={() => setUploadDialogOpen(true)}
            >
              <Upload className="h-4 w-4" />
              Upload Files
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setCreateFolderDialogOpen(true)}
            >
              <FolderOpen className="h-4 w-4" />
              Create Folder
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Folders section */}
          {currentFolders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Folders</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentFolders.map(folder => (
                  <div 
                    key={folder.id}
                    className="bg-white rounded-lg border overflow-hidden transition-all hover:shadow-md cursor-pointer"
                    onClick={() => navigateToFolder(folder.id, folder.name)}
                  >
                    <div className="aspect-square p-2">
                      <div className="w-full h-full rounded-md bg-creatively-purple/10 flex flex-col items-center justify-center">
                        <Folder className="h-12 w-12 text-creatively-purple" />
                      </div>
                    </div>
                    <div className="p-3 border-t">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{folder.name}</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="p-1 rounded-full hover:bg-muted transition-colors">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="sr-only">Open menu</span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openRenameDialog({
                              id: folder.id,
                              name: folder.name,
                              type: "folder"
                            })}>
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteDialog({
                              id: folder.id,
                              name: folder.name,
                              type: "folder"
                            })}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files section */}
          {currentFiles.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Files</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentFiles.map(file => (
                  <div 
                    key={file.id}
                    className="bg-white rounded-lg border overflow-hidden transition-all hover:shadow-md cursor-pointer"
                    onClick={() => handleFileClick(file)}
                  >
                    <div className="aspect-square p-2">
                      <div className="w-full h-full rounded-md bg-muted/50 flex flex-col items-center justify-center">
                        {getFileIcon(file.type)}
                      </div>
                    </div>
                    <div className="p-3 border-t">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="p-1 rounded-full hover:bg-muted transition-colors">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="sr-only">Open menu</span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleFileDownload(file)}>
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openRenameDialog({
                              id: file.id,
                              name: file.name,
                              type: "file"
                            })}>
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteDialog({
                              id: file.id,
                              name: file.name,
                              type: "file"
                            })}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Dialogs */}
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={handleUploadComplete}
        currentFolderId={currentFolderId}
      />
      
      <CreateFolderDialog
        open={createFolderDialogOpen}
        onOpenChange={setCreateFolderDialogOpen}
        onCreateFolder={handleCreateFolder}
        parentFolderId={currentFolderId}
      />
      
      <FilePreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        file={selectedFile}
      />
      
      {itemToRename && (
        <RenameDialog
          open={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
          onRename={handleRename}
          itemId={itemToRename.id}
          currentName={itemToRename.name}
          itemType={itemToRename.type}
        />
      )}
      
      {itemToDelete && (
        <DeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onDelete={handleDelete}
          itemId={itemToDelete.id}
          itemName={itemToDelete.name}
          itemType={itemToDelete.type}
        />
      )}
    </div>
  );
}
