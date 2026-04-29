interface Step {
  title: string;
  body: string;
}

interface StepListProps {
  steps: Step[];
}

export function StepList({ steps }: StepListProps) {
  return (
    <div className="space-y-0 my-6">
      {steps.map((step, i) => (
        <div key={i}>
          <div className="flex gap-4 py-4">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-brass text-paper font-mono text-xs flex items-center justify-center font-semibold">
                {i + 1}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-ink">{step.title}</h4>
              <p className="text-sm text-ink/70 mt-1">{step.body}</p>
            </div>
          </div>
          {i < steps.length - 1 && <div className="h-px bg-ink/10 ml-2" />}
        </div>
      ))}
    </div>
  );
}
