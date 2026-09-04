import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { UserPlus, FileText, Clock, CheckSquare, ExternalLink, Rocket, Building2 } from 'lucide-react';
import { useSession, useOnboardEmployee } from '../features/company/hooks';
import { useDemoActivation } from '../hooks/useDemoActivation';
import { StartNewHireModal } from '../features/new-hire/StartNewHireModal';
import config from '../config/partner';

type Hire = {
  name: string;
  position: string;
  startDate: string;
  location: string;
  status: 'Pending' | 'Onboarding' | 'Active';
};

const RECENT_HIRES: Hire[] = [
  { name: 'Samantha Reyes', position: 'Senior Product Designer', startDate: 'Apr 22, 2026', location: 'Toronto, CA', status: 'Onboarding' },
  { name: 'Daniel Okafor', position: 'Engineering Manager', startDate: 'Apr 28, 2026', location: 'Berlin, DE', status: 'Pending' },
  { name: 'Aiko Tanaka', position: 'Data Scientist', startDate: 'May 04, 2026', location: 'Remote — JP', status: 'Pending' },
  { name: 'Priya Natarajan', position: 'Customer Success Lead', startDate: 'Mar 31, 2026', location: 'Mumbai, IN', status: 'Active' },
];

const TODO_ITEMS = [
  { label: 'Review time-off requests', meta: '4 pending' },
  { label: 'Review your e-statement', meta: 'March 2026' },
  { label: 'Complete your Things To Do tasks', meta: '2 open' },
];

type DemoState = 'discovery' | 'activation' | 'hiring';

function StatusPill({ status }: { status: Hire['status'] }) {
  const styles: Record<Hire['status'], string> = {
    Pending: 'bg-tertiary text-primary border-primary/30',
    Onboarding: 'bg-accent/10 text-accent border-accent/30',
    Active: 'bg-success/10 text-success border-success/30',
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-sm border ${styles[status]}`}>
      {status}
    </span>
  );
}

export function HomePage() {
  const { data: session } = useSession();
  const { isActivated: demoActivated } = useDemoActivation();
  const { onboard, isPending: magicLinkPending, error: magicLinkError } = useOnboardEmployee(session?.user_id);
  const navigate = useNavigate();
  const [showCountryModal, setShowCountryModal] = useState(false);

  const demoState: DemoState = session?.company_id
    ? 'hiring'
    : demoActivated
    ? 'activation'
    : 'discovery';

  const handleStartHire = () => {
    if (demoState === 'hiring') onboard();
    else if (demoState === 'activation') navigate('/create-company');
    else setShowCountryModal(true);
  };

  const handleModalConfirm = () => {
    setShowCountryModal(false);
    navigate('/new-hire');
  };

  const primaryCtaLabel =
    demoState === 'hiring'
      ? magicLinkPending
        ? 'Generating link...'
        : 'Onboard International Employee'
      : 'Start New Hire';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page title */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">HR Dashboard</h1>
            {demoState === 'hiring' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-sm border border-success/30 bg-success/10 text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                Remote EOR · Active
              </span>
            )}
            {demoState === 'activation' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-sm border border-accent/40 bg-accent/10 text-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Remote EOR · Ready to register
              </span>
            )}
          </div>
          <p className="text-sm text-secondary">Manage hiring, onboarding, and team changes</p>
        </div>
        <Button
          variant="accent"
          size="md"
          onClick={handleStartHire}
          disabled={demoState === 'hiring' && magicLinkPending}
        >
          <UserPlus size={14} />
          {primaryCtaLabel}
          {demoState === 'hiring' && !magicLinkPending && <ExternalLink size={12} />}
        </Button>
      </div>

      {magicLinkError && (
        <div className="border-l-4 border-error bg-error/5 px-4 py-2 text-xs text-error rounded-sm">
          Couldn't generate onboarding link — try Reset Demo and create a company again.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {demoState === 'activation' && (
            <Card title="Register with Remote" headerAccent>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-sm bg-accent/10 text-accent">
                  <Rocket size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Register your company to start hiring internationally
                  </p>
                  <p className="text-xs text-secondary mt-1 mb-3 leading-relaxed">
                    {config.company.name} has enabled Remote EOR for your {config.productName} account.
                    Complete your company registration with Remote to start hiring in countries
                    where you don't have a legal presence.
                  </p>
                  <Button variant="accent" size="md" onClick={handleStartHire}>
                    <Building2 size={14} /> Register your company
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Card title="Start Employee Onboarding" headerAccent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleStartHire}
                disabled={demoState === 'hiring' && magicLinkPending}
                className="group flex items-start gap-3 p-4 border border-border rounded-sm hover:border-primary hover:bg-tertiary transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="p-2 rounded-sm bg-primary/10 text-primary">
                  <UserPlus size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Hire and Onboard Employees</p>
                  <p className="text-xs text-secondary mt-1">
                    {demoState === 'hiring'
                      ? 'Send a magic link to start onboarding in Remote.'
                      : demoState === 'activation'
                      ? 'Register your company with Remote to start hiring internationally.'
                      : 'Start a new hire — domestic or international.'}
                  </p>
                </div>
              </button>

              <div className="flex items-start gap-3 p-4 border border-border rounded-sm opacity-70">
                <div className="p-2 rounded-sm bg-secondary/10 text-secondary">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Create Services &amp; Contractors</p>
                  <p className="text-xs text-secondary mt-1">Add non-employee workers. (Disabled in demo.)</p>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Recent Hires">
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-secondary bg-surface border-y border-border">
                    <th className="px-5 py-2 text-left font-semibold">Name</th>
                    <th className="px-5 py-2 text-left font-semibold">Position</th>
                    <th className="px-5 py-2 text-left font-semibold">Start Date</th>
                    <th className="px-5 py-2 text-left font-semibold">Location</th>
                    <th className="px-5 py-2 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_HIRES.map((h) => (
                    <tr key={h.name} className="border-b border-border hover:bg-surface transition-colors">
                      <td className="px-5 py-3 font-medium text-foreground">{h.name}</td>
                      <td className="px-5 py-3 text-secondary">{h.position}</td>
                      <td className="px-5 py-3 text-secondary">{h.startDate}</td>
                      <td className="px-5 py-3 text-secondary">{h.location}</td>
                      <td className="px-5 py-3"><StatusPill status={h.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Card title="Manager Tool Kit">
            <ul className="divide-y divide-border -my-2">
              {TODO_ITEMS.map((item) => (
                <li key={item.label} className="flex items-center justify-between py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <CheckSquare size={14} className="text-primary" />
                    <span className="text-foreground">{item.label}</span>
                  </div>
                  <span className="text-xs text-secondary">{item.meta}</span>
                </li>
              ))}
            </ul>
          </Card>

          {demoState !== 'activation' && (
            <Card title="Recommended" headerAccent>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-sm bg-accent/10 text-accent">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Hiring internationally?</p>
                  <p className="text-xs text-secondary mt-1 mb-3">
                    Hire internationally without setting up entities. Remote handles payroll,
                    contracts, and compliance in 80+ countries.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartHire}
                    disabled={demoState === 'hiring' && magicLinkPending}
                  >
                    {demoState === 'hiring'
                      ? magicLinkPending
                        ? 'Opening...'
                        : 'Onboard employee'
                      : 'Learn more'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <StartNewHireModal
        open={showCountryModal}
        onCancel={() => setShowCountryModal(false)}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
}
