import api from "@/lib/axios";

export interface Project {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
}

export interface UpdateProjectRequest {
  title: string;
  description?: string;
}

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get("/api/projects");
    return response.data;
  },

  getProject: async (id: string): Promise<Project> => {
    const response = await api.get(`/api/projects/${id}`);
    return response.data;
  },

  createProject: async (data: CreateProjectRequest): Promise<Project> => {
    const response = await api.post("/api/projects", data);
    return response.data;
  },

  updateProject: async (id: string, data: UpdateProjectRequest): Promise<Project> => {
    const response = await api.put(`/api/projects/${id}`, data);
    return response.data;
  },

  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/api/projects/${id}`);
  },
};
