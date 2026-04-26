import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  bleed?: boolean;
}

export function Card({ bleed, className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={[
        'bg-paper border border-mist shadow-editorial',
        bleed ? '' : 'p-5',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title: string;
}

export function CardHeader({ eyebrow, title, className = '', ...rest }: CardHeaderProps) {
  return (
    <div className={['mb-3', className].join(' ')} {...rest}>
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <div className="display text-xl text-ink leading-tight">{title}</div>
      <div className="hairline mt-2 opacity-30" />
    </div>
  );
}
