import { useQuery } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Pillar } from '../components/ui/Pillar';
import { axios } from '../lib/axios';

export function Landing() {
  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await axios.get('/api/incidents');
      return res.data;
    },
  });

  const activeCount = incidents.filter((i: any) => i.status !== 2).length;
  const pendingCount = incidents.filter((i: any) => i.status === 0).length;
  const handledCount = incidents.filter((i: any) => i.status === 2).length;
  const avgResponseTime = (
    incidents.reduce((sum: number, i: any) => sum + (i.eta_units || 0), 0) / Math.max(1, incidents.length)
  ).toFixed(1);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Header */}
      <div className="border-b border-brass/40 bg-paper">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="eyebrow">Pune Emergency Operations Bureau · Edition 26</div>
          <div className="flex items-end justify-between mt-4">
            <div>
              <h1 className="display text-5xl md:text-6xl text-ink leading-none">
                Two systems.
                <br />
                One bureau.
              </h1>
              <p className="text-sm text-ink/70 italic mt-4 max-w-xl">
                An operational emergency-management console, paired with a laboratory of the algorithms that run inside it.
              </p>
            </div>
            <div className="text-right text-xs text-ink/60 font-mono hidden md:block">
              {today}
            </div>
          </div>
        </div>
        <div className="h-px bg-brass/60" />
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-[1400px] mx-auto px-6 py-12 w-full">
        {/* Two Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Operations Pillar */}
          <Pillar
            tone="ruby"
            eyebrow="Operational · Live System"
            title="Operations Center"
          >
            <div>File incidents, dispatch teams, monitor active response, analyze historical performance, and plan infrastructure resilience.</div>
            <div className="grid grid-cols-2 gap-3 text-xs mt-4 pt-4 border-t border-ink/10">
              <div>
                <div className="font-mono font-semibold text-lg text-ink">{activeCount}</div>
                <div className="text-ink/60">Active incidents</div>
              </div>
              <div>
                <div className="font-mono font-semibold text-lg text-ink">{pendingCount}</div>
                <div className="text-ink/60">Pending</div>
              </div>
              <div>
                <div className="font-mono font-semibold text-lg text-ink">{handledCount}</div>
                <div className="text-ink/60">Handled today</div>
              </div>
              <div>
                <div className="font-mono font-semibold text-lg text-ink">{avgResponseTime}m</div>
                <div className="text-ink/60">Avg response</div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-ink/10">
              <Button
                variant="ruby"
                size="lg"
                onClick={() => (window.location.href = '/app/dashboard')}
                className="w-full justify-center"
              >
                Enter Operations →
              </Button>
            </div>
          </Pillar>

          {/* Laboratory Pillar */}
          <Pillar
            tone="moss"
            eyebrow="Pedagogical · 10+ Algorithms"
            title="Algorithm Laboratory"
          >
            <div>Inspect every algorithm running inside the bureau — routing, spanning trees, critical-infrastructure detection, optimal team assignment, priority queues. With proofs, complexity bounds, and live visualization on real city data.</div>
            <div className="grid grid-cols-2 gap-3 text-xs mt-4 pt-4 border-t border-ink/10">
              <div>
                <div className="font-mono font-semibold text-lg text-ink">60</div>
                <div className="text-ink/60">Graph nodes</div>
              </div>
              <div>
                <div className="font-mono font-semibold text-lg text-ink">156</div>
                <div className="text-ink/60">Edges</div>
              </div>
              <div>
                <div className="font-mono font-semibold text-lg text-ink">5</div>
                <div className="text-ink/60">Teams</div>
              </div>
              <div>
                <div className="font-mono font-semibold text-lg text-ink">10+</div>
                <div className="text-ink/60">Algorithms</div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-ink/10">
              <Button
                variant="moss"
                size="lg"
                onClick={() => (window.location.href = '/lab')}
                className="w-full justify-center"
              >
                Enter Laboratory →
              </Button>
            </div>
          </Pillar>
        </div>

        {/* System Stats Footer */}
        <div className="border-t border-brass/40 pt-8">
          <div className="text-xs text-ink/60 font-mono text-center">
            Pune Emergency Response v1.0 · System Operational · Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-ink/15 bg-paper/50 px-6 py-4 text-center text-xs text-ink/60">
        <div className="h-px bg-brass/60 mb-4" />
        Editorial design. Algorithms. Responsibility.
      </div>
    </div>
  );
}
