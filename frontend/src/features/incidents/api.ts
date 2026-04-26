import { api } from '@/lib/axios';
import type { CreateIncidentRequest, CreateIncidentResponse, Incident } from './types';

export async function fetchIncidents(status?: number): Promise<Incident[]> {
  if (status !== undefined) {
    const res = await api.get(`/incidents?status=${status}`);
    return res.data;
  }
  const res = await api.get('/incidents');
  return res.data;
}

export async function createIncident(req: CreateIncidentRequest): Promise<CreateIncidentResponse> {
  const res = await api.post('/incidents', req);
  return res.data;
}

export async function handleIncident(id: number): Promise<{ id: number; status: string }> {
  const res = await api.post(`/incidents/${id}/handle`);
  return res.data;
}
