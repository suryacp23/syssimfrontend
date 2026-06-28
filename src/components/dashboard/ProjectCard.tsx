import { Project } from "@/services/projectService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Edit, Trash2, Share } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectCardProps {
  project: Project;
  onOpen: (id: string) => void;
  onRename: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectCard({ project, onOpen, onRename, onDelete }: ProjectCardProps) {
  return (
    <Card 
      className="flex flex-col h-full group transition-all hover:border-primary/50 hover:shadow-md cursor-pointer relative"
      onClick={() => onOpen(project.id)}
    >
      <CardHeader className="pr-12">
        <CardTitle className="text-lg line-clamp-1">{project.title}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
        </CardDescription>
        
        <div 
          className="absolute right-4 top-4" 
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground focus:outline-none">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onRename(project)}>
                <Edit className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => alert("Share feature coming soon!")}>
                <Share className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem 
                variant="destructive" 
                onClick={() => onDelete(project)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {project.description || "No description provided."}
        </p>
      </CardContent>
    </Card>
  );
}
