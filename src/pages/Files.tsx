
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

// Sample data
const sampleFolders = [
  { id: "folder-1", name: "Brand Assets" },
  { id: "folder-2", name: "Marketing Materials" },
  { id: "folder-3", name: "Client Presentations" }
];

const sampleFiles = [
  { id: "file-1", name: "Project Proposal.pdf", type: "document" },
  { id: "file-2", name: "Logo Design.png", type: "image" },
  { id: "file-3", name: "Product Demo.mp4", type: "video" }
];

export default function Files() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSampleData, setShowSampleData] = useState(false);
  
  // Use sample data or empty arrays based on toggle
  const mockFolders = showSampleData ? sampleFolders : [];
  const mockFiles = showSampleData ? sampleFiles : [];

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
            onClick={() => setShowSampleData(!showSampleData)}
          >
            <Upload className="h-4 w-4" />
            {showSampleData ? "Hide Files" : "Show Files"}
          </Button>
          <Button variant="outline" className="gap-2">
            <FolderPlus className="h-4 w-4" />
            New Folder
          </Button>
        </div>
      </div>

      {mockFolders.length === 0 && mockFiles.length === 0 ? (
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
              onClick={() => setShowSampleData(true)}
            >
              <Upload className="h-4 w-4" />
              Upload Files
            </Button>
            <Button variant="outline" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Create Folder
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Folders section */}
          {mockFolders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Folders</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mockFolders.map(folder => (
                  <div 
                    key={folder.id}
                    className="bg-white rounded-lg border overflow-hidden transition-all hover:shadow-md cursor-pointer"
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
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded-full hover:bg-muted transition-colors">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="sr-only">Open menu</span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Rename</DropdownMenuItem>
                            <DropdownMenuItem>Delete</DropdownMenuItem>
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
          {mockFiles.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Files</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mockFiles.map(file => (
                  <div 
                    key={file.id}
                    className="bg-white rounded-lg border overflow-hidden transition-all hover:shadow-md"
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
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded-full hover:bg-muted transition-colors">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="sr-only">Open menu</span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Download</DropdownMenuItem>
                            <DropdownMenuItem>Rename</DropdownMenuItem>
                            <DropdownMenuItem>Delete</DropdownMenuItem>
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
    </div>
  );
}
