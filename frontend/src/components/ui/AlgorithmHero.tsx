interface AlgorithmHeroProps {
  unit: string;
  name: string;
  complexity: string;
  byline: string;
}

export function AlgorithmHero({ unit, name, complexity, byline }: AlgorithmHeroProps) {
  return (
    <header className="mb-8 rise-1">
      <div className="eyebrow">{unit}</div>
      <h1 className="display text-4xl md:text-5xl text-ink leading-[1.05] mt-1">{name}</h1>
      <p className="mt-3 text-sm text-ink/70 max-w-2xl font-body italic">{byline}</p>
      <div className="mt-4 flex items-center gap-4">
        <div className="font-mono text-sm font-medium text-brass">{complexity}</div>
        <div className="h-px flex-1 bg-brass/40" />
      </div>
      <div className="hairline-brass mt-4" />
    </header>
  );
}
