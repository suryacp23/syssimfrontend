"use client";

import { useAuthStore } from "@/store/AuthStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/useProjects";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog";
import { RenameProjectDialog } from "@/components/dashboard/RenameProjectDialog";
import { DeleteProjectDialog } from "@/components/dashboard/DeleteProjectDialog";
import { Project } from "@/services/projectService";
import { Plus, FolderOpen } from "lucide-react";

export default function DashboardPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  const { data: projects, isLoading, isError, refetch } = useProjects();

  if (!token || !user) {
    return null; // Avoid flashing content before redirect
  }

  const filteredProjects = projects?.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenProject = (id: string) => {
    router.push(`/editor/${id}`);
  };

  const handleRenameClick = (project: Project) => {
    setSelectedProject(project);
    setRenameOpen(true);
  };

  const handleDeleteClick = (project: Project) => {
    setSelectedProject(project);
    setDeleteOpen(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your system design architectures
          </p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <Button onClick={() => setCreateOpen(true)} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pb-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-muted/50 animate-pulse rounded-xl border"></div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl">
            <p className="text-muted-foreground mb-4">Unable to fetch projects.</p>
            <Button variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : filteredProjects?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl bg-card">
            <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No Projects Yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {searchQuery ? "No projects match your search." : "Create your first project to get started."}
            </p>
            {!searchQuery && (
              <Button onClick={() => setCreateOpen(true)}>
                Create Your First Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects?.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={handleOpenProject}
                onRename={handleRenameClick}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
      
      <RenameProjectDialog 
        project={selectedProject} 
        open={renameOpen} 
        onOpenChange={setRenameOpen} 
      />
      
      <DeleteProjectDialog 
        project={selectedProject} 
        open={deleteOpen} 
        onOpenChange={setDeleteOpen} 
      />
    </div>
  );
}
