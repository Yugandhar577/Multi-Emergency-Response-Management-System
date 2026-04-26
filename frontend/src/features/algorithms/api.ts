import { api } from '@/lib/axios';
import type { CompareRoutesRequest, CompareRoutesResponse, PathResult, RunRouteRequest } from './types';

export async function compareRoutes(req: CompareRoutesRequest): Promise<CompareRoutesResponse> {
  const res = await api.post('/route/compare', req);
  return res.data;
}

export async function runRoute(algorithm: string, req: RunRouteRequest): Promise<PathResult> {
  const res = await api.post(`/route/${algorithm}`, req);
  return res.data;
}
