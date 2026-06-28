"use client";

import { useParams, useRouter } from "next/navigation";
import { useProject } from "@/hooks/useProjects";
import { useDiagram } from "@/hooks/useDiagram";
import { useAuthStore } from "@/store/AuthStore";
import { useEffect } from "react";
import { Canvas } from "@/components/canvas/Canvas";
import { ReactFlowProvider } from "@xyflow/react";
import { useCanvasStore } from "@/store/canvasStore";

export default function EditorPage() {
  const { id } = useParams();
  const projectId = id as string;
  const router = useRouter();
  const { token, _hasHydrated } = useAuthStore();
  const setActiveProject = useCanvasStore((state) => state.setActiveProject);
  const setProjectData = useCanvasStore((state) => state.setProjectData);
  
  useEffect(() => {
    if (_hasHydrated && !token) {
      router.push("/login");
    }
  }, [_hasHydrated, token, router]);

  useEffect(() => {
    if (projectId) {
      setActiveProject(projectId);
    }
  }, [projectId, setActiveProject]);

  const { data: project, isLoading: isProjectLoading, isError: isProjectError } = useProject(projectId);
  const { data: diagramData, isLoading: isDiagramLoading } = useDiagram(projectId);

  // Initialize store when data loads
  const loadedProjects = useCanvasStore((state) => state.loadedProjects);

  useEffect(() => {
    if (diagramData && projectId && !loadedProjects[projectId]) {
      setProjectData(projectId, diagramData.nodes || [], diagramData.edges || []);
    }
  }, [diagramData, projectId, setProjectData, loadedProjects]);

  if (!_hasHydrated || !token) {
    return null;
  }

  if (isProjectLoading || isDiagramLoading) {
    return <div className="p-8">Loading project...</div>;
  }

  if (isProjectError || !project) {
    return <div className="p-8 text-destructive">Failed to load project.</div>;
  }

  return (
    <ReactFlowProvider>
      <div className="w-full h-full">
        <Canvas />
      </div>
    </ReactFlowProvider>
  );
}
