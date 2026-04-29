import { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { useAreas } from '../features/graph/hooks';
import { useCreateIncident } from '../features/incidents/hooks';
import { SEVERITY_BAND, CATEGORY_LABEL } from '../lib/constants';

const CATEGORIES = [
  { id: 0, label: 'Medical' },
  { id: 1, label: 'Fire' },
  { id: 2, label: 'Police' },
  { id: 3, label: 'Disaster' },
  { id: 4, label: 'Hazmat' },
];

const SEVERITY_DESCRIPTIONS: Record<number, string> = {
  1: 'Routine - non-life-threatening, can wait for response',
  2: 'Routine - non-life-threatening, can wait for response',
  3: 'Routine - non-life-threatening, can wait for response',
  4: 'Routine - non-life-threatening, can wait for response',
  5: 'Elevated - needs attention within the hour',
  6: 'Elevated - needs attention within the hour',
  7: 'Severe - significant risk to people or property',
  8: 'Severe - significant risk to people or property',
  9: 'Critical - immediate threat to life or safety',
  10: 'Critical - immediate threat to life or safety',
};

export function Reporter() {
  const { data: areas = [] } = useAreas();
  const createIncidentMutation = useCreateIncident();

  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [areaId, setAreaId] = useState<number>(areas[0]?.id || 0);
  const [category, setCategory] = useState<number>(0);
  const [severity, setSeverity] = useState<number>(5);
  const [reporter, setReporter] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [successId, setSuccessId] = useState<number | null>(null);

  const sevBand = SEVERITY_BAND(severity);
  const areaName = useMemo(
    () => areas.find((a) => a.id === areaId)?.name || 'Unknown Area',
    [areaId, areas]
  );

  const handleSubmit = async () => {
    createIncidentMutation.mutate(
      {
        area_id: areaId,
        category,
        severity,
        reporter: reporter || 'Anonymous',
        description,
      },
      {
        onSuccess: (data) => {
          setSuccessId(data.id);
        },
      }
    );
  };

  const handleReset = () => {
    setStep(0);
    setAreaId(areas[0]?.id || 0);
    setCategory(0);
    setSeverity(5);
    setReporter('');
    setDescription('');
    setSuccessId(null);
  };

  if (!areas.length) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center text-ink/60">Loading areas...</div>
      </div>
    );
  }

  if (successId !== null) {
    const filedTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="border-4 border-moss/40 rounded-sm p-12 bg-moss/5">
          <div className="display text-5xl text-moss mb-4">OK</div>
          <h2 className="display text-3xl text-ink mb-2">Incident #{successId} Filed</h2>
          <p className="text-sm text-ink/70 mb-6">
            Filed at {filedTime} in <strong>{areaName}</strong>
          </p>
          <p className="text-sm text-ink/60 mb-8">
            Dispatch typically responds within 8-15 minutes
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              variant="moss"
              size="lg"
              onClick={() => (window.location.href = `/app/active?focus=${successId}`)}
            >
              Track this incident
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={handleReset}
            >
              File another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Progress Bar */}
      <div className="flex gap-2 mb-12">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex-1 h-1 transition-colors ${
              i <= step ? 'bg-ruby' : 'bg-mist'
            }`}
          />
        ))}
      </div>

      {/* Step 0: Where */}
      {step === 0 && (
        <div className="rise-1">
          <div className="eyebrow mb-2">Citizen intake / Step 1</div>
          <h2 className="display text-3xl text-ink mb-2">Where is the incident?</h2>
          <p className="text-sm text-ink/70 mb-6">Create the report that starts the dispatch flow.</p>
          <select
            value={areaId}
            onChange={(e) => setAreaId(Number(e.target.value))}
            className="w-full border border-mist px-4 py-3 text-base bg-paper text-ink rounded-sm mb-8"
          >
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <div className="flex gap-4 justify-between">
            <div />
            <Button variant="primary" size="lg" onClick={() => setStep(1)}>
              Next: What happened
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: What */}
      {step === 1 && (
        <div className="rise-1">
          <h2 className="display text-3xl text-ink mb-2">What type of incident?</h2>
          <p className="text-sm text-ink/70 mb-6">Select the primary category</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`border-2 rounded-sm p-4 text-center transition-all ${
                  category === cat.id
                    ? 'border-ruby bg-ruby/10 text-ink'
                    : 'border-ink/10 text-ink/70 hover:border-ink/30'
                }`}
              >
                <div className="font-medium text-sm">{cat.label}</div>
              </button>
            ))}
          </div>
          <div className="flex gap-4 justify-between">
            <Button variant="ghost" size="lg" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button variant="primary" size="lg" onClick={() => setStep(2)}>
              Next: How urgent
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: How urgent */}
      {step === 2 && (
        <div className="rise-1">
          <h2 className="display text-3xl text-ink mb-2">How urgent?</h2>
          <p className="text-sm text-ink/70 mb-6">Rate the severity on a scale of 1–10</p>
          <input
            type="range"
            min="1"
            max="10"
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            className="w-full mb-6"
          />
          <div className="flex items-center justify-between mb-6">
            <span className="font-mono text-2xl font-semibold text-ink">{severity}/10</span>
            <span className={`px-3 py-1 rounded-sm font-medium text-sm ${sevBand.cls}`}>
              {sevBand.label}
            </span>
          </div>
          <div className="border border-brass/30 bg-brass/5 rounded-sm p-4 mb-8">
            <p className="text-sm text-ink">{SEVERITY_DESCRIPTIONS[severity]}</p>
          </div>
          <div className="flex gap-4 justify-between">
            <Button variant="ghost" size="lg" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button variant="primary" size="lg" onClick={() => setStep(3)}>
              Next: Describe
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Describe */}
      {step === 3 && (
        <div className="rise-1">
          <h2 className="display text-3xl text-ink mb-2">Describe the incident</h2>
          <p className="text-sm text-ink/70 mb-6">Provide additional details for responders</p>
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Your name (optional)</label>
              <input
                type="text"
                value={reporter}
                onChange={(e) => setReporter(e.target.value)}
                placeholder="Leave blank to remain anonymous"
                className="w-full border border-mist px-4 py-2 text-sm bg-paper text-ink rounded-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe what you see, any injuries, hazards, etc."
                className="w-full border border-mist px-4 py-2 text-sm bg-paper text-ink rounded-sm font-body"
              />
            </div>
          </div>
          <div className="flex gap-4 justify-between">
            <Button variant="ghost" size="lg" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              variant="ruby"
              size="lg"
              onClick={handleSubmit}
              disabled={createIncidentMutation.isPending}
            >
              {createIncidentMutation.isPending ? 'Filing...' : 'Submit Report'}
            </Button>
          </div>
          {createIncidentMutation.isError && (
            <div className="text-red-600 text-sm mt-4">Failed to file incident. Please try again.</div>
          )}
        </div>
      )}
    </div>
  );
}
