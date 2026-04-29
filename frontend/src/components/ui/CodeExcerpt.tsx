interface CodeExcerptProps {
  filename: string;
  language?: string;
  code: string;
}

export function CodeExcerpt({ filename, language = 'cpp', code }: CodeExcerptProps) {
  return (
    <div className="border border-ink/10 rounded-sm overflow-hidden bg-paper mt-6">
      <div className="bg-mist px-4 py-2 border-b border-ink/10">
        <div className="text-xs text-ink/70 font-mono">{filename}</div>
      </div>
      <pre className="overflow-x-auto p-4">
        <code className={`text-xs font-mono text-ink language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}
