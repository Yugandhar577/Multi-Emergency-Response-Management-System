import { MapContainer, TileLayer, Popup, Circle, Marker, Polyline } from 'react-leaflet';
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
  dashed?: boolean;
}

export interface MapMarker {
  areaId: number;
  color: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface MapCanvasProps {
  areas: Area[];
  edges: Edge[];
  overlays?: OverlayPath[];
  markers?: MapMarker[];
  onEdgeClick?: (edgeId: number) => void;
  height?: number;
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
  areas,
  edges,
  overlays = [],
  markers = [],
  onEdgeClick,
  height = 480,
}: MapCanvasProps) {
  // Create a map of area id to coordinates for drawing paths
  const areaMap = new Map(areas.map((a) => [a.id, { lat: a.lat, lng: a.lng }]));

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

          return (
            <Polyline
              key={`overlay-${idx}`}
              positions={coords}
              pathOptions={{
                color: overlay.color,
                weight: overlay.width,
                dashArray: overlay.dashed ? '5,5' : undefined,
                opacity: 0.75,
              }}
            />
          );
        })}

        {/* Base graph edges */}
        {edges.map((edge) => {
          const u = areaMap.get(edge.u);
          const v = areaMap.get(edge.v);
          if (!u || !v) return null;

          const lineColor = edge.priority ? '#b88b3b' : '#d9d0c4';
          const coords: [number, number][] = [[u.lat, u.lng], [v.lat, v.lng]];

          return (
            <Polyline
              key={`edge-${edge.id}`}
              positions={coords}
              pathOptions={{
                color: lineColor,
                weight: edge.priority ? 2.5 : 1.5,
                opacity: edge.priority ? 0.7 : 0.4,
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
          if (marker && !marker.label) return null; // Only show if explicitly listed with label

          return (
            <Circle
              key={`zone-${area.id}`}
              center={[area.lat, area.lng]}
              radius={marker ? 800 : 400}
              pathOptions={{
                color: marker ? marker.color : 'rgba(217, 208, 196, 0.5)',
                weight: 2,
                opacity: 0.4,
                fillOpacity: marker ? 0.3 : 0.1,
              }}
            >
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
      </MapContainer>
    </div>
  );
}
