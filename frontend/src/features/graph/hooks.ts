import { useQuery } from '@tanstack/react-query';
import { fetchAreas, fetchEdges } from './api';

export function useAreas() {
  return useQuery({
    queryKey: ['areas'],
    queryFn: fetchAreas,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useEdges() {
  return useQuery({
    queryKey: ['edges'],
    queryFn: fetchEdges,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
