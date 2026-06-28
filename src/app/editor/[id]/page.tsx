"use client";

import { useParams } from "next/navigation";
import { useProject } from "@/hooks/useProjects";

export default function EditorPage() {
  const { id } = useParams();
  const { data: project, isLoading, isError } = useProject(id as string);

  if (isLoading) {
    return <div className="p-8">Loading project...</div>;
  }

  if (isError || !project) {
    return <div className="p-8 text-destructive">Failed to load project.</div>;
  }

  return (
    <div className="p-8 h-full flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold">{project.title}</h1>
      <p className="text-muted-foreground mt-2 text-center max-w-2xl">
        {project.description || "No description."}
      </p>
      
      <div className="mt-12 p-8 border-2 border-dashed rounded-xl bg-card text-center text-muted-foreground max-w-md w-full">
        Canvas Editor will go here.
        <br />
        <span className="text-xs">Project ID: {project.id}</span>
      </div>
    </div>
  );
}
