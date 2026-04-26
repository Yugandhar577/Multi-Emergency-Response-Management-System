import { useMutation } from '@tanstack/react-query';
import { compareRoutes as compareRoutesApi, runRoute as runRouteApi } from './api';
import type { CompareRoutesRequest, RunRouteRequest } from './types';

export function useCompareRoutes() {
  return useMutation({
    mutationFn: (req: CompareRoutesRequest) => compareRoutesApi(req),
  });
}

export function useRunRoute() {
  return useMutation({
    mutationFn: ({ algorithm, req }: { algorithm: string; req: RunRouteRequest }) =>
      runRouteApi(algorithm, req),
  });
}
