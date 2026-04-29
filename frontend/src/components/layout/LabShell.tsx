import { NavLink, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface LabShellProps {
  children: React.ReactNode;
  showLabNav?: boolean;
}

const labNavItems = [
  { path: '/lab/routing', label: 'Routing' },
  { path: '/lab/mst', label: 'MST' },
  { path: '/lab/critical', label: 'Critical' },
  { path: '/lab/assignment', label: 'Assignment' },
  { path: '/lab/heap', label: 'Heap' },
];

export function LabShell({ children, showLabNav = true }: LabShellProps) {
  const location = useLocation();
  const isLabAlgo = location.pathname.startsWith('/lab/');

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <Navbar />

      {/* Lab Navigation (if inside a lab page) */}
      {showLabNav && isLabAlgo && (
        <div className="border-b border-brass/40 bg-paper/50 px-6 py-3 sticky top-0 z-20">
          <div className="max-w-[1400px] mx-auto">
            <div className="text-xs text-brass font-medium mb-2">ALGORITHM LABS</div>
            <div className="flex gap-3 flex-wrap">
              {labNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    [
                      'text-sm transition-colors pb-1',
                      isActive
                        ? 'text-ink border-b-2 border-ruby'
                        : 'text-ink/60 hover:text-ink',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-6 py-8 relative">
          {/* Mode Switcher (top right) */}
          <div className="absolute top-8 right-6">
            <a
              href="/app/dashboard"
              className="text-xs text-brass hover:text-brass/80 transition-colors font-medium"
            >
              Switch to Operations →
            </a>
          </div>

          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
