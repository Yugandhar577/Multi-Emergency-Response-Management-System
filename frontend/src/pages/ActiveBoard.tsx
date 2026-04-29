import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { axios } from '../lib/axios';
import { KanbanColumn } from '../components/ui/KanbanColumn';
import { StatusPill } from '../components/ui/StatusPill';
import { SeverityBar } from '../components/ui/SeverityBar';
import { ActionButton } from '../components/ui/ActionButton';
import { CATEGORY_LABEL, STATUS_LABEL } from '../lib/constants';

export function ActiveBoard() {
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get('focus');
  const focusRef = useRef<HTMLDivElement>(null);

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await axios.get('/api/incidents');
      return res.data;
    },
    refetchInterval: 3000,
  });

  // Group by status
  const columns = [
    {
      status: 0,
      title: 'Pending',
      incidents: incidents.filter((i: any) => i.status === 0),
    },
    {
      status: 1,
      title: 'Assigned',
      incidents: incidents.filter((i: any) => i.status === 1),
    },
    {
      status: 3,
      title: 'En-route',
      incidents: incidents.filter((i: any) => i.status === 3),
    },
    {
      status: 4,
      title: 'On-scene',
      incidents: incidents.filter((i: any) => i.status === 4),
    },
    {
      status: 2,
      title: 'Handled today',
      incidents: incidents.filter(
        (i: any) =>
          i.status === 2 &&
          new Date(i.resolved_at * 1000).toDateString() === new Date().toDateString()
      ),
    },
  ];

  // Scroll focused card into view
  useEffect(() => {
    if (focusId && focusRef.current) {
      focusRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [focusId]);

  const handleStatusUpdate = async (id: number, newStatus: number) => {
    try {
      await axios.post(`/api/incidents/${id}/status`, { status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const IncidentCard = ({ incident }: { incident: any }) => {
    const isFocused = focusId === String(incident.id);
    return (
      <div
        ref={isFocused ? focusRef : null}
        className={`border rounded-sm p-3 bg-paper space-y-2 transition-all ${
          isFocused ? 'border-ruby ring-2 ring-ruby/30' : 'border-ink/10'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <SeverityBar severity={incident.severity} />
          <StatusPill status={incident.status} size="sm" />
        </div>
        <div>
          <div className="text-xs text-brass font-medium">
            {CATEGORY_LABEL[incident.category] || 'Unknown'}
          </div>
          <div className="display text-sm text-ink">Area {incident.area_id}</div>
        </div>
        {incident.reporter && (
          <div className="text-xs text-ink/60">Reporter: {incident.reporter}</div>
        )}
        {incident.description && (
          <div className="text-xs text-ink/70 line-clamp-2">{incident.description}</div>
        )}
        <div className="text-xs text-ink/50 font-mono">
          {((Date.now() - incident.created_at * 1000) / 60000).toFixed(0)}m ago
        </div>

        {/* Status Actions */}
        <div className="border-t border-ink/10 pt-2 flex gap-2 flex-wrap text-xs">
          {incident.status === 0 && (
            <ActionButton
              size="sm"
              variant="ghost"
              onClick={() => handleStatusUpdate(incident.id, 1)}
            >
              Dispatch
            </ActionButton>
          )}
          {incident.status === 1 && (
            <ActionButton
              size="sm"
              variant="primary"
              onClick={() => handleStatusUpdate(incident.id, 3)}
            >
              Mark En-route
            </ActionButton>
          )}
          {incident.status === 3 && (
            <ActionButton
              size="sm"
              variant="primary"
              onClick={() => handleStatusUpdate(incident.id, 4)}
            >
              Mark On-scene
            </ActionButton>
          )}
          {incident.status === 4 && (
            <ActionButton
              size="sm"
              variant="ruby"
              onClick={() => handleStatusUpdate(incident.id, 2)}
            >
              Mark Handled
            </ActionButton>
          )}
          {incident.status === 2 && incident.resolved_at && (
            <span className="text-ink/60">
              Resolved {new Date(incident.resolved_at * 1000).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="eyebrow">Operations · Incident Lifecycle</div>
        <h1 className="display text-3xl text-ink mt-2">Active Incidents</h1>
      </div>

      <div className="grid grid-cols-5 gap-4 h-[calc(100vh-200px)]">
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            title={col.title}
            count={col.incidents.length}
            totalSeverity={col.incidents.reduce((sum: number, i: any) => sum + i.severity, 0)}
          >
            {col.incidents.map((incident: any) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </KanbanColumn>
        ))}
      </div>
    </div>
  );
}
