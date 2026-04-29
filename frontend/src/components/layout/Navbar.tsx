import { NavLink } from 'react-router-dom';

const links = [
  { to: '/app/dashboard', eyebrow: '01', label: 'Operations' },
  { to: '/app/report', eyebrow: '02', label: 'Report' },
  { to: '/app/operations', eyebrow: '03', label: 'Dispatch' },
  { to: '/app/planner', eyebrow: '04', label: 'Resilience' },
  { to: '/lab', eyebrow: '05', label: 'Algorithm Lab' },
];

export function Navbar() {
  return (
    <header className="border-b border-ink/15 bg-paper/95 backdrop-blur sticky top-0 z-30">
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-end justify-between gap-6">
        <div>
          <div className="eyebrow">Pune Operations Bureau / Algorithm Proof Layer</div>
          <div className="display text-2xl md:text-3xl tracking-tightest text-ink leading-none">
            Emergency Response Decision Support
          </div>
        </div>
        <nav className="hidden lg:flex items-stretch gap-0">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                [
                  'group px-4 py-2 border-l border-ink/15 last:border-r relative',
                  isActive ? 'text-ink' : 'text-ink/65 hover:text-ink',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <div className="text-[0.6rem] tracking-[0.22em] font-medium text-brass">
                    {l.eyebrow}
                  </div>
                  <div className="display text-base">{l.label}</div>
                  {isActive && (
                    <span className="absolute left-2 right-2 -bottom-[1px] h-[2px] bg-ruby" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="h-px bg-brass/60" />
    </header>
  );
}
