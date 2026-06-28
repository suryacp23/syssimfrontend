import { useQuery } from '@tanstack/react-query';
import { diagramService } from '@/services/diagramService';
import { useAuthStore } from '@/store/AuthStore';

export function useDiagram(projectId: string) {
  const { token, _hasHydrated } = useAuthStore();
  
  return useQuery({
    queryKey: ['diagram', projectId],
    queryFn: () => diagramService.getDiagram(projectId),
    enabled: !!projectId && !!token && _hasHydrated,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
