interface LiveDotProps {
  status: 'alarm' | 'ok' | 'warning';
  label?: string;
}

export function LiveDot({ status, label }: LiveDotProps) {
  const colorMap: Record<string, string> = {
    alarm: 'bg-ruby',
    ok: 'bg-moss',
    warning: 'bg-brass',
  };

  return (
    <div className="inline-flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colorMap[status]} animate-pulse`} />
      {label && <span className="text-xs text-ink/70">{label}</span>}
    </div>
  );
}
