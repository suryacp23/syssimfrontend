import api from "@/lib/axios";
import { DiagramData } from "@/types/diagram";

export const diagramService = {
  getDiagram: async (projectId: string): Promise<DiagramData> => {
    const response = await api.get(`/api/projects/${projectId}/diagram`);
    return response.data;
  },

  saveDiagram: async (projectId: string, diagram: DiagramData): Promise<{ message: string }> => {
    const response = await api.put(`/api/projects/${projectId}/diagram`, diagram);
    return response.data;
  },
};
