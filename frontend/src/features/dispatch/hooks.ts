import { useMutation } from '@tanstack/react-query';
import {
  runDispatch as runDispatchApi,
  compareDispatch as compareDispatchApi,
  manualAssign as manualAssignApi,
} from './api';
import type { ManualAssignRequest, RunDispatchRequest } from './types';

export function useRunDispatch() {
  return useMutation({
    mutationFn: ({ strategy, req }: { strategy: string; req: RunDispatchRequest }) =>
      runDispatchApi(strategy, req),
  });
}

export function useCompareDispatch() {
  return useMutation({
    mutationFn: (req: RunDispatchRequest) => compareDispatchApi(req),
  });
}

export function useManualAssign() {
  return useMutation({
    mutationFn: ({ incidentId, req }: { incidentId: number; req: ManualAssignRequest }) =>
      manualAssignApi(incidentId, req),
  });
}
