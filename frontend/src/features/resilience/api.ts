import { api } from '@/lib/axios';
import type { CriticalResult, ConnectivityResult, MSTResult } from './types';

export async function fetchMST(): Promise<MSTResult> {
  const res = await api.get('/graph/mst');
  return res.data;
}

export async function fetchCritical(): Promise<CriticalResult> {
  const res = await api.get('/graph/critical');
  return res.data;
}

export async function simulateClosure(removedEdgeId: number): Promise<ConnectivityResult> {
  const res = await api.post('/graph/connectivity', { removed_edge_id: removedEdgeId });
  return res.data;
}
