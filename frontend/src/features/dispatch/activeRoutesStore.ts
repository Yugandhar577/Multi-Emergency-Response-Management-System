import { create } from 'zustand';

export interface ActiveRoute {
  incidentId: number;
  teamId: number;
  algorithm: string;
  path: number[];          // area ids
  cost: number;            // path weight (= ETA in minutes)
  startedAt: number;       // ms epoch
  durationMs: number;      // animation duration, derived from cost
}

interface ActiveRoutesState {
  routes: ActiveRoute[];
  upsert: (route: ActiveRoute) => void;
  remove: (incidentId: number) => void;
  clearArrived: (now: number) => void;
}

export const useActiveRoutesStore = create<ActiveRoutesState>((set) => ({
  routes: [],
  upsert: (route) =>
    set((state) => ({
      routes: [...state.routes.filter((r) => r.incidentId !== route.incidentId), route],
    })),
  remove: (incidentId) =>
    set((state) => ({ routes: state.routes.filter((r) => r.incidentId !== incidentId) })),
  clearArrived: (now) =>
    set((state) => ({
      routes: state.routes.filter((r) => r.startedAt + r.durationMs > now),
    })),
}));

export function durationFromCost(cost: number): number {
  return Math.max(8000, Math.min(60000, cost * 600));
}
