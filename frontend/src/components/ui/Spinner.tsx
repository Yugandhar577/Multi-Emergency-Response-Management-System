export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 14 : size === 'lg' ? 28 : 20;
  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      className="animate-spin text-brass"
      aria-label="loading"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.25" />
      <path d="M21 12 a9 9 0 0 0 -9 -9" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="border border-ruby/40 bg-ruby/5 p-4 font-body text-sm">
      <div className="text-ruby font-medium">Could not load.</div>
      <div className="text-ink/70 mt-1">{message}</div>
      {retry && (
        <button
          onClick={retry}
          className="mt-2 underline text-ink hover:text-ruby font-medium"
        >
          Retry
        </button>
      )}
    </div>
  );
}
