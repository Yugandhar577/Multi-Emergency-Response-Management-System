import { ReactNode } from 'react';

interface KanbanColumnProps {
  title: string;
  count: number;
  totalSeverity?: number;
  children: ReactNode;
}

export function KanbanColumn({ title, count, totalSeverity, children }: KanbanColumnProps) {
  return (
    <div className="flex flex-col h-full bg-paper border border-ink/10 rounded-sm overflow-hidden">
      <div className="sticky top-0 bg-paper/95 border-b border-ink/10 p-3 z-10">
        <h3 className="font-medium text-sm text-ink">{title}</h3>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-mono font-semibold text-lg text-ink">{count}</span>
          {totalSeverity !== undefined && (
            <span className="text-xs text-ink/60">severity {totalSeverity}</span>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">{children}</div>
    </div>
  );
}
