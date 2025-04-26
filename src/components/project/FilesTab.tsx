import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { File, FileImage, FileText, FileVideo, FolderOpen, MoreVertical, Plus, Upload } from "lucide-react";

interface FileItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'audio';
  size: string;
  modified: string;
  version: number;
  status?: 'final' | 'draft';
}

interface Folder {
  id: string;
  name: string;
  files: FileItem[];
}

export function FilesTab() {
  const [folders, setFolders] = useState<Folder[]>([
    {
      id: '1',
      name: 'Draft 1',
      files: [
        {
          id: '1',
          name: 'Logo_v1.psd',
          type: 'image',
          size: '2.5 MB',
          modified: '2 days ago',
          version: 1,
          status: 'draft'
        },
        {
          id: '2',
          name: 'Brand_Guidelines.pdf',
          type: 'document',
          size: '4.2 MB',
          modified: '3 days ago',
          version: 2,
          status: 'draft'
        }
      ]
    },
    {
      id: '2',
      name: 'Client Uploads',
      files: [
        {
          id: '3',
          name: 'Reference_Images.zip',
          type: 'document',
          size: '15.8 MB',
          modified: '1 week ago',
          version: 1
        }
      ]
    },
    {
      id: '3',
      name: 'Final Assets',
      files: []
    }
  ]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <FileImage className="h-5 w-5" />;
      case 'video':
        return <FileVideo className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search files..."
            className="w-[300px]"
          />
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Folder
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {folders.map(folder => (
          <Card key={folder.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">{folder.name}</h3>
                <Badge variant="secondary" className="ml-2">
                  {folder.files.length} files
                </Badge>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>

            <div className="divide-y">
              {folder.files.map(file => (
                <div key={file.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.type)}
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {file.name}
                        {file.status && (
                          <Badge variant={file.status === 'final' ? 'default' : 'secondary'}>
                            {file.status}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {file.size} • Modified {file.modified} • Version {file.version}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Download</DropdownMenuItem>
                      <DropdownMenuItem>Rename</DropdownMenuItem>
                      <DropdownMenuItem>Version History</DropdownMenuItem>
                      <DropdownMenuItem>Mark as Final</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              {folder.files.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No files in this folder</p>
                  <Button variant="link" className="mt-2">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}