import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Check, Globe2, Shield, TrendingUp, Users, ChevronLeft } from 'lucide-react';

const REMOTE_BENEFITS = [
  'Remote as a legal employer of record (EOR) for international hires',
  'Handles compliance, contracts, and onboarding in 180+ countries',
  'Embedded payroll in currencies where you hire legal entity-free',
  'Fast ramp — hire in days, not months',
];

const GLOBAL_PAYROLL_BENEFITS = [
  'ADP Global Payroll for countries where you have a legal entity',
  'Consolidated global reporting + multi-currency payroll',
  'Available in 140+ countries via ADP and partners',
  'For customers with existing international presence',
];

type Mode = 'choose' | 'confirmed';

export function NewHirePage() {
  const [mode, setMode] = useState<Mode>('choose');
  const [enabled, setEnabled] = useState(false);
  const navigate = useNavigate();

  const handleInterested = () => setMode('confirmed');

  const handleContinue = () => {
    if (!enabled) return;
    navigate('/create-company');
  };

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
              An ADP Global Payroll specialist will reach out to discuss pricing, cost estimates,
              and next steps for adding Remote EOR to your Workforce Now account.
            </p>
          </div>

          {/* Demo-only toggle */}
          <div className="border-t border-border -mx-5 px-5 pt-4 mt-4">
            <div className="bg-tertiary border border-primary/20 rounded-sm px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Demo mode
                  </p>
                  <p className="text-xs text-secondary mt-1">
                    In production, the sales team provisions access after a cost estimate.
                    For this demo, flip the toggle to enable Remote and jump straight to
                    company registration.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => setEnabled((v) => !v)}
                  className={`relative shrink-0 w-10 h-6 rounded-full transition-colors ${
                    enabled ? 'bg-success' : 'bg-secondary/40'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                variant="accent"
                onClick={handleContinue}
                disabled={!enabled}
              >
                Continue to company setup
              </Button>
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
          If you want to hire and manage payroll for international employees, you need{' '}
          <span className="font-semibold">ADP Global Payroll Solutions</span>.
        </p>
        <p className="text-sm text-secondary mb-5 leading-relaxed">
          You'll get access to our solutions and partner integrations so you can attract
          and hire the right talent with the right technology &amp; tools globally.
        </p>

        <p className="text-xs uppercase tracking-wider font-semibold text-secondary mb-3">
          This is what you can have:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProductTile
            name="Workforce Now + Remote"
            tagline="EOR for countries where you don't have an entity"
            icon={<Globe2 size={18} />}
            benefits={REMOTE_BENEFITS}
            accent
          />
          <ProductTile
            name="Workforce Now + Global Payroll"
            tagline="Native payroll in countries where you do"
            icon={<Users size={18} />}
            benefits={GLOBAL_PAYROLL_BENEFITS}
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
        Powered by ADP Global Payroll Solutions and partners
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
