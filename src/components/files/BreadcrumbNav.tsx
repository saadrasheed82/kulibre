import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home, ChevronRight } from "lucide-react";

export interface FolderPath {
  id: string;
  name: string;
}

export interface BreadcrumbNavProps {
  folderPath: FolderPath[];
  onNavigate: (folderId: string, index: number) => void;
}

export function BreadcrumbNav({
  folderPath,
  onNavigate
}: BreadcrumbNavProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink onClick={() => onNavigate("root", 0)} className="flex items-center">
            <Home className="h-4 w-4 mr-1" />
            My Files
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {folderPath.map((folder, index) => (
          <BreadcrumbItem key={folder.id}>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            
            {index === folderPath.length - 1 ? (
              <BreadcrumbPage>{folder.name}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink onClick={() => onNavigate(folder.id, index + 1)}>
                {folder.name}
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}