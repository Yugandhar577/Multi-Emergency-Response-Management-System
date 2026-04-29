interface ComplexityCardProps {
  best: string;
  average: string;
  worst: string;
  space: string;
}

export function ComplexityCard({ best, average, worst, space }: ComplexityCardProps) {
  return (
    <div className="border border-ink/10 rounded-sm p-4 bg-paper">
      <h4 className="font-medium text-sm text-ink mb-3">Complexity</h4>
      <div className="grid grid-cols-4 gap-3">
        <div>
          <div className="text-xs text-ink/60">Best</div>
          <div className="font-mono font-semibold text-sm text-ink">{best}</div>
        </div>
        <div>
          <div className="text-xs text-ink/60">Average</div>
          <div className="font-mono font-semibold text-sm text-ink">{average}</div>
        </div>
        <div>
          <div className="text-xs text-ink/60">Worst</div>
          <div className="font-mono font-semibold text-sm text-ink">{worst}</div>
        </div>
        <div>
          <div className="text-xs text-ink/60">Space</div>
          <div className="font-mono font-semibold text-sm text-ink">{space}</div>
        </div>
      </div>
    </div>
  );
}
