import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchMST, fetchCritical, simulateClosure as simulateClosureApi } from './api';

export function useMST() {
  return useQuery({
    queryKey: ['mst'],
    queryFn: fetchMST,
    enabled: false,
    retry: 1,
  });
}

export function useCritical() {
  return useQuery({
    queryKey: ['critical'],
    queryFn: fetchCritical,
    enabled: false,
    retry: 1,
  });
}

export function useSimulateClosure() {
  return useMutation({
    mutationFn: (edgeId: number) => simulateClosureApi(edgeId),
  });
}
