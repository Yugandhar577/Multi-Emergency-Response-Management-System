import { useQuery } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Pillar } from '../components/ui/Pillar';
import { axios } from '../lib/axios';

const demoFlow = [
  ['01', 'Report', 'Citizen intake creates a pending incident.'],
  ['02', 'Dispatch', 'Greedy, Hungarian, and flow strategies are compared.'],
  ['03', 'Track', 'The active board follows the incident lifecycle.'],
  ['04', 'Analyze', 'Resilience tools reveal fragile roads and areas.'],
  ['05', 'Learn', 'The lab explains the algorithms and complexity.'],
];

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
      <div className="border-b border-brass/40 bg-paper">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="eyebrow">Pune Emergency Operations Bureau / Demo Console</div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mt-4">
            <div>
              <h1 className="display text-5xl md:text-6xl text-ink leading-none">
                Emergency response
                <br />
                decision support.
              </h1>
              <p className="text-sm text-ink/70 italic mt-4 max-w-xl">
                File incidents, compare dispatch strategies, track response work, and inspect the graph algorithms behind each decision.
              </p>
            </div>
            <div className="text-left lg:text-right text-xs text-ink/60 font-mono hidden md:block">
              {today}
            </div>
          </div>
        </div>
        <div className="h-px bg-brass/60" />
      </div>

      <div className="flex-1 max-w-[1400px] mx-auto px-6 py-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-10">
          {demoFlow.map(([step, title, body]) => (
            <div key={step} className="border border-ink/10 bg-paper p-4 rounded-sm">
              <div className="font-mono text-xs text-brass mb-2">{step}</div>
              <div className="display text-lg text-ink">{title}</div>
              <p className="text-xs text-ink/65 mt-2 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Pillar tone="ruby" eyebrow="Primary demo path" title="Operations Center">
            <div>
              Start here for the viva. This is the working command-center flow: incident intake, optimized dispatch, response tracking, analytics, and resilience planning.
            </div>
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
                Enter Operations
              </Button>
            </div>
          </Pillar>

          <Pillar tone="moss" eyebrow="Academic proof layer" title="Algorithm Laboratory">
            <div>
              Use this after the operations demo to explain why each algorithm exists: routing, spanning trees, critical-road detection, optimal assignment, and priority queues on a Pune-inspired graph.
            </div>
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
                Open Algorithm Lab
              </Button>
            </div>
          </Pillar>
        </div>

        <div className="border-t border-brass/40 pt-8">
          <div className="text-xs text-ink/60 font-mono text-center">
            Pune Emergency Response v1.0 / System operational / Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="border-t border-ink/15 bg-paper/50 px-6 py-4 text-center text-xs text-ink/60">
        <div className="h-px bg-brass/60 mb-4" />
        Operations first. Algorithms explained. Built for AADSA viva.
      </div>
    </div>
  );
}
