import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { MapCanvas } from '@/components/MapCanvas';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner, ErrorState } from '@/components/ui/Spinner';
import { StatNumeral } from '@/components/ui/StatNumeral';
import { useAreas, useEdges } from '@/features/graph/hooks';
import { useIncidents } from '@/features/incidents/hooks';
import { useTeams } from '@/features/teams/hooks';
import { useRunDispatch, useCompareDispatch } from '@/features/dispatch/hooks';
import { SEVERITY_BAND, CATEGORY_LABEL } from '@/lib/constants';
import type { DispatchPlan } from '@/features/dispatch/types';

export function Dispatcher() {
  const queryClient = useQueryClient();
  const { data: areas = [] } = useAreas();
  const { data: edges = [] } = useEdges();
  const { data: incidents = [] } = useIncidents(0, 3000); // Pending, refetch every 3s
  const { data: teams = [] } = useTeams();

  const runDispatchMutation = useRunDispatch();
  const compareDispatchMutation = useCompareDispatch();

  const [currentPlan, setCurrentPlan] = useState<DispatchPlan | null>(null);
  const [comparePlans, setComparePlans] = useState<DispatchPlan[] | null>(null);

  const dispatchStrategyKey = (strategy: string) =>
    strategy === 'min_cost_max_flow' ? 'mcmf' : strategy;

  const refreshOperationalData = () => {
    queryClient.invalidateQueries({ queryKey: ['incidents'] });
    queryClient.invalidateQueries({ queryKey: ['incidents', 0] });
    queryClient.invalidateQueries({ queryKey: ['teams'] });
  };

  const handleDispatch = (strategy: string) => {
    runDispatchMutation.mutate(
      { strategy, req: { priority_corridors: false } },
      {
        onSuccess: (data) => {
          setCurrentPlan(data);
          setComparePlans(null);
          refreshOperationalData();
        },
      }
    );
  };

  const handleCompare = () => {
    compareDispatchMutation.mutate(
      { priority_corridors: false },
      {
        onSuccess: (data) => {
          setComparePlans(data.strategies);
        },
      }
    );
  };

  // Map overlays from current dispatch
  const dispatchOverlays = currentPlan
    ? currentPlan.pairs.map((pair, idx) => ({
        paths: pair.path,
        color: ['#35544d', '#b88b3b', '#8f3528'][idx % 3],
        width: 2,
      }))
    : [];

  // Markers for teams and incidents
  const markers = [
    ...teams.map((t) => {
      const homeArea = areas.find((a) => a.id === t.home_area_id);
      return {
        areaId: t.home_area_id,
        color: '#35544d',
        label: `Team ${t.id}`,
      };
    }),
    ...incidents.map((i) => ({
      areaId: i.area_id,
      color: '#8f3528',
      label: `Incident ${i.id}`,
    })),
  ];

  if (!areas.length || !teams.length) {
    return (
      <PageWrapper eyebrow="Emergency Operations · Assignment" title="Dispatcher">
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      eyebrow="Operations / Dispatch comparison"
      title="Dispatcher"
      byline="Compare greedy, optimal matching, and capacity-aware flow before choosing how teams should respond to pending incidents."
    >
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-6 items-start">
        {/* Left: Incidents Queue */}
        <div className="rise-1 space-y-3 max-h-[600px] overflow-y-auto">
          <h3 className="eyebrow">Pending Incidents</h3>
          {incidents.length === 0 ? (
            <div className="text-sm text-ink/60 italic">No pending incidents</div>
          ) : (
            incidents.map((inc) => {
              const sevBand = SEVERITY_BAND(inc.severity);
              const area = areas.find((a) => a.id === inc.area_id);
              return (
                <Card key={inc.id} className="p-3">
                  <div className="space-y-1">
                    <Badge tone="ruby" className={sevBand.cls}>
                      {sevBand.label}
                    </Badge>
                    <div className="text-xs font-medium text-ink">{CATEGORY_LABEL[inc.category]}</div>
                    <div className="text-xs text-ink/70">{area?.name}</div>
                    <div className="text-[0.65rem] text-ink/50">{new Date(inc.created_at * 1000).toLocaleTimeString()}</div>
                    {inc.description && (
                      <div className="text-xs text-ink/60 pt-1 border-t border-mist">{inc.description}</div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Center: Map */}
        <div className="rise-2">
          <MapCanvas
            areas={areas}
            edges={edges}
            overlays={dispatchOverlays}
            markers={markers}
            height={600}
          />
        </div>

        {/* Right: Controls & Results */}
        <div className="rise-3 space-y-4">
          <div className="space-y-2">
            <Button
              onClick={() => handleDispatch('greedy')}
              variant="primary"
              size="lg"
              className="w-full"
              disabled={runDispatchMutation.isPending}
            >
              Dispatch: Greedy
            </Button>
            <Button
              onClick={() => handleDispatch('hungarian')}
              variant="primary"
              size="lg"
              className="w-full"
              disabled={runDispatchMutation.isPending}
            >
              Dispatch: Hungarian
            </Button>
            <Button
              onClick={() => handleDispatch('mcmf')}
              variant="primary"
              size="lg"
              className="w-full"
              disabled={runDispatchMutation.isPending}
            >
              Dispatch: MCMF
            </Button>
          </div>

          {currentPlan && (
            <Card>
              <CardHeader title={currentPlan.strategy} />
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-ink/60 uppercase tracking-wider">Total Cost</div>
                  <div className="numeral text-3xl text-ink mt-1">{currentPlan.total_cost}</div>
                </div>
                <div className="text-xs text-ink/60">
                  Elapsed: {currentPlan.elapsed_us} us
                </div>
                {currentPlan.committed && (
                  <Badge tone="moss" className="w-full justify-center">
                    Incidents moved to Assigned
                  </Badge>
                )}
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {currentPlan.pairs.map((pair, idx) => (
                    <div key={idx} className="text-xs p-2 bg-parchment rounded">
                      <div>Inc #{pair.incident_id} to Team #{pair.team_id}</div>
                      <div className="text-ink/60">Cost: {pair.cost}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          <Button
            onClick={handleCompare}
            variant="outline"
            size="md"
            className="w-full"
            disabled={compareDispatchMutation.isPending}
          >
            Preview All Three
          </Button>
        </div>
      </div>

      {/* Comparison Results */}
      {comparePlans && (
        <div className="rise-4 mt-8 space-y-4">
          <h3 className="eyebrow">Strategy Comparison</h3>
          <p className="text-sm text-ink/65">
            Preview only. Choose a strategy below to commit assignments and move incidents out of Pending.
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

      {(runDispatchMutation.isError || compareDispatchMutation.isError) && (
        <ErrorState message="Dispatch calculation failed" />
      )}
    </PageWrapper>
  );
}
