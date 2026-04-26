import { ReactNode } from 'react';

interface PageWrapperProps {
  eyebrow: string;
  title: string;
  byline?: string;
  children: ReactNode;
}

export function PageWrapper({ eyebrow, title, byline, children }: PageWrapperProps) {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <header className="mb-6 rise-1">
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="display text-4xl md:text-5xl text-ink leading-[1.05] mt-1">{title}</h1>
        {byline && (
          <p className="mt-3 text-sm text-ink/70 max-w-2xl font-body italic">
            {byline}
          </p>
        )}
        <div className="hairline-brass mt-4" />
      </header>
      <div className="rise-2">{children}</div>
    </div>
  );
}
