import { useState } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner, ErrorState } from '@/components/ui/Spinner';
import { useAreas } from '@/features/graph/hooks';
import { useCreateIncident } from '@/features/incidents/hooks';
import { SEVERITY_BAND, CATEGORY_LABEL } from '@/lib/constants';

const CATEGORIES = [
  { id: 0, label: 'Medical' },
  { id: 1, label: 'Fire' },
  { id: 2, label: 'Police' },
  { id: 3, label: 'Disaster' },
  { id: 4, label: 'Hazmat' },
];

export function Reporter() {
  const { data: areas = [] } = useAreas();
  const createIncidentMutation = useCreateIncident();

  const [areaId, setAreaId] = useState<number>(0);
  const [category, setCategory] = useState<number>(0);
  const [severity, setSeverity] = useState<number>(5);
  const [reporter, setReporter] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [successId, setSuccessId] = useState<number | null>(null);

  const sevBand = SEVERITY_BAND(severity);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          // Reset form
          setAreaId(areas[0]?.id || 0);
          setCategory(0);
          setSeverity(5);
          setReporter('');
          setDescription('');
        },
      }
    );
  };

  if (successId !== null) {
    const areaName = areas.find((a) => a.id === areaId)?.name || 'Unknown Area';
    return (
      <PageWrapper eyebrow="Public Services · Incident Reporting" title="File Incident Report">
        <div className="max-w-2xl mx-auto">
          <div className="bg-moss/5 border border-moss p-8 rounded text-center space-y-4">
            <div className="numeral text-5xl text-moss">✓</div>
            <h2 className="display text-2xl text-ink">Filed as Incident #{successId}</h2>
            <p className="text-ink/70">in {areaName}</p>
            <Button
              onClick={() => setSuccessId(null)}
              variant="moss"
              size="lg"
              className="mt-4"
            >
              File Another
            </Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!areas.length) {
    return (
      <PageWrapper eyebrow="Public Services · Incident Reporting" title="File Incident Report">
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      eyebrow="Public Services · Incident Reporting"
      title="File Incident Report"
      byline="Submit an incident to the emergency response system. All fields are reviewed by trained operators."
    >
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        {/* Area */}
        <div className="rise-1">
          <label className="eyebrow block mb-2">Incident Area</label>
          <select
            value={areaId}
            onChange={(e) => setAreaId(Number(e.target.value))}
            className="w-full border border-mist px-4 py-3 text-base bg-paper text-ink rounded"
            required
          >
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div className="rise-2">
          <label className="eyebrow block mb-3">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  category === cat.id
                    ? 'bg-ink text-paper'
                    : 'bg-mist text-ink hover:bg-mist/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div className="rise-3">
          <label className="eyebrow block mb-2">Severity: {severity}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex items-center gap-2 mt-2">
            <Badge tone={
              sevBand.label === 'critical' ? 'ruby' :
              sevBand.label === 'severe' ? 'ruby' :
              sevBand.label === 'elevated' ? 'brass' : 'moss'
            }>
              {sevBand.label}
            </Badge>
            <span className="text-xs text-ink/60">{severity}/10</span>
          </div>
        </div>

        {/* Reporter */}
        <div className="rise-4">
          <label className="eyebrow block mb-2">Your Name (optional)</label>
          <input
            type="text"
            value={reporter}
            onChange={(e) => setReporter(e.target.value)}
            placeholder="Anonymous"
            className="w-full border border-mist px-4 py-3 text-base bg-paper text-ink rounded"
          />
        </div>

        {/* Description */}
        <div className="rise-5">
          <label className="eyebrow block mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe the incident in detail..."
            className="w-full border border-mist px-4 py-3 text-base bg-paper text-ink rounded font-body"
          />
        </div>

        {/* Submit */}
        <div className="rise-6 flex justify-center">
          <Button
            type="submit"
            variant="ruby"
            size="lg"
            disabled={createIncidentMutation.isPending}
            className="px-8"
          >
            {createIncidentMutation.isPending ? 'Filing...' : 'File Incident Report'}
          </Button>
        </div>

        {createIncidentMutation.isError && (
          <ErrorState message="Failed to file incident report" />
        )}
      </form>
    </PageWrapper>
  );
}
