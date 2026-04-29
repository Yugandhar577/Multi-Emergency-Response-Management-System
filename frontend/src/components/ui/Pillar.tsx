import { ReactNode } from 'react';

type Tone = 'ruby' | 'moss';

interface PillarProps {
  tone: Tone;
  eyebrow: string;
  title: string;
  children: ReactNode;
}

const borderMap: Record<Tone, string> = {
  ruby: 'border-l-4 border-ruby',
  moss: 'border-l-4 border-moss',
};

export function Pillar({ tone, eyebrow, title, children }: PillarProps) {
  return (
    <div className={`bg-paper border border-ink/10 p-6 ${borderMap[tone]}`}>
      <div className="eyebrow">{eyebrow}</div>
      <h3 className="display text-2xl text-ink mt-2">{title}</h3>
      <div className="mt-4 text-sm text-ink/70 leading-relaxed space-y-3">{children}</div>
    </div>
  );
}
