import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { axios } from '../../lib/axios';
import { LiveDot } from '../ui/LiveDot';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch critical incidents count
  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await axios.get('/api/incidents');
      return res.data;
    },
    refetchInterval: 5000,
  });

  const criticalCount = incidents.filter(
    (i: any) => i.status === 0 && i.severity >= 9
  ).length;

  const navItems = [
    { path: '/app/dashboard', label: 'Dashboard', icon: '⌗' },
    { path: '/app/report', label: 'Report', icon: '✎' },
    { path: '/app/operations', label: 'Operations', icon: '◆' },
    { path: '/app/active', label: 'Active', icon: '☰' },
    { path: '/app/analytics', label: 'Analytics', icon: '∿' },
    { path: '/app/planner', label: 'Resilience', icon: '◇' },
  ];

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      {/* Top Status Bar */}
      <div className="bg-paper border-b border-ink/15 px-6 py-2 text-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-moss/20 text-moss font-mono font-semibold">
            OPERATIONAL
          </div>
          <span className="text-ink/60 font-mono">{formatTime(currentTime)}</span>
          <span className="text-ink/60">v1.0 · Pune Operations Bureau</span>
        </div>
        <div>
          {criticalCount > 0 ? (
            <LiveDot status="alarm" label={`${criticalCount} critical pending`} />
          ) : (
            <LiveDot status="ok" label="All stable" />
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 border-r border-ink/15 bg-paper/50 overflow-y-auto hidden lg:flex flex-col">
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors',
                    'border-l-4',
                    isActive
                      ? 'border-ruby text-ink bg-mist/30'
                      : 'border-transparent text-ink/60 hover:text-ink',
                  ].join(' ')
                }
              >
                <span className="font-mono text-base w-4">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Mode Switcher */}
          <div className="border-t border-ink/15 p-4">
            <a
              href="/lab"
              className="text-xs text-brass hover:text-brass/80 transition-colors font-medium flex items-center gap-1"
            >
              Switch to Laboratory →
            </a>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
