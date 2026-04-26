import { api } from '@/lib/axios';
import type { Area, Edge } from './types';

export async function fetchAreas(): Promise<Area[]> {
  const res = await api.get('/areas');
  return res.data;
}

export async function fetchEdges(): Promise<Edge[]> {
  const res = await api.get('/edges');
  return res.data;
}
