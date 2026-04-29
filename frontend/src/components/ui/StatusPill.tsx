import { STATUS_LABEL } from '../../lib/constants';

interface StatusPillProps {
  status: number;
  size?: 'sm' | 'md';
}

export function StatusPill({ status, size = 'md' }: StatusPillProps) {
  const label = STATUS_LABEL[status] || 'Unknown';

  const colorMap: Record<number, string> = {
    0: 'bg-mist text-ink',         // Pending
    1: 'bg-brass/85 text-paper',   // Assigned
    2: 'bg-moss/85 text-paper',    // Handled
    3: 'bg-brass text-paper',      // En-route
    4: 'bg-ruby/90 text-paper',    // On-scene
  };

  const sizeClass = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <span className={`inline-block rounded-sm font-medium ${colorMap[status] || 'bg-mist text-ink'} ${sizeClass}`}>
      {label}
    </span>
  );
}
