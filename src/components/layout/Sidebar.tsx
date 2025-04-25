
import { Calendar, File, FolderKanban, Home, Settings, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={cn("w-64 border-r h-screen p-4 hidden md:block", className)}>
      <div className="flex items-center gap-2 mb-8">
        <div className="bg-creatively-purple rounded-lg w-8 h-8 flex items-center justify-center">
          <span className="text-white font-bold">C</span>
        </div>
        <h1 className="text-xl font-bold">Creatively</h1>
      </div>

      <nav className="space-y-1">
        <NavItem icon={<Home className="w-5 h-5" />} href="/" label="Dashboard" active />
        <NavItem icon={<FolderKanban className="w-5 h-5" />} href="/projects" label="Projects" />
        <NavItem icon={<Calendar className="w-5 h-5" />} href="/calendar" label="Calendar" />
        <NavItem icon={<File className="w-5 h-5" />} href="/files" label="Files" />
        <NavItem icon={<Users className="w-5 h-5" />} href="/team" label="Team" />
        <NavItem icon={<Settings className="w-5 h-5" />} href="/settings" label="Settings" />
      </nav>

      <div className="absolute bottom-8 left-4 right-4">
        <div className="bg-creatively-purple/10 rounded-lg p-4">
          <h3 className="font-medium text-sm">Free Plan</h3>
          <p className="text-xs text-muted-foreground mt-1">2/5 projects used</p>
          <div className="mt-2 h-1.5 bg-creatively-purple/20 rounded-full">
            <div className="h-full bg-creatively-purple rounded-full w-2/5"></div>
          </div>
          <button className="mt-3 text-xs text-creatively-purple font-medium">Upgrade Plan</button>
        </div>
      </div>
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  href: string;
  label: string;
  active?: boolean;
}

function NavItem({ icon, href, label, active }: NavItemProps) {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        active
          ? "bg-creatively-purple text-white"
          : "text-muted-foreground hover:bg-creatively-purple/10 hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
