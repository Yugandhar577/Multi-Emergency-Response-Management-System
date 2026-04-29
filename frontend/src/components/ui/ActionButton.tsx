import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'ruby' | 'moss' | 'outline';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  variant?: Variant;
  size?: 'sm' | 'md';
}

const VARIANT_CLS: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-ink/90',
  ghost: 'bg-transparent text-ink hover:bg-mist/50',
  ruby: 'bg-ruby text-paper hover:bg-ruby/90',
  moss: 'bg-moss text-paper hover:bg-moss/90',
  outline: 'border border-ink/30 text-ink hover:bg-mist/40',
};

const SIZE_CLS: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
};

export function ActionButton({
  icon,
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...rest
}: ActionButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center font-medium tracking-tight transition-colors',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        VARIANT_CLS[variant],
        SIZE_CLS[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
