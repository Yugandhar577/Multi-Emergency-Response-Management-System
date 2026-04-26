import { useState } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { MapCanvas } from '@/components/MapCanvas';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner, ErrorState } from '@/components/ui/Spinner';
import { useAreas, useEdges } from '@/features/graph/hooks';
import { useCompareRoutes } from '@/features/algorithms/hooks';
import { ALGO_META } from '@/lib/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PathResult } from '@/features/algorithms/types';

export function AlgorithmLab() {
  const { data: areas = [], isLoading: areasLoading } = useAreas();
  const { data: edges = [], isLoading: edgesLoading } = useEdges();
  const compareRoutesMutation = useCompareRoutes();

  const [sourceId, setSourceId] = useState<number>(0);
  const [destId, setDestId] = useState<number>(1);
  const [priorityCorridors, setPriorityCorridors] = useState(false);
  const [results, setResults] = useState<PathResult[] | null>(null);

  const handleRunAll = async () => {
    if (sourceId === destId) return;
    compareRoutesMutation.mutate(
      { source: sourceId, destination: destId, priority_corridors: priorityCorridors },
      {
        onSuccess: (data) => {
          setResults(data.results);
        },
      }
    );
  };

  if (areasLoading || edgesLoading) {
    return (
      <PageWrapper eyebrow="Issue 01 · Comparative Routing" title="The Algorithm Laboratory">
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  const overlays = results
    ? results.map((r) => ({
        paths: r.path,
        color: ALGO_META[r.algorithm as keyof typeof ALGO_META]?.color || '#171009',
        width: 3,
      }))
    : [];

  const sourceArea = areas.find((a) => a.id === sourceId);
  const destArea = areas.find((a) => a.id === destId);

  const markers = sourceArea && destArea
    ? [
        { areaId: sourceId, color: '#35544d', label: 'Start', size: 'lg' as const },
        { areaId: destId, color: '#8f3528', label: 'End', size: 'lg' as const },
      ]
    : [];

  const chartData = results
    ? results.map((r) => ({
        algorithm: ALGO_META[r.algorithm as keyof typeof ALGO_META]?.label || r.algorithm,
        elapsed_us: r.elapsed_us,
      }))
    : [];

  return (
    <PageWrapper
      eyebrow="Issue 01 · Comparative Routing"
      title="The Algorithm Laboratory"
      byline="Compare four major graph algorithms side-by-side to understand their performance characteristics and correctness on live emergency routing data."
    >
      <div className="space-y-8">
        {/* Control Strip */}
        <div className="rise-1 bg-parchment border border-mist p-6 rounded">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="eyebrow block mb-2">Source Area</label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(Number(e.target.value))}
                className="w-full border border-mist px-3 py-2 text-sm bg-paper text-ink rounded"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="eyebrow block mb-2">Destination Area</label>
              <select
                value={destId}
                onChange={(e) => setDestId(Number(e.target.value))}
                className="w-full border border-mist px-3 py-2 text-sm bg-paper text-ink rounded"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="eyebrow block mb-2">Options</label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={priorityCorridors}
                  onChange={(e) => setPriorityCorridors(e.target.checked)}
                />
                <span>Priority Corridors</span>
              </label>
            </div>
          </div>
          <Button
            onClick={handleRunAll}
            disabled={sourceId === destId || compareRoutesMutation.isPending}
            variant="primary"
            size="lg"
            className="mt-4 w-full"
          >
            {compareRoutesMutation.isPending ? 'Running...' : 'Run All Four'}
          </Button>
        </div>

        {/* Map */}
        {results && sourceArea && destArea && (
          <div className="rise-2">
            <MapCanvas
              areas={areas}
              edges={edges}
              overlays={overlays}
              markers={markers}
              height={520}
            />
          </div>
        )}

        {/* Results Grid */}
        {results && (
          <div className="rise-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {results.map((result) => {
                const meta = ALGO_META[result.algorithm as keyof typeof ALGO_META];
                return (
                  <Card key={result.algorithm}>
                    <CardHeader eyebrow={meta.label} title={meta.complexity} />
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-ink/60 uppercase tracking-wider">Total Weight</div>
                        <div className="numeral text-3xl text-ink mt-1">
                          {result.feasible ? result.total_weight : '−'}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="text-ink/60">
                          <div className="font-medium text-ink">{result.hops}</div>
                          <div>hops</div>
                        </div>
                        <div className="text-ink/60">
                          <div className="font-medium text-ink">{result.relaxations}</div>
                          <div>relax</div>
                        </div>
                        <div className="text-ink/60">
                          <div className="font-medium text-ink">{result.elapsed_us}</div>
                          <div>µs</div>
                        </div>
                      </div>
                      <Badge tone={result.feasible ? 'moss' : 'ruby'} className="w-full justify-center">
                        {result.feasible ? 'OK' : 'Failed'}
                      </Badge>
                      {result.note && (
                        <div className="text-xs italic text-ruby pt-2 border-t border-mist">{result.note}</div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Latency Chart */}
        {chartData.length > 0 && (
          <div className="rise-4">
            <Card>
              <CardHeader title="Execution Latency Comparison" />
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3,3" stroke="rgb(217 208 196)" />
                  <XAxis dataKey="algorithm" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="elapsed_us" fill="#b88b3b" name="Elapsed (µs)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {compareRoutesMutation.isError && (
          <ErrorState
            message="Failed to run algorithms"
            retry={() => handleRunAll()}
          />
        )}
      </div>
    </PageWrapper>
  );
}
