import { useEffect, useState } from 'react';
import { useAreas } from '@/features/graph/hooks';
import { useActiveRoutesStore } from './activeRoutesStore';

export interface MovingMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label?: string;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function useAnimatedDispatchMarkers(): MovingMarker[] {
  const { data: areas = [] } = useAreas();
  const routes = useActiveRoutesStore((s) => s.routes);
  const clearArrived = useActiveRoutesStore((s) => s.clearArrived);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (routes.length === 0) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      clearArrived(t);
    }, 200);
    return () => window.clearInterval(id);
  }, [routes.length, clearArrived]);

  const areaById = new Map(areas.map((a) => [a.id, a]));
  const out: MovingMarker[] = [];

  for (const route of routes) {
    if (route.path.length < 2) continue;
    const elapsed = now - route.startedAt;
    const t = Math.max(0, Math.min(1, elapsed / route.durationMs));
    const totalSegments = route.path.length - 1;
    const traversed = t * totalSegments;
    const segIdx = Math.min(totalSegments - 1, Math.floor(traversed));
    const segT = traversed - segIdx;
    const fromArea = areaById.get(route.path[segIdx]);
    const toArea = areaById.get(route.path[segIdx + 1]);
    if (!fromArea || !toArea) continue;
    out.push({
      id: `route-${route.incidentId}`,
      lat: lerp(fromArea.lat, toArea.lat, segT),
      lng: lerp(fromArea.lng, toArea.lng, segT),
      color: '#171009',
      label: `Team ${route.teamId} to Inc ${route.incidentId}`,
    });
  }

  return out;
}
