import { api } from '@/lib/axios';
import type { CompareDispatchResponse, DispatchPlan, RunDispatchRequest } from './types';

export async function runDispatch(strategy: string, req: RunDispatchRequest): Promise<DispatchPlan> {
  const res = await api.post(`/dispatch/${strategy}`, req);
  return res.data;
}

export async function compareDispatch(req: RunDispatchRequest): Promise<CompareDispatchResponse> {
  const res = await api.post('/dispatch/compare', req);
  return res.data;
}
