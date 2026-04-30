import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { MapCanvas, type AreaDetail, type OverlayPath, type MapMarker } from '@/components/MapCanvas';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner, ErrorState } from '@/components/ui/Spinner';
import { useAreas, useEdges } from '@/features/graph/hooks';
import { useIncidents } from '@/features/incidents/hooks';
import { useTeams } from '@/features/teams/hooks';
import { useRunDispatch, useCompareDispatch, useManualAssign } from '@/features/dispatch/hooks';
import { useCompareRoutes } from '@/features/algorithms/hooks';
import { compareRoutes as compareRoutesApi } from '@/features/algorithms/api';
import {
  useActiveRoutesStore,
  durationFromCost,
} from '@/features/dispatch/activeRoutesStore';
import { useAnimatedDispatchMarkers } from '@/features/dispatch/useAnimatedDispatchMarkers';
import {
  SEVERITY_BAND,
  CATEGORY_LABEL,
  STATUS_LABEL,
  ALGO_META,
  SEVERITY_NODE_COLOR,
  NODE_NORMAL_COLOR,
  type AlgoKey,
} from '@/lib/constants';
import type { DispatchPlan } from '@/features/dispatch/types';
import type { PathResult } from '@/features/algorithms/types';
import type { Team } from '@/features/teams/types';

const SPECIALTY_LABEL: Record<number, string> = {
  0: 'Medical',
  1: 'Fire',
  2: 'Police',
  3: 'Disaster',
  4: 'Hazmat',
};

const ALGO_KEYS: AlgoKey[] = ['dijkstra', 'astar', 'bellman_ford', 'floyd_warshall'];

function formatEta(weight: number): string {
  if (!isFinite(weight) || weight < 0) return '--';
  if (weight < 60) return `${Math.round(weight)} min`;
  const h = Math.floor(weight / 60);
  const m = Math.round(weight % 60);
  return `${h}h ${m}m`;
}

function pickFastest(results: PathResult[]): PathResult | null {
  const feasible = results.filter((r) => r.feasible);
  if (feasible.length === 0) return null;
  return feasible.reduce((best, r) => (r.total_weight < best.total_weight ? r : best), feasible[0]);
}

export function Dispatcher() {
  const queryClient = useQueryClient();
  const { data: areas = [] } = useAreas();
  const { data: edges = [] } = useEdges();
  const { data: incidents = [] } = useIncidents(undefined, 3000);
  const { data: teams = [] } = useTeams();

  const {
    pendingIncidents,
    assignedIncidents,
    activeIncidents,
  } = useMemo(() => {
    const pending: typeof incidents = [];
    const assigned: typeof incidents = [];
    const active: typeof incidents = [];

    for (const inc of incidents) {
      if (inc.status === 0) pending.push(inc);
      if (inc.status === 1) assigned.push(inc);
      if (inc.status !== 2) active.push(inc);
    }

    return {
      pendingIncidents: pending,
      assignedIncidents: assigned,
      activeIncidents: active,
    };
  }, [incidents]);

  const runDispatchMutation = useRunDispatch();
  const compareDispatchMutation = useCompareDispatch();
  const manualAssignMutation = useManualAssign();
  const compareRoutesMutation = useCompareRoutes();

  const upsertActiveRoute = useActiveRoutesStore((s) => s.upsert);
  const movingMarkers = useAnimatedDispatchMarkers();

  const [currentPlan, setCurrentPlan] = useState<DispatchPlan | null>(null);
  const [comparePlans, setComparePlans] = useState<DispatchPlan[] | null>(null);

  // Inspector state
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [previewTeamId, setPreviewTeamId] = useState<number | null>(null);
  const [chosenAlgoByIncident, setChosenAlgoByIncident] = useState<Record<number, AlgoKey>>({});
  const [routeResults, setRouteResults] = useState<Record<number, PathResult[]>>({});
  const [autoPickingFastest, setAutoPickingFastest] = useState(false);

  // Auto-mode (bulk)
  const [autoMode, setAutoMode] = useState(false);
  const [autoStrategy, setAutoStrategy] = useState<'greedy' | 'hungarian' | 'mcmf'>('hungarian');
  const lastAutoRunRef = useRef<number>(0);

  const dispatchStrategyKey = (strategy: string) =>
    strategy === 'min_cost_max_flow' ? 'mcmf' : strategy;

  const refreshOperationalData = () => {
    queryClient.invalidateQueries({ queryKey: ['incidents'] });
    queryClient.invalidateQueries({ queryKey: ['incidents', 0] });
    queryClient.invalidateQueries({ queryKey: ['incidents', 1] });
    queryClient.invalidateQueries({ queryKey: ['teams'] });
  };

  const selectedIncident = useMemo(
    () =>
      pendingIncidents.find((i) => i.id === selectedIncidentId) ||
      assignedIncidents.find((i) => i.id === selectedIncidentId) ||
      null,
    [pendingIncidents, assignedIncidents, selectedIncidentId]
  );

  const inspectedTeam: Team | null = useMemo(() => {
    if (!selectedIncident) return null;
    if (previewTeamId !== null) return teams.find((t) => t.id === previewTeamId) ?? null;
    if (selectedIncident.assigned_team) {
      const m = selectedIncident.assigned_team.match(/#(\d+)/);
      if (m) {
        const id = parseInt(m[1], 10);
        const t = teams.find((tm) => tm.id === id);
        if (t) return t;
      }
      const byName = teams.find((tm) => tm.name === selectedIncident.assigned_team);
      if (byName) return byName;
    }
    const matchingSpecialty = teams.find(
      (tm) => tm.specialty === selectedIncident.category && tm.available_units > 0
    );
    return matchingSpecialty ?? teams.find((tm) => tm.available_units > 0) ?? teams[0] ?? null;
  }, [selectedIncident, previewTeamId, teams]);

  const eligibleTeamsForSelectedIncident = useMemo(() => {
    if (!selectedIncident) return [];
    const available = teams.filter((tm) => tm.available_units > 0);
    const matchingSpecialty = available.filter((tm) => tm.specialty === selectedIncident.category);
    return matchingSpecialty.length > 0 ? matchingSpecialty : available;
  }, [selectedIncident, teams]);

  const dropdownTeams = useMemo(() => {
    if (!selectedIncident) return teams;
    const currentAssignedName = selectedIncident.assigned_team;
    const availableOrAssigned = teams.filter(
      (tm) => tm.available_units > 0 || tm.name === currentAssignedName
    );
    const base = availableOrAssigned.length > 0 ? availableOrAssigned : teams;
    return [...base].sort((a, b) => {
      const aMatch = a.specialty === selectedIncident.category ? 0 : 1;
      const bMatch = b.specialty === selectedIncident.category ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return b.available_units - a.available_units;
    });
  }, [selectedIncident, teams]);

  // Auto bulk-dispatch when enabled
  useEffect(() => {
    if (!autoMode) return;
    if (pendingIncidents.length === 0) return;
    const sinceLast = Date.now() - lastAutoRunRef.current;
    if (sinceLast < 4000) return;
    if (runDispatchMutation.isPending || compareDispatchMutation.isPending) return;
    lastAutoRunRef.current = Date.now();
    runDispatchMutation.mutate(
      { strategy: autoStrategy, req: { priority_corridors: false } },
      {
        onSuccess: (data) => {
          setCurrentPlan(data);
          setComparePlans(null);
          appendActiveRoutesFromPlan(data);
          refreshOperationalData();
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode, pendingIncidents.length, autoStrategy]);

  function appendActiveRoutesFromPlan(plan: DispatchPlan) {
    plan.pairs
      .filter((p) => p.path && p.path.length >= 2)
      .forEach((p) => {
        upsertActiveRoute({
          incidentId: p.incident_id,
          teamId: p.team_id,
          algorithm: 'plan',
          path: p.path,
          cost: p.cost,
          startedAt: Date.now(),
          durationMs: durationFromCost(p.cost),
        });
      });
  }

  const handleCheckAlgorithms = () => {
    if (!selectedIncident || !inspectedTeam) return;
    compareRoutesMutation.mutate(
      {
        source: inspectedTeam.home_area_id,
        destination: selectedIncident.area_id,
        priority_corridors: false,
      },
      {
        onSuccess: (data) => {
          setRouteResults((prev) => ({ ...prev, [selectedIncident.id]: data.results }));
        },
      }
    );
  };

  const handleDispatch = (strategy: string) => {
    runDispatchMutation.mutate(
      { strategy, req: { priority_corridors: false } },
      {
        onSuccess: (data) => {
          setCurrentPlan(data);
          setComparePlans(null);
          appendActiveRoutesFromPlan(data);
          refreshOperationalData();
        },
      }
    );
  };

  const handleCompareStrategies = () => {
    compareDispatchMutation.mutate(
      { priority_corridors: false },
      { onSuccess: (data) => setComparePlans(data.strategies) }
    );
  };

  const commitAssign = (algo: AlgoKey, teamOverride?: Team) => {
    const team = teamOverride ?? inspectedTeam;
    if (!selectedIncident || !team) return;
    manualAssignMutation.mutate(
      { incidentId: selectedIncident.id, req: { team_id: team.id, algorithm: algo } },
      {
        onSuccess: (data) => {
          upsertActiveRoute({
            incidentId: data.incident_id,
            teamId: data.team_id,
            algorithm: data.algorithm,
            path: data.path,
            cost: data.cost,
            startedAt: Date.now(),
            durationMs: durationFromCost(data.cost),
          });
          setPreviewTeamId(null);
          refreshOperationalData();
        },
      }
    );
  };

  const handleManualAssign = () => {
    if (!selectedIncident) return;
    const algo = chosenAlgoByIncident[selectedIncident.id] ?? 'dijkstra';
    commitAssign(algo);
  };

  const handleAssignFastest = async () => {
    if (!selectedIncident) return;
    const candidateTeams = eligibleTeamsForSelectedIncident;
    if (candidateTeams.length === 0) return;

    setAutoPickingFastest(true);
    try {
      const comparisons = await Promise.all(
        candidateTeams.map(async (team) => {
          const data = await compareRoutesApi({
            source: team.home_area_id,
            destination: selectedIncident.area_id,
            priority_corridors: false,
          });
          return {
            team,
            results: data.results,
            fastest: pickFastest(data.results),
          };
        })
      );

      const best = comparisons
        .filter((c): c is { team: Team; results: PathResult[]; fastest: PathResult } => c.fastest !== null)
        .sort((a, b) => a.fastest.total_weight - b.fastest.total_weight)[0];

      if (!best) return;

      const algo = best.fastest.algorithm as AlgoKey;
      setPreviewTeamId(best.team.id);
      setRouteResults((prev) => ({ ...prev, [selectedIncident.id]: best.results }));
      setChosenAlgoByIncident((prev) => ({ ...prev, [selectedIncident.id]: algo }));
      commitAssign(algo, best.team);
    } finally {
      setAutoPickingFastest(false);
    }
  };

  // Map overlays
  const overlays: OverlayPath[] = [];

  if (currentPlan) {
    currentPlan.pairs.forEach((pair, idx) => {
      overlays.push({
        paths: pair.path,
        color: ['#35544d', '#b88b3b', '#8f3528'][idx % 3],
        width: 2,
      });
    });
  }

  // Inspector route comparison overlays
  if (selectedIncident && routeResults[selectedIncident.id]) {
    const chosen = chosenAlgoByIncident[selectedIncident.id];
    routeResults[selectedIncident.id].forEach((r) => {
      if (!r.feasible) return;
      const meta = ALGO_META[r.algorithm as AlgoKey];
      const isChosen = chosen === r.algorithm;
      overlays.push({
        paths: r.path,
        color: meta?.color ?? '#171009',
        width: isChosen ? 4 : 1.8,
        dashed: isChosen ? undefined : '6,4',
      });
    });
  }

  // Full path under each animated dot; provides a visible trail behind the marker.
  const activeRoutes = useActiveRoutesStore((s) => s.routes);
  activeRoutes.forEach((route) => {
    if (route.path.length < 2) return;
    overlays.push({
      paths: route.path,
      color: '#35544d',
      width: 3,
    });
  });

  const markers: MapMarker[] = [
    ...teams.map((t) => ({
      areaId: t.home_area_id,
      color: '#35544d',
      label: `Team ${t.id}`,
      size: 'sm' as const,
    })),
    ...activeIncidents.map((i) => ({
      areaId: i.area_id,
      color: SEVERITY_NODE_COLOR(i.severity),
      label: `Inc ${i.id} · ${STATUS_LABEL[i.status] ?? 'Active'}`,
      size: 'md' as const,
    })),
  ];

  const areaDetails: AreaDetail[] = areas.map((a) => {
    const stationedTeams = teams.filter((t) => t.home_area_id === a.id);
    const incidentsHere = activeIncidents.filter((i) => i.area_id === a.id);
    const maxSeverity = incidentsHere.reduce((max, i) => Math.max(max, i.severity), -1);
    const alertColor = maxSeverity >= 0 ? SEVERITY_NODE_COLOR(maxSeverity) : undefined;
    return {
      areaId: a.id,
      alertColor,
      teams: stationedTeams.map((t) => ({
        id: t.id,
        name: t.name || `Team ${t.id}`,
        specialty: SPECIALTY_LABEL[t.specialty] ?? 'Unknown',
        available: t.available_units,
      })),
      incidents: incidentsHere.map((i) => ({
        id: i.id,
        category: CATEGORY_LABEL[i.category] ?? 'Unknown',
        severity: i.severity,
        status: STATUS_LABEL[i.status] ?? 'Other',
      })),
    };
  });

  if (!areas.length || !teams.length) {
    return (
      <PageWrapper eyebrow="Operations / Dispatch comparison" title="Dispatcher">
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  const inspectorRoutes = selectedIncident ? routeResults[selectedIncident.id] ?? [] : [];
  const fastestResult = pickFastest(inspectorRoutes);
  const chosenAlgo = selectedIncident
    ? chosenAlgoByIncident[selectedIncident.id] ?? 'dijkstra'
    : 'dijkstra';
  const rankedResults = [...inspectorRoutes].sort((a, b) => {
    if (!a.feasible) return 1;
    if (!b.feasible) return -1;
    return a.total_weight - b.total_weight;
  });

  return (
    <PageWrapper
      eyebrow="Operations / Dispatch comparison"
      title="Dispatcher"
      byline="Compare routing algorithms per incident, assign teams manually or via bulk strategies, and watch live route progression."
    >
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_360px] gap-6 items-start">
        {/* Left: Incidents Queue */}
        <div className="rise-1 space-y-3 max-h-[680px] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="eyebrow">Incidents</h3>
            <span className="text-[0.65rem] text-ink/60">
              {pendingIncidents.length} pending / {assignedIncidents.length} assigned
            </span>
          </div>

          {pendingIncidents.length === 0 && assignedIncidents.length === 0 && (
            <div className="text-sm text-ink/60 italic">No active incidents</div>
          )}

          {[...pendingIncidents, ...assignedIncidents].map((inc) => {
            const sevBand = SEVERITY_BAND(inc.severity);
            const area = areas.find((a) => a.id === inc.area_id);
            const isSelected = selectedIncidentId === inc.id;
            const isAssigned = inc.status === 1;
            return (
              <Card
                key={inc.id}
                className={`p-3 cursor-pointer transition-all ${
                  isSelected ? 'border-2 border-ink ring-1 ring-ink/30' : ''
                }`}
                onClick={() => {
                  setSelectedIncidentId(inc.id);
                  setPreviewTeamId(null);
                }}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge tone="ruby" className={sevBand.cls}>{sevBand.label}</Badge>
                    {isAssigned && (
                      <span className="text-[0.6rem] text-brass uppercase tracking-wider">assigned</span>
                    )}
                  </div>
                  <div className="text-xs font-medium text-ink">{CATEGORY_LABEL[inc.category]}</div>
                  <div className="text-xs text-ink/70">{area?.name ?? `Area ${inc.area_id}`}</div>
                  {isAssigned && inc.assigned_team && (
                    <div className="text-[0.65rem] text-brass">to {inc.assigned_team}</div>
                  )}
                  {inc.eta_units > 0 && (
                    <div className="text-[0.65rem] text-ink/60">ETA: {formatEta(inc.eta_units)}</div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Center: Map */}
        <div className="rise-2">
          <MapCanvas
            areas={areas}
            edges={edges}
            overlays={overlays}
            markers={markers}
            movingMarkers={movingMarkers}
            areaDetails={areaDetails}
            baseZoneColor={NODE_NORMAL_COLOR}
            height={680}
          />
        </div>

        {/* Right: Inspector + Bulk operations */}
        <div className="rise-3 space-y-4">
          {selectedIncident ? (
            <Card>
              {/* Header row: ID + status pill */}
              <div className="flex items-baseline justify-between mb-1">
                <div className="display text-xl text-ink leading-tight">
                  Incident #{selectedIncident.id}
                </div>
                <span
                  className={`text-[0.6rem] uppercase tracking-wider px-2 py-0.5 ${
                    selectedIncident.status === 1
                      ? 'bg-brass/20 text-brass'
                      : 'bg-ruby/15 text-ruby'
                  }`}
                >
                  {selectedIncident.status === 1 ? 'assigned' : 'pending'}
                </span>
              </div>
              <div className="text-xs text-ink/65 mb-3">
                {CATEGORY_LABEL[selectedIncident.category]} / sev {selectedIncident.severity}
                {' / '}
                {areas.find((a) => a.id === selectedIncident.area_id)?.name ?? `Area ${selectedIncident.area_id}`}
              </div>
              <div className="hairline mb-3 opacity-30" />

              <div className="space-y-3 text-sm">
                {/* Team picker */}
                <div>
                  <label className="block text-[0.65rem] uppercase tracking-wider text-ink/60 mb-1">
                    Responding team
                  </label>
                  <select
                    className="w-full text-xs border border-ink/20 bg-paper px-2 py-1.5"
                    value={inspectedTeam?.id ?? ''}
                    onChange={(e) => setPreviewTeamId(parseInt(e.target.value, 10))}
                  >
                    {dropdownTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {(t.name || `Team ${t.id}`)} / {SPECIALTY_LABEL[t.specialty]} /{' '}
                        {t.available_units} avail
                      </option>
                    ))}
                  </select>
                  <p className="text-[0.65rem] text-ink/55 mt-1">
                    Fastest assignment auto-checks available {SPECIALTY_LABEL[selectedIncident.category]?.toLowerCase()} teams first; this dropdown is for manual override.
                  </p>
                </div>

                {/* Routing section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[0.65rem] uppercase tracking-wider text-ink/60">
                      Routing
                    </span>
                    {inspectorRoutes.length > 0 && (
                      <span className="text-[0.6rem] text-ink/50">
                        {inspectorRoutes.length} algorithms compared
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={handleCheckAlgorithms}
                    variant={inspectorRoutes.length === 0 ? 'primary' : 'outline'}
                    size="sm"
                    className="w-full justify-center mb-2"
                    disabled={!inspectedTeam || compareRoutesMutation.isPending}
                  >
                    {compareRoutesMutation.isPending
                      ? 'Comparing all 4 algorithms...'
                      : inspectorRoutes.length > 0
                      ? 'Re-check all algorithms'
                      : 'Check all algorithms'}
                  </Button>

                  {inspectorRoutes.length === 0 ? (
                    <div className="bg-parchment/40 border border-ink/10 px-2 py-3 text-[0.7rem] text-ink/55 italic text-center">
                      Runs Dijkstra / A* / Bellman-Ford / Floyd-Warshall side-by-side and shows ETA + compute time.
                    </div>
                  ) : (
                    <div className="bg-parchment/50 border border-ink/10">
                      <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-2 px-2 py-1 text-[0.6rem] uppercase tracking-wider text-ink/60 border-b border-ink/10">
                        <span>Algorithm</span>
                        <span className="text-right">ETA</span>
                        <span className="text-right">Compute</span>
                        <span></span>
                      </div>
                      {rankedResults.map((r) => {
                        const meta = ALGO_META[r.algorithm as AlgoKey];
                        const isFastest = fastestResult?.algorithm === r.algorithm;
                        const isChosen = chosenAlgo === r.algorithm;
                        return (
                          <button
                            key={r.algorithm}
                            onClick={() =>
                              setChosenAlgoByIncident((prev) => ({
                                ...prev,
                                [selectedIncident.id]: r.algorithm as AlgoKey,
                              }))
                            }
                            className={`w-full text-left grid grid-cols-[1.4fr_1fr_1fr_auto] gap-2 px-2 py-1.5 text-xs items-center border-b border-ink/5 last:border-b-0 ${
                              isChosen ? 'bg-ink/8 ring-1 ring-inset ring-ink/20' : 'hover:bg-mist/30'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                style={{ background: meta?.color }}
                                className="inline-block w-3 h-1"
                              />
                              <span className={isChosen ? 'font-semibold' : ''}>
                                {meta?.label ?? r.algorithm}
                              </span>
                            </span>
                            <span className="text-right tabular-nums">
                              {r.feasible ? formatEta(r.total_weight) : '--'}
                            </span>
                            <span className="text-right tabular-nums text-ink/60">
                              {r.elapsed_us}us
                            </span>
                            <span className="text-[0.65rem] w-10">{isFastest ? 'best' : ''}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected summary + actions */}
                {inspectorRoutes.length > 0 && (
                  <div className="bg-ink/[0.04] border-l-2 border-ink/40 px-2 py-1.5 text-[0.7rem]">
                    <span className="text-ink/55">Selected:</span>{' '}
                    <span className="font-semibold text-ink">{ALGO_META[chosenAlgo]?.label}</span>
                    {(() => {
                      const sel = inspectorRoutes.find((r) => r.algorithm === chosenAlgo);
                      return sel?.feasible ? (
                        <span className="text-ink/65"> / ETA {formatEta(sel.total_weight)}</span>
                      ) : null;
                    })()}
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <Button
                    onClick={handleAssignFastest}
                    variant="moss"
                    size="md"
                    className="w-full justify-center"
                    disabled={
                      eligibleTeamsForSelectedIncident.length === 0 ||
                      autoPickingFastest ||
                      manualAssignMutation.isPending
                    }
                  >
                    {autoPickingFastest
                      ? 'Finding fastest team...'
                      : selectedIncident.status === 1
                      ? 'Auto-pick fastest team'
                      : 'Auto-pick fastest team'}
                  </Button>
                  <Button
                    onClick={handleManualAssign}
                    variant="outline"
                    size="md"
                    className="w-full justify-center"
                    disabled={
                      !inspectedTeam ||
                      manualAssignMutation.isPending ||
                      inspectorRoutes.length === 0
                    }
                  >
                    {selectedIncident.status === 1 ? 'Re-assign with selected' : 'Assign with selected'}
                  </Button>
                </div>

                {selectedIncident.status === 1 && (
                  <p className="text-[0.65rem] text-ink/55 leading-snug">
                    Already assigned to <span className="font-medium text-ink/75">{selectedIncident.assigned_team}</span>.
                    Re-assigning recomputes the route and switches the team.
                  </p>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader title="Inspector" />
              <p className="text-xs text-ink/60 leading-relaxed">
                Click an incident on the left to compare routing algorithms, see per-algorithm ETAs, and
                assign a specific team manually or with the fastest available route.
              </p>
            </Card>
          )}

          {/* Bulk operations: combines auto-mode + bulk strategies */}
          <Card>
            <div className="flex items-baseline justify-between mb-1">
              <div className="display text-xl text-ink leading-tight">Bulk operations</div>
              <span className="text-[0.6rem] uppercase tracking-wider text-ink/55">
                {pendingIncidents.length} pending
              </span>
            </div>
            <div className="text-xs text-ink/65 mb-3">
              Run an assignment strategy across every pending incident at once.
            </div>
            <div className="hairline mb-3 opacity-30" />

            {/* Strategy radio */}
            <div className="space-y-1.5 mb-3">
              <label className="block text-[0.65rem] uppercase tracking-wider text-ink/60 mb-1">
                Strategy
              </label>
              {([
                { key: 'greedy', label: 'Greedy', note: 'Fast, locally optimal' },
                { key: 'hungarian', label: 'Hungarian', note: 'Globally optimal matching' },
                { key: 'mcmf', label: 'Min-Cost Max-Flow', note: 'Capacity-aware' },
              ] as const).map((s) => (
                <label
                  key={s.key}
                  className={`flex items-start gap-2 px-2 py-1.5 text-xs cursor-pointer border ${
                    autoStrategy === s.key
                      ? 'border-ink bg-ink/5'
                      : 'border-ink/15 hover:bg-mist/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="bulk-strategy"
                    value={s.key}
                    checked={autoStrategy === s.key}
                    onChange={() => setAutoStrategy(s.key)}
                    className="mt-0.5"
                  />
                  <span className="flex-1">
                    <span className={autoStrategy === s.key ? 'font-semibold' : ''}>{s.label}</span>
                    <span className="block text-[0.65rem] text-ink/55">{s.note}</span>
                  </span>
                </label>
              ))}
            </div>

            {/* Primary action */}
            <div className="space-y-2">
              <Button
                onClick={() => handleDispatch(autoStrategy)}
                variant="primary"
                size="md"
                className="w-full justify-center"
                disabled={runDispatchMutation.isPending || pendingIncidents.length === 0}
              >
                {runDispatchMutation.isPending
                  ? 'Dispatching...'
                  : `Dispatch all (${pendingIncidents.length})`}
              </Button>
              <Button
                onClick={handleCompareStrategies}
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                disabled={compareDispatchMutation.isPending || pendingIncidents.length === 0}
              >
                Compare all three strategies
              </Button>
            </div>

            <div className="hairline my-3 opacity-30" />

            {/* Auto toggle */}
            <label className="flex items-start gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={autoMode}
                onChange={(e) => setAutoMode(e.target.checked)}
                className="mt-0.5"
              />
              <span className="flex-1">
                <span className="font-medium text-ink">Auto-fire on new incidents</span>
                <span className="block text-[0.65rem] text-ink/55">
                  Re-runs <em>{autoStrategy === 'mcmf' ? 'Min-Cost Max-Flow' : autoStrategy === 'hungarian' ? 'Hungarian' : 'Greedy'}</em> whenever pending incidents appear (4 s cooldown).
                </span>
              </span>
            </label>
            {autoMode && pendingIncidents.length > 0 && (
              <div className="text-[0.65rem] text-moss mt-2">
                Watching {pendingIncidents.length} pending incident
                {pendingIncidents.length === 1 ? '' : 's'}...
              </div>
            )}

            {/* Last run */}
            {currentPlan && (
              <div className="mt-3 pt-3 border-t border-ink/10 text-[0.7rem] text-ink/65 flex justify-between">
                <span>
                  Last: <span className="font-medium text-ink">{currentPlan.strategy}</span>
                </span>
                <span className="tabular-nums">
                  cost {currentPlan.total_cost} / {currentPlan.elapsed_us}us
                </span>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Comparison Results */}
      {comparePlans && (
        <div className="rise-4 mt-8 space-y-4">
          <h3 className="eyebrow">Strategy Comparison</h3>
          <p className="text-sm text-ink/65">
            Preview only. Choose a strategy below to commit assignments.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparePlans.map((plan) => {
              const isLowest = comparePlans.every((p) => p.total_cost >= plan.total_cost);
              return (
                <Card key={plan.strategy} className={isLowest ? 'border-2 border-moss' : ''}>
                  <CardHeader title={plan.strategy} />
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-ink/60 uppercase">Total Cost</div>
                      <div className={`numeral text-2xl mt-1 ${isLowest ? 'text-moss' : 'text-ink'}`}>
                        {plan.total_cost}
                      </div>
                    </div>
                    {isLowest && <Badge tone="moss" className="w-full justify-center">Winner</Badge>}
                    <Button
                      onClick={() => handleDispatch(dispatchStrategyKey(plan.strategy))}
                      variant={isLowest ? 'moss' : 'outline'}
                      size="sm"
                      className="w-full"
                      disabled={runDispatchMutation.isPending}
                    >
                      {isLowest ? 'Dispatch Winner' : 'Dispatch This'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {(runDispatchMutation.isError ||
        compareDispatchMutation.isError ||
        manualAssignMutation.isError ||
        compareRoutesMutation.isError) && (
        <ErrorState message="Dispatch operation failed" />
      )}
    </PageWrapper>
  );
}
