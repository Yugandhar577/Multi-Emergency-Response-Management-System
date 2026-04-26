import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'ink' | 'ruby' | 'moss' | 'brass' | 'mist';
}

const TONE_CLS: Record<NonNullable<BadgeProps['tone']>, string> = {
  ink: 'bg-ink text-paper',
  ruby: 'bg-ruby text-paper',
  moss: 'bg-moss text-paper',
  brass: 'bg-brass text-paper',
  mist: 'bg-mist text-ink',
};

export function Badge({ tone = 'ink', className = '', children, ...rest }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.18em] font-medium',
        TONE_CLS[tone],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </span>
  );
}
