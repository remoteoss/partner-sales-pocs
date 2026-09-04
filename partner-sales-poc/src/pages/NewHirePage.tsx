import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Check, Shield, TrendingUp, ChevronLeft } from 'lucide-react';
import { useSession } from '../features/company/hooks';
import { useDemoActivation } from '../hooks/useDemoActivation';
import config from '../config/partner';

const REMOTE_BENEFITS = [
  'Remote as a legal employer of record (EOR) for international hires',
  'Handles compliance, contracts, and onboarding in 180+ countries',
  'Embedded payroll in currencies where you hire legal entity-free',
  'Fast ramp — hire in days, not months',
];

type Mode = 'choose' | 'confirmed';

export function NewHirePage() {
  const { data: session } = useSession();
  const { isActivated: demoActivated } = useDemoActivation();
  const [mode, setMode] = useState<Mode>('choose');

  if (session?.company_id || demoActivated) return <Navigate to="/" replace />;

  const handleInterested = () => setMode('confirmed');

  if (mode === 'confirmed') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-secondary hover:text-primary">
          <ChevronLeft size={14} /> Back to Home
        </Link>

        <Card title="Thanks — we'll be in touch" headerAccent>
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center mb-4">
              <Check size={28} className="text-success" strokeWidth={3} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Our sales team is going to contact you!
            </h3>
            <p className="text-sm text-secondary max-w-md">
              A Remote specialist will reach out to discuss pricing, cost estimates,
              and next steps for adding Remote EOR to your {config.productName} account.
            </p>
            <div className="mt-6">
              <Link to="/">
                <Button variant="secondary" size="md">Back to Home</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-secondary hover:text-primary">
        <ChevronLeft size={14} /> Back to Home
      </Link>

      <Card title="International Employee" headerAccent>
        <p className="text-sm text-foreground mb-1 leading-relaxed">
          To hire and manage payroll for international employees, connect{' '}
          <span className="font-semibold">Remote</span> to your {config.productName} account.
        </p>
        <p className="text-sm text-secondary mb-5 leading-relaxed">
          Remote handles compliance, contracts, and onboarding so you can attract and hire
          the right talent globally without setting up entities.
        </p>

        <p className="text-xs uppercase tracking-wider font-semibold text-secondary mb-3">
          This is what you can have:
        </p>

        <div className="grid grid-cols-1 gap-4">
          <ProductTile
            name="EOR"
            tagline="For countries where you don't have an entity"
            icon={<img src="/remote-symbol.svg" alt="Remote" className="w-[18px] h-[18px]" />}
            benefits={REMOTE_BENEFITS}
            accent
          />
        </div>

        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-border">
          <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer">
            <input type="checkbox" className="accent-primary" />
            Don't show me again
          </label>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="secondary" size="md">Close</Button>
            </Link>
            <Button variant="accent" onClick={handleInterested}>
              <TrendingUp size={14} />
              I'm Interested
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-2 text-xs text-secondary pl-1">
        <Shield size={12} />
        Powered by Remote and partners
      </div>
    </div>
  );
}

interface TileProps {
  name: string;
  tagline: string;
  icon: React.ReactNode;
  benefits: string[];
  accent?: boolean;
}

function ProductTile({ name, tagline, icon, benefits, accent = false }: TileProps) {
  return (
    <div
      className={`border rounded-sm p-4 ${
        accent ? 'border-accent/40 bg-accent/5' : 'border-border bg-surface'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`p-1.5 rounded-sm ${
            accent ? 'bg-accent text-white' : 'bg-primary/10 text-primary'
          }`}
        >
          {icon}
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="text-[11px] text-secondary">{tagline}</p>
        </div>
      </div>
      <ul className="mt-2 space-y-1.5">
        {benefits.map((b) => (
          <li key={b} className="flex items-start gap-2 text-xs text-foreground">
            <Check size={12} className={`mt-0.5 shrink-0 ${accent ? 'text-accent' : 'text-primary'}`} />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
