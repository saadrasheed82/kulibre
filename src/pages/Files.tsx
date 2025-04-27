
import { useState } from "react";
import { useFiles } from "@/hooks/useFiles";
import { FilePreviewDialog } from "@/components/files/FilePreviewDialog";
import { UploadDialog } from "@/components/files/UploadDialog";
import { CreateFolderDialog } from "@/components/files/CreateFolderDialog";
import { RenameDialog } from "@/components/files/RenameDialog";
import { DeleteDialog } from "@/components/files/DeleteDialog";
import { MoveDialog } from "@/components/files/MoveDialog";
import { EmptyState } from "@/components/files/EmptyState";
import { BreadcrumbNav } from "@/components/files/BreadcrumbNav";
import { ActionButtons } from "@/components/files/ActionButtons";
import { SearchBar } from "@/components/files/SearchBar";
import { ViewModeToggle } from "@/components/files/ViewModeToggle";
import { FileList } from "@/components/files/FileList";
import { FileItem } from "@/types/files";

export default function Files() {
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{id: string | null, name: string}[]>([
    { id: null, name: "Home" }
  ]);
  
  // Preview dialog state
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  
  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<{id: string, name: string, type: "file" | "folder"} | null>(null);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string, type: "file" | "folder", path?: string} | null>(null);
  
  // Move dialog state
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [itemToMove, setItemToMove] = useState<{id: string, name: string, type: "file" | "folder"} | null>(null);

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
    moveFile,
    moveFolder,
    getFileUrl
  } = useFiles(currentFolderId);

  // Filter files and folders based on search query
  const filteredFolders = folders?.filter(folder => 
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  const filteredFiles = files?.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Handle file and folder operations
  const handleUploadComplete = async (file: File) => {
    try {
      await uploadFile(file);
      setUploadDialogOpen(false);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      await createFolder(name);
      setCreateFolderDialogOpen(false);
    } catch (error) {
      console.error('Create folder error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'file') {
      await deleteFile({ fileId: id, filePath: itemToDelete.path || '' });
    } else {
      await deleteFolder(id);
    }
    setItemToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleRename = async (id: string, newName: string) => {
    if (!itemToRename) return;

    if (itemToRename.type === 'file') {
      await renameFile({ fileId: id, newName });
    } else {
      await renameFolder({ folderId: id, newName });
    }
    setItemToRename(null);
    setRenameDialogOpen(false);
  };

  const handleMove = async (id: string, destinationFolderId: string) => {
    if (!itemToMove) return;

    if (itemToMove.type === 'file') {
      await moveFile({ fileId: id, destinationFolderId });
    } else {
      await moveFolder({ folderId: id, destinationFolderId });
    }
    setItemToMove(null);
    setMoveDialogOpen(false);
  };

  // Navigate to a folder
  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setBreadcrumbs(prev => [...prev, { id: folderId, name: folderName }]);
  };

  // Navigate using breadcrumbs
  const navigateToBreadcrumb = (index: number) => {
    const targetCrumb = breadcrumbs[index];
    setCurrentFolderId(targetCrumb.id);
    setBreadcrumbs(prev => prev.slice(0, index + 1));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Files</h1>
        <p className="text-muted-foreground mt-1">Manage your project files</p>
      </div>

      <BreadcrumbNav 
        folderPath={breadcrumbs.slice(1)}
        onNavigate={navigateToBreadcrumb}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <div className="flex items-center gap-2">
          <ActionButtons
            onUpload={() => setUploadDialogOpen(true)}
            onCreateFolder={() => setCreateFolderDialogOpen(true)}
          />
          <ViewModeToggle
            view={view}
            onViewChange={setView}
          />
        </div>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
        <EmptyState
          onUpload={() => setUploadDialogOpen(true)}
          onCreateFolder={() => setCreateFolderDialogOpen(true)}
          currentFolderId={currentFolderId}
        />
      ) : (
        <FileList
          files={filteredFiles}
          folders={filteredFolders}
          view={view}
          onFileClick={(file) => {
            setSelectedFile(file);
            setPreviewDialogOpen(true);
          }}
          onFolderClick={navigateToFolder}
          onFileDownload={async (fileId, filePath) => {
            const url = await getFileUrl(filePath);
            window.open(url, '_blank');
          }}
          onFileRename={(id) => {
            const file = files?.find(f => f.id === id);
            if (file) {
              setItemToRename({ id, name: file.name, type: "file" });
              setRenameDialogOpen(true);
            }
          }}
          onFolderRename={(id) => {
            const folder = folders?.find(f => f.id === id);
            if (folder) {
              setItemToRename({ id, name: folder.name, type: "folder" });
              setRenameDialogOpen(true);
            }
          }}
          onFileMove={(id) => {
            const file = files?.find(f => f.id === id);
            if (file) {
              setItemToMove({ id, name: file.name, type: "file" });
              setMoveDialogOpen(true);
            }
          }}
          onFolderMove={(id) => {
            const folder = folders?.find(f => f.id === id);
            if (folder) {
              setItemToMove({ id, name: folder.name, type: "folder" });
              setMoveDialogOpen(true);
            }
          }}
          onFileDelete={(id) => {
            const file = files?.find(f => f.id === id);
            if (file) {
              setItemToDelete({ id, name: file.name, type: "file", path: file.path });
              setDeleteDialogOpen(true);
            }
          }}
          onFolderDelete={(id) => {
            const folder = folders?.find(f => f.id === id);
            if (folder) {
              setItemToDelete({ id, name: folder.name, type: "folder" });
              setDeleteDialogOpen(true);
            }
          }}
        />
      )}

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
      
      {itemToMove && folders && (
        <MoveDialog
          open={moveDialogOpen}
          onOpenChange={setMoveDialogOpen}
          onMove={handleMove}
          itemId={itemToMove.id}
          itemName={itemToMove.name}
          itemType={itemToMove.type}
          currentFolderId={currentFolderId}
          folders={folders}
        />
      )}
    </div>
  );
}
