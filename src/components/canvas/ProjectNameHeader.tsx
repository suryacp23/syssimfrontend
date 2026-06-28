"use client";

import { useParams } from "next/navigation";
import { useProject } from "@/hooks/useProjects";

export function ProjectNameHeader() {
  const { id } = useParams();
  const projectId = id as string;

  const { data: project } = useProject(projectId);

  return (
    <h1 className="font-semibold text-foreground select-none">
      {project?.title || "System Design Simulator"}
    </h1>
  );
}
