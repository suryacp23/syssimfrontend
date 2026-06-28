import { useMutation, useQueryClient } from '@tanstack/react-query';
import { diagramService } from '@/services/diagramService';
import { DiagramData } from '@/types/diagram';

export function useSaveDiagram() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, diagram }: { projectId: string; diagram: DiagramData }) =>
      diagramService.saveDiagram(projectId, diagram),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['diagram', variables.projectId] });
    },
  });
}
