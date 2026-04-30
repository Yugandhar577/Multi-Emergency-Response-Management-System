import { MapContainer, TileLayer, Tooltip, Popup, Circle, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';

export interface Area {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

export interface Edge {
  id: number;
  u: number;
  v: number;
  weight: number;
  bonus: number;
  priority: boolean;
}

export interface OverlayPath {
  paths: number[]; // array of area IDs
  color: string;
  width: number;
  dashed?: string; // dashArray string like "8,4" or "1 0" (solid)
}

export interface MapMarker {
  areaId: number;
  color: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface AreaDetail {
  areaId: number;
  incidents?: { id: number; category: string; severity: number; status: string }[];
  teams?: { id: number; name: string; specialty: string; available: number }[];
  isArticulation?: boolean;
  bridgeCount?: number;
  notes?: string[];
  alertColor?: string;
}

export interface MovingMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label?: string;
}

interface MapCanvasProps {
  areas?: Area[];
  edges?: Edge[];
  overlays?: OverlayPath[];
  markers?: MapMarker[];
  movingMarkers?: MovingMarker[];
  onEdgeClick?: (edgeId: number) => void;
  onAreaClick?: (areaId: number) => void;
  areaDetails?: AreaDetail[];
  height?: number;
  baseZoneColor?: string;
}

function createSvgMarker(color: string, size: string = 'md'): L.Icon {
  const sizeMap = { sm: 16, md: 24, lg: 32 };
  const s = sizeMap[size as keyof typeof sizeMap] || 24;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <circle cx="${s / 2}" cy="${s / 2}" r="${s / 2.5}" fill="${color}" opacity="0.9"/>
      <circle cx="${s / 2}" cy="${s / 2}" r="${s / 2.8}" fill="none" stroke="${color}" stroke-width="1" opacity="0.5"/>
    </svg>
  `;

  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
    popupAnchor: [0, -s / 2],
  });
}

export function MapCanvas({
  areas = [],
  edges = [],
  overlays = [],
  markers = [],
  movingMarkers = [],
  onEdgeClick,
  onAreaClick,
  areaDetails = [],
  height = 480,
  baseZoneColor,
}: MapCanvasProps) {
  const areaMap = new Map(areas.map((a) => [a.id, { lat: a.lat, lng: a.lng }]));
  const detailMap = new Map(areaDetails.map((d) => [d.areaId, d]));
  const fallbackZoneColor = baseZoneColor ?? 'rgba(217, 208, 196, 0.5)';

  return (
    <div style={{ height: `${height}px` }} className="rounded border border-mist">
      <MapContainer
        center={[18.53, 73.85]}
        zoom={11}
        style={{ height: '100%', borderRadius: '0.375rem' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Overlay paths (algorithm routes, dispatch assignments) */}
        {overlays.map((overlay, idx) => {
          const coords: [number, number][] = [];
          for (const areaId of overlay.paths) {
            const area = areaMap.get(areaId);
            if (area) coords.push([area.lat, area.lng]);
          }
          if (coords.length === 0) return null;

          // Stagger opacity so overlapping identical paths are distinguishable
          const opacities = [0.9, 0.7, 0.5, 0.3];

          return (
            <Polyline
              key={`overlay-${idx}`}
              positions={coords}
              pathOptions={{
                color: overlay.color,
                weight: overlay.width,
                dashArray: overlay.dashed && overlay.dashed !== '1 0' ? overlay.dashed : undefined,
                opacity: opacities[idx % opacities.length],
              }}
            />
          );
        })}

        {/* Base graph edges */}
        {edges.map((edge) => {
          const u = areaMap.get(edge.u);
          const v = areaMap.get(edge.v);
          if (!u || !v) return null;

          // Use darker, more visible colors for non-priority edges
          const lineColor = edge.priority ? '#b88b3b' : '#6b5e4f';
          const coords: [number, number][] = [[u.lat, u.lng], [v.lat, v.lng]];

          return (
            <Polyline
              key={`edge-${edge.id}`}
              positions={coords}
              pathOptions={{
                color: lineColor,
                weight: edge.priority ? 2.5 : 2,
                opacity: edge.priority ? 0.8 : 0.6,
              }}
              eventHandlers={{
                click: () => onEdgeClick?.(edge.id),
              }}
            >
              <Popup>
                {areas.find((a) => a.id === edge.u)?.name} - {areas.find((a) => a.id === edge.v)?.name}
                <br />
                Weight: {edge.weight}
              </Popup>
            </Polyline>
          );
        })}

        {/* Area zone indicators */}
        {areas.map((area) => {
          const marker = markers.find((m) => m.areaId === area.id);
          const detail = detailMap.get(area.id);
          const alertColor = detail?.alertColor;
          if (marker && !marker.label && !alertColor) return null;
          const isHighlighted = !!alertColor || !!marker;
          const zoneColor = alertColor ?? marker?.color ?? fallbackZoneColor;
          const hasDetail = !!detail && (
            (detail.incidents && detail.incidents.length > 0) ||
            (detail.teams && detail.teams.length > 0) ||
            detail.isArticulation ||
            (detail.bridgeCount && detail.bridgeCount > 0) ||
            (detail.notes && detail.notes.length > 0)
          );

          return (
            <Circle
              key={`zone-${area.id}`}
              center={[area.lat, area.lng]}
              radius={isHighlighted ? 800 : 400}
              pathOptions={{
                color: zoneColor,
                weight: 2,
                opacity: 0.4,
                fillOpacity: isHighlighted ? 0.3 : 0.1,
              }}
              eventHandlers={{
                click: () => onAreaClick?.(area.id),
              }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={0.95} sticky>
                <div style={{ minWidth: '180px', fontSize: '12px', lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 600, color: '#171009', marginBottom: 4 }}>
                    {area.name} <span style={{ color: '#7a6d5b', fontWeight: 400 }}>· #{area.id}</span>
                  </div>

                  {detail?.isArticulation && (
                    <div style={{ color: '#8f3528', fontWeight: 600, marginBottom: 2 }}>
                      ⚠ Articulation point — removing this junction would split the network
                    </div>
                  )}
                  {detail && detail.bridgeCount !== undefined && detail.bridgeCount > 0 && (
                    <div style={{ color: '#8f3528', marginBottom: 2 }}>
                      {detail.bridgeCount} bridge{detail.bridgeCount === 1 ? '' : 's'} touch this area
                    </div>
                  )}

                  {detail?.teams && detail.teams.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ color: '#35544d', fontWeight: 600 }}>Stationed teams</div>
                      {detail.teams.map((t) => (
                        <div key={t.id} style={{ color: '#3d3424' }}>
                          · {t.name} ({t.specialty}) — {t.available} avail
                        </div>
                      ))}
                    </div>
                  )}

                  {detail?.incidents && detail.incidents.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ color: '#8f3528', fontWeight: 600 }}>Active incidents</div>
                      {detail.incidents.map((i) => (
                        <div key={i.id} style={{ color: '#3d3424' }}>
                          · #{i.id} {i.category} · sev {i.severity} · {i.status}
                        </div>
                      ))}
                    </div>
                  )}

                  {detail?.notes && detail.notes.length > 0 && (
                    <div style={{ marginTop: 4, color: '#3d3424' }}>
                      {detail.notes.map((n, i) => <div key={i}>· {n}</div>)}
                    </div>
                  )}

                  {!hasDetail && (
                    <div style={{ color: '#7a6d5b', fontStyle: 'italic' }}>
                      No teams, incidents, or structural notes for this area.
                    </div>
                  )}
                </div>
              </Tooltip>
              <Popup>
                {area.name} (ID: {area.id})
              </Popup>
            </Circle>
          );
        })}

        {/* Explicit markers (teams, incidents) */}
        {markers.map((m, idx) => {
          const area = areas.find((a) => a.id === m.areaId);
          if (!area) return null;
          return (
            <Marker
              key={`marker-${m.areaId}-${idx}`}
              position={[area.lat, area.lng]}
              icon={createSvgMarker(m.color, m.size)}
            >
              <Popup>
                {m.label || area.name}
              </Popup>
            </Marker>
          );
        })}

        {/* Moving markers (en-route teams) — interpolated lat/lng from caller */}
        {movingMarkers.map((m) => (
          <Marker
            key={`moving-${m.id}`}
            position={[m.lat, m.lng]}
            icon={createSvgMarker(m.color, 'md')}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
              {m.label ?? 'En route'}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
