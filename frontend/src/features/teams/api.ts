import { api } from '@/lib/axios';
import type { Team } from './types';

export async function fetchTeams(): Promise<Team[]> {
  const res = await api.get('/teams');
  return res.data;
}
