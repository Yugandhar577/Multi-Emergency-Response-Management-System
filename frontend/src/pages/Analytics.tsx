import { useMemo } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatNumeral } from '@/components/ui/StatNumeral';
import { Spinner } from '@/components/ui/Spinner';
import { useIncidents } from '@/features/incidents/hooks';
import { useTeams } from '@/features/teams/hooks';
import { useAreas } from '@/features/graph/hooks';
import { SEVERITY_BAND } from '@/lib/constants';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function Analytics() {
  const { data: incidents = [] } = useIncidents();
  const { data: teams = [] } = useTeams();
  const { data: areas = [] } = useAreas();

  // Compute stats
  const stats = useMemo(() => {
    const total = incidents.length;
    const pending = incidents.filter((i) => i.status === 0).length;
    const handled = incidents.filter((i) => i.status === 2).length;
    const maxSevPending = incidents
      .filter((i) => i.status === 0)
      .reduce((max, i) => Math.max(max, i.severity), 0);

    return { total, pending, handled, maxSevPending };
  }, [incidents]);

  // Incidents per area (top 10)
  const areaData = useMemo(() => {
    const counts: Record<number, number> = {};
    incidents.forEach((i) => {
      counts[i.area_id] = (counts[i.area_id] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([areaId, count]) => ({
        name: areas.find((a) => a.id === Number(areaId))?.name || `Area ${areaId}`,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [incidents, areas]);

  // Severity distribution
  const severityData = useMemo(() => {
    const critical = incidents.filter((i) => i.severity >= 9).length;
    const severe = incidents.filter((i) => i.severity >= 7 && i.severity < 9).length;
    const elevated = incidents.filter((i) => i.severity >= 5 && i.severity < 7).length;
    const routine = incidents.filter((i) => i.severity < 5).length;

    return [
      { name: 'Critical', value: critical, color: '#8f3528' },
      { name: 'Severe', value: severe, color: '#8f3528' },
      { name: 'Elevated', value: elevated, color: '#b88b3b' },
      { name: 'Routine', value: routine, color: '#35544d' },
    ];
  }, [incidents]);

  // Team utilization
  const teamData = useMemo(() => {
    return teams
      .map((t) => ({
        name: t.name,
        handled: t.handled_count,
      }))
      .sort((a, b) => b.handled - a.handled);
  }, [teams]);

  if (!incidents.length || !teams.length) {
    return (
      <PageWrapper eyebrow="Operations · Insights" title="Analytics Dashboard">
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      eyebrow="Operations · Insights"
      title="Analytics Dashboard"
      byline="Real-time operational metrics and performance analysis across all incident types and response teams."
    >
      <div className="space-y-8">
        {/* Stat Strip */}
        <div className="rise-1 grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatNumeral eyebrow="Total Incidents" value={stats.total} tone="ink" />
          <StatNumeral eyebrow="Pending" value={stats.pending} tone="ruby" />
          <StatNumeral eyebrow="Handled" value={stats.handled} tone="moss" />
          <StatNumeral
            eyebrow="Max Severity"
            value={stats.maxSevPending}
            tone="brass"
          />
        </div>

        {/* Two-column layout */}
        <div className="rise-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incidents per Area */}
          <Card>
            <CardHeader title="Incidents per Area" />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={areaData}>
                <CartesianGrid strokeDasharray="3,3" stroke="rgb(217 208 196)" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#b88b3b" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Severity Distribution */}
          <Card>
            <CardHeader title="Severity Distribution" />
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Team Utilization */}
        <div className="rise-3">
          <Card>
            <CardHeader title="Team Utilization" />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamData}>
                <CartesianGrid strokeDasharray="3,3" stroke="rgb(217 208 196)" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="handled" fill="#35544d" name="Handled Incidents" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
