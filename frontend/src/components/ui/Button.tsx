import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'ghost' | 'ruby' | 'moss' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT_CLS: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-ink/90',
  ghost: 'bg-transparent text-ink hover:bg-mist/50',
  ruby: 'bg-ruby text-paper hover:bg-ruby/90',
  moss: 'bg-moss text-paper hover:bg-moss/90',
  outline: 'border border-ink/30 text-ink hover:bg-mist/40',
};

const SIZE_CLS: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', ...rest }, ref) => (
    <button
      ref={ref}
      className={[
        'inline-flex items-center gap-2 font-body font-medium tracking-tight transition-colors',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        VARIANT_CLS[variant],
        SIZE_CLS[size],
        className,
      ].join(' ')}
      {...rest}
    />
  ),
);
Button.displayName = 'Button';
