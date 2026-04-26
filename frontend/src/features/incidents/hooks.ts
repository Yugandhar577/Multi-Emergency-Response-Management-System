import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchIncidents, createIncident as createIncidentApi, handleIncident as handleIncidentApi } from './api';
import type { CreateIncidentRequest } from './types';

export function useIncidents(status?: number, refetchInterval?: number) {
  return useQuery({
    queryKey: status !== undefined ? ['incidents', status] : ['incidents'],
    queryFn: () => fetchIncidents(status),
    refetchInterval: refetchInterval || false,
    retry: 1,
  });
}

export function useCreateIncident() {
  return useMutation({
    mutationFn: (req: CreateIncidentRequest) => createIncidentApi(req),
  });
}

export function useHandleIncident() {
  return useMutation({
    mutationFn: (id: number) => handleIncidentApi(id),
  });
}
