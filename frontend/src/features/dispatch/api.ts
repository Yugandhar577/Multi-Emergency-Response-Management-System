import { api } from '@/lib/axios';
import type {
  CompareDispatchResponse,
  DispatchPlan,
  ManualAssignRequest,
  ManualAssignResponse,
  RunDispatchRequest,
} from './types';

export async function runDispatch(strategy: string, req: RunDispatchRequest): Promise<DispatchPlan> {
  const res = await api.post(`/dispatch/${strategy}`, req);
  return res.data;
}

export async function compareDispatch(req: RunDispatchRequest): Promise<CompareDispatchResponse> {
  const res = await api.post('/dispatch/compare', req);
  return res.data;
}

export async function manualAssign(
  incidentId: number,
  req: ManualAssignRequest
): Promise<ManualAssignResponse> {
  const res = await api.post(`/incidents/${incidentId}/assign`, req);
  return res.data;
}
