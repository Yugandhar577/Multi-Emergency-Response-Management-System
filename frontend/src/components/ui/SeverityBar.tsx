import { SEVERITY_BAND } from '../../lib/constants';

interface SeverityBarProps {
  severity: number; // 1-10
}

export function SeverityBar({ severity }: SeverityBarProps) {
  const clamped = Math.max(1, Math.min(10, severity));
  const { cls } = SEVERITY_BAND(clamped);

  return (
    <div className="flex gap-0.5 items-center">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className={`h-3 flex-1 rounded-none transition-colors ${i < clamped ? cls : 'bg-mist'}`}
        />
      ))}
    </div>
  );
}
