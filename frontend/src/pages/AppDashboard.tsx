import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { SeverityBar } from '../components/ui/SeverityBar';
import { MapCanvas } from '../components/MapCanvas';
import { axios } from '../lib/axios';
import { CATEGORY_LABEL } from '../lib/constants';

export function AppDashboard() {
  const navigate = useNavigate();

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await axios.get('/api/incidents');
      return res.data;
    },
    refetchInterval: 5000,
  });

  const stats = useMemo(() => {
    const active = incidents.filter((i: any) => i.status !== 2).length;
    const pending = incidents.filter((i: any) => i.status === 0).length;
    const handled = incidents.filter(
      (i: any) =>
        i.status === 2 &&
        new Date(i.resolved_at * 1000).toDateString() === new Date().toDateString()
    ).length;
    const avgResponse = (
      incidents.reduce((sum: number, i: any) => sum + (i.eta_units || 8), 0) / Math.max(1, incidents.length)
    ).toFixed(1);
    return { active, pending, handled, avgResponse };
  }, [incidents]);

  const recentIncidents = incidents.slice(0, 12);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="eyebrow">Operations / Current picture</div>
        <div className="flex items-end justify-between mt-2">
          <h1 className="display text-3xl text-ink">Command Center</h1>
          <div className="text-xs text-ink/60 font-mono">Last updated: {new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Stat Strip */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Incidents', value: stats.active },
          { label: 'Pending Queue', value: stats.pending },
          { label: 'Handled Today', value: stats.handled },
          { label: 'Avg Response (min)', value: stats.avgResponse },
        ].map((stat, i) => (
          <div key={i} className="border border-ink/10 rounded-sm p-4 bg-paper">
            <div className="text-xs text-ink/60 mb-2">{stat.label}</div>
            <div className="font-mono font-semibold text-2xl text-ink">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Two Column Main */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Activity Feed - 60% */}
        <div className="col-span-2">
          <div className="border border-ink/10 rounded-sm p-4">
            <h2 className="font-medium text-sm text-ink mb-4">Recent Activity</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentIncidents.map((incident: any) => (
                <div
                  key={incident.id}
                  className="flex items-center gap-3 p-3 border border-ink/5 rounded-sm hover:bg-mist/20 cursor-pointer transition-colors"
                  onClick={() => navigate(`/app/active?focus=${incident.id}`)}
                >
                  <SeverityBar severity={incident.severity} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink">
                      {CATEGORY_LABEL[incident.category] || 'Unknown'}
                    </div>
                    <div className="text-xs text-ink/60 truncate">Area {incident.area_id}</div>
                  </div>
                  <StatusPill status={incident.status} size="sm" />
                  <div className="text-xs text-ink/50 font-mono whitespace-nowrap">
                    {((Date.now() - incident.created_at * 1000) / 60000).toFixed(0)}m ago
                  </div>
                </div>
              ))}
              {recentIncidents.length === 0 && (
                <div className="text-center py-8 text-ink/60 text-sm">No incidents yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Map Preview - 40% */}
        <div className="border border-ink/10 rounded-sm p-4 h-80">
          <h2 className="font-medium text-sm text-ink mb-3">Area Overview</h2>
          <MapCanvas height={320} />
        </div>
      </div>

      {/* Action Tiles */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'File New Incident', path: '/app/report', icon: '01' },
          { label: 'Compare Dispatch', path: '/app/operations', icon: '02' },
          { label: 'Analyze Resilience', path: '/app/planner', icon: '03' },
        ].map((action, i) => (
          <button
            key={i}
            onClick={() => navigate(action.path)}
            className="border border-ink/10 rounded-sm p-6 text-center hover:bg-mist/30 transition-colors"
          >
            <div className="text-2xl mb-2">{action.icon}</div>
            <div className="text-sm font-medium text-ink">{action.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
