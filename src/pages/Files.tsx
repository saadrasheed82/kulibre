
import { useState } from "react";
import { 
  Upload, 
  FolderPlus, 
  Search,
  Folder,
  FileText,
  FileImage,
  FileVideo,
  MoreVertical,
  FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UploadDialog } from "@/components/files/UploadDialog";
import { CreateFolderDialog } from "@/components/files/CreateFolderDialog";
import { FilePreviewDialog } from "@/components/files/FilePreviewDialog";
import { RenameDialog } from "@/components/files/RenameDialog";
import { DeleteDialog } from "@/components/files/DeleteDialog";
import { FileItem, FolderItem } from "@/types/files";

// Sample data
const sampleFolders: FolderItem[] = [
  { id: "folder-1", name: "Brand Assets", parentId: null },
  { id: "folder-2", name: "Marketing Materials", parentId: null },
  { id: "folder-3", name: "Client Presentations", parentId: null }
];

const sampleFiles: FileItem[] = [
  { id: "file-1", name: "Project Proposal.pdf", type: "document", parentId: null },
  { id: "file-2", name: "Logo Design.png", type: "image", parentId: null },
  { id: "file-3", name: "Product Demo.mp4", type: "video", parentId: null }
];

export default function Files() {
  const [searchQuery, setSearchQuery] = useState("");
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
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
  
  // Filter items based on current folder
  const currentFolders = folders.filter(folder => folder.parentId === currentFolderId);
  const currentFiles = files.filter(file => file.parentId === currentFolderId);
  
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
  
  // Handle file download
  const handleFileDownload = (file: FileItem) => {
    // In a real app, this would trigger a file download
    alert(`Downloading file: ${file.name}`);
  };
  
  // Open rename dialog for a file
  const openRenameDialog = (item: {id: string, name: string, type: "file" | "folder"}) => {
    setItemToRename(item);
    setRenameDialogOpen(true);
  };
  
  // Handle item rename
  const handleRename = (itemId: string, newName: string) => {
    if (itemToRename?.type === "file") {
      // Update the file name in state
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === itemId 
            ? { ...file, name: newName } 
            : file
        )
      );
      
      // If this is the selected file, update it too
      if (selectedFile && selectedFile.id === itemId) {
        setSelectedFile({ ...selectedFile, name: newName });
      }
    } else {
      // Update the folder name in state
      setFolders(prevFolders => 
        prevFolders.map(folder => 
          folder.id === itemId 
            ? { ...folder, name: newName } 
            : folder
        )
      );
      
      // Update breadcrumb if needed
      setBreadcrumbs(prev => 
        prev.map(crumb => 
          crumb.id === itemId 
            ? { ...crumb, name: newName } 
            : crumb
        )
      );
    }
  };
  
  // Open delete dialog for a file or folder
  const openDeleteDialog = (item: {id: string, name: string, type: "file" | "folder"}) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };
  
  // Handle item delete
  const handleDelete = (itemId: string) => {
    if (itemToDelete?.type === "file") {
      // Remove the file from state
      setFiles(prevFiles => prevFiles.filter(file => file.id !== itemId));
      
      // If this is the selected file and the preview is open, close it
      if (selectedFile && selectedFile.id === itemId && previewDialogOpen) {
        setPreviewDialogOpen(false);
      }
    } else {
      // Remove the folder from state
      setFolders(prevFolders => prevFolders.filter(folder => folder.id !== itemId));
      
      // Also remove any files and subfolders inside this folder
      setFiles(prevFiles => prevFiles.filter(file => file.parentId !== itemId));
      setFolders(prevFolders => prevFolders.filter(folder => folder.parentId !== itemId));
      
      // If we're currently in this folder, navigate back to parent
      if (currentFolderId === itemId) {
        // Find the parent folder in breadcrumbs
        const parentIndex = breadcrumbs.length - 2;
        if (parentIndex >= 0) {
          navigateToBreadcrumb(parentIndex);
        }
      }
    }
  };
  
  const handleUploadComplete = () => {
    // In a real app, you would make an API call to upload the file
    // For now, we'll simulate adding a new file with a random type
    
    // Generate a random file type and name
    const fileTypes = ["document", "image", "video"];
    const fileExtensions = {
      document: ["pdf", "docx", "txt"],
      image: ["png", "jpg", "gif"],
      video: ["mp4", "mov", "avi"]
    };
    
    const randomType = fileTypes[Math.floor(Math.random() * fileTypes.length)] as "document" | "image" | "video";
    const extensions = fileExtensions[randomType];
    const randomExt = extensions[Math.floor(Math.random() * extensions.length)];
    
    const fileNames = {
      document: ["Project Brief", "Meeting Notes", "Contract", "Proposal"],
      image: ["Logo Design", "Banner", "Product Photo", "Team Portrait"],
      video: ["Product Demo", "Client Testimonial", "Tutorial", "Promo Video"]
    };
    
    const names = fileNames[randomType];
    const randomName = names[Math.floor(Math.random() * names.length)];
    
    const newFile = {
      id: `file-${Date.now()}`,
      name: `${randomName}.${randomExt}`,
      type: randomType,
      parentId: currentFolderId
    };
    
    setFiles(prevFiles => [...prevFiles, newFile]);
  };
  
  const handleCreateFolder = (name: string) => {
    // In a real app, you would make an API call to create the folder
    // For now, we'll simulate adding a new folder
    
    // Check if folder with same name already exists in current folder
    const folderExists = folders.some(folder => 
      folder.parentId === currentFolderId && 
      folder.name.toLowerCase() === name.toLowerCase()
    );
    
    if (folderExists) {
      // In a real app, you would show an error message
      console.error(`Folder "${name}" already exists in this location`);
      return;
    }
    
    const newFolder = {
      id: `folder-${Date.now()}`,
      name: name,
      parentId: currentFolderId
    };
    
    setFolders(prevFolders => [...prevFolders, newFolder]);
  };

  // Get file icon based on type
  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <FileImage className="h-10 w-10 text-creatively-blue" />;
      case "video":
        return <FileVideo className="h-10 w-10 text-creatively-orange" />;
      case "document":
      default:
        return <FileText className="h-10 w-10 text-creatively-purple" />;
    }
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
