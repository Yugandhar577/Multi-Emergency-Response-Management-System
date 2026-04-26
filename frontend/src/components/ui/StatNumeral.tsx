interface StatNumeralProps {
  eyebrow: string;
  value: string | number;
  caption?: string;
  tone?: 'ink' | 'ruby' | 'moss' | 'brass';
}

const COLOR: Record<NonNullable<StatNumeralProps['tone']>, string> = {
  ink: 'text-ink',
  ruby: 'text-ruby',
  moss: 'text-moss',
  brass: 'text-brass',
};

export function StatNumeral({ eyebrow, value, caption, tone = 'ink' }: StatNumeralProps) {
  return (
    <div className="border-l border-mist pl-4">
      <div className="eyebrow">{eyebrow}</div>
      <div className={['numeral text-4xl leading-none mt-1', COLOR[tone]].join(' ')}>{value}</div>
      {caption && <div className="text-xs text-ink/60 mt-1 font-body">{caption}</div>}
    </div>
  );
}
