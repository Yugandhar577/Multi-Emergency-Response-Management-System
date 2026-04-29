import { useState, useCallback } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { MapCanvas, type MapMarker, type OverlayPath } from '@/components/MapCanvas';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatNumeral } from '@/components/ui/StatNumeral';
import { Spinner } from '@/components/ui/Spinner';
import { useAreas, useEdges } from '@/features/graph/hooks';
import { useMST, useCritical, useSimulateClosure } from '@/features/resilience/hooks';
import type { ConnectivityResult } from '@/features/resilience/types';

export function Resilience() {
  const { data: areas = [] } = useAreas();
  const { data: edges = [] } = useEdges();

  const mstQuery = useMST();
  const criticalQuery = useCritical();
  const simulateClosureMutation = useSimulateClosure();

  const [showMST, setShowMST] = useState(false);
  const [showCritical, setShowCritical] = useState(false);
  const [showAPs, setShowAPs] = useState(false);
  const [closureResult, setClosureResult] = useState<ConnectivityResult | null>(null);

  // Load MST when toggle enabled
  const handleToggleMST = async (enable: boolean) => {
    setShowMST(enable);
    if (enable && !mstQuery.data) {
      mstQuery.refetch();
    }
  };

  // Load Critical when toggle enabled
  const handleToggleCritical = async (enable: boolean) => {
    setShowCritical(enable);
    setShowAPs(false); // Reset AP toggle when toggling bridges
    if (enable && !criticalQuery.data) {
      criticalQuery.refetch();
    }
  };

  // Toggle AP only when critical is already loaded
  const handleToggleAP = (enable: boolean) => {
    if (criticalQuery.data) {
      setShowAPs(enable);
    }
  };

  // Handle edge click to simulate closure
  const handleEdgeClick = (edgeId: number) => {
    simulateClosureMutation.mutate(edgeId, {
      onSuccess: (data) => {
        setClosureResult(data);
      },
    });
  };

  // Build overlays
  const overlays: OverlayPath[] = [];

  // MST overlay
  if (showMST && mstQuery.data) {
    mstQuery.data.edges.forEach((e) => {
      overlays.push({
        paths: [e.u, e.v],
        color: '#35544d',
        width: 2.5,
      });
    });
  }

  // Critical bridges overlay
  if (showCritical && criticalQuery.data) {
    criticalQuery.data.bridges.forEach((b) => {
      overlays.push({
        paths: [b.u, b.v],
        color: '#8f3528',
        width: 3.5,
      });
    });
  }

  // Isolated areas highlighting
  if (closureResult) {
    closureResult.isolated_areas.forEach((areaId) => {
      overlays.push({
        paths: [areaId],
        color: '#8f3528',
        width: 2,
      });
    });
  }

  // Build markers for APs and closure
  const markers: MapMarker[] = [];

  if (showAPs && showCritical && criticalQuery.data) {
    criticalQuery.data.articulation_areas.forEach((areaId) => {
      markers.push({
        areaId,
        color: '#8f3528',
        label: `AP-${areaId}`,
        size: 'md' as const,
      });
    });
  }

  if (closureResult) {
    closureResult.isolated_areas.forEach((areaId) => {
      markers.push({
        areaId,
        color: '#8f3528',
        label: `Isolated`,
        size: 'sm' as const,
      });
    });
  }

  return (
    <PageWrapper
      eyebrow="Infrastructure · Resilience"
      title="Resilience Analysis"
      byline="Visualize the road network's critical infrastructure: minimum spanning tree, bridges, articulation points, and simulate edge failures."
    >
      <div className="space-y-6">
        {/* Stat Strip */}
        <div className="rise-1 grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatNumeral
            eyebrow="Bridges"
            value={criticalQuery.data?.bridges.length || '-'}
            tone="ruby"
          />
          <StatNumeral
            eyebrow="Articulation Areas"
            value={criticalQuery.data?.articulation_areas.length || '-'}
            tone="ruby"
          />
          <StatNumeral
            eyebrow="MST Total Weight"
            value={mstQuery.data?.total_weight || '-'}
            tone="moss"
          />
        </div>

        {/* Main layout: map + controls */}
        <div className="rise-2 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Map */}
          <MapCanvas
            areas={areas}
            edges={edges}
            overlays={overlays}
            markers={markers}
            onEdgeClick={handleEdgeClick}
            height={600}
          />

          {/* Control Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader title="Topology Visualization" />
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showMST}
                    onChange={(e) => handleToggleMST(e.target.checked)}
                    disabled={mstQuery.isFetching}
                  />
                  <span>Show MST</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showCritical}
                    onChange={(e) => handleToggleCritical(e.target.checked)}
                    disabled={criticalQuery.isFetching}
                  />
                  <span>Show Bridges</span>
                </label>
                {criticalQuery.data && (
                  <label className="flex items-center gap-2 text-sm ml-4">
                    <input
                      type="checkbox"
                      checked={showAPs}
                      onChange={(e) => handleToggleAP(e.target.checked)}
                    />
                    <span>Show APs</span>
                  </label>
                )}
              </div>
            </Card>

            {/* Closure Simulator */}
            <Card>
              <CardHeader title="Edge Closure" />
              <div className="space-y-2 text-xs">
                <p className="text-ink/70">Click an edge on the map to simulate closure.</p>
                {simulateClosureMutation.isPending && <Spinner size="sm" />}
              </div>
            </Card>

            {/* Closure Results */}
            {closureResult && (
              <Card>
                <CardHeader title="Closure Result" />
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-ink/60">Components:</span>
                    <span className="ml-1 font-medium">{closureResult.component_count}</span>
                  </div>
                  <div>
                    <span className="text-ink/60">Isolated:</span>
                    <span className="ml-1 font-medium">{closureResult.isolated_areas.length}</span>
                  </div>
                  {closureResult.isolated_areas.length > 0 && (
                    <div className="text-xs text-ink/60 pt-2 border-t border-mist">
                      {closureResult.isolated_areas
                        .map((id) => areas.find((a) => a.id === id)?.name || `Area ${id}`)
                        .join(', ')}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
