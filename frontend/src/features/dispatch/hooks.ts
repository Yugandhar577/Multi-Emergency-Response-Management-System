import { useMutation } from '@tanstack/react-query';
import { runDispatch as runDispatchApi, compareDispatch as compareDispatchApi } from './api';
import type { RunDispatchRequest } from './types';

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
