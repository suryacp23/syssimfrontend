import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService, CreateProjectRequest, UpdateProjectRequest } from "@/services/projectService";
import { useAuthStore } from "@/store/AuthStore";

export const useProjects = () => {
  const { _hasHydrated, token } = useAuthStore();
  return useQuery({
    queryKey: ["projects"],
    queryFn: projectService.getProjects,
    enabled: _hasHydrated && !!token,
  });
};

export const useProject = (id: string) => {
  const { _hasHydrated, token } = useAuthStore();
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => projectService.getProject(id),
    enabled: !!id && _hasHydrated && !!token,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectRequest) => projectService.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectRequest }) =>
      projectService.updateProject(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};
