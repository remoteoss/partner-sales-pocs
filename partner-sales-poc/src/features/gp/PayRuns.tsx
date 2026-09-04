import { ExternalLink, ShieldCheck, ArrowRight } from 'lucide-react';
import { useMagicLink } from '../company/hooks';

// The magic-link "walk" phase of the HiBob demo. Sensitive actions (approving
// and running payroll) intentionally live in Remote's own authenticated surface
// behind step-up 2FA — HiBob stays the control tower. This screen is the
// deliberate handoff: a 1-click magic-link into Remote's pay-runs dashboard.
//
// Auth: we use the .env customer token (refresh-token flow → the demo company),
// NOT the stale session, so this works standalone in the HiBob profile.
const PAYROLL_RUNS_PATH = '/dashboard/payroll';
const USER_ID = import.meta.env.VITE_USER_ID as string;

const primaryBtn =
  'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50';

// Static "control tower" rows — HiBob shows the state; the sensitive action
// (open/approve) hands off to Remote. These are illustrative, not live.
const RECENT_RUNS = [
  { period: 'June 2026', country: 'Germany', employees: 4, status: 'Awaiting approval', due: 'Jun 28' },
  { period: 'June 2026', country: 'United States', employees: 7, status: 'Awaiting approval', due: 'Jun 28' },
  { period: 'May 2026', country: 'Germany', employees: 4, status: 'Paid', due: 'May 28' },
];

export function PayRuns() {
  const { mutate, isPending, error } = useMagicLink();

  const openInRemote = () => {
    mutate(
      { userId: USER_ID, path: PAYROLL_RUNS_PATH, useSessionToken: false },
      {
        onSuccess: (d: { data?: { url?: string }; url?: string }) => {
          const url = d?.data?.url || d?.url;
          if (url) window.open(url, '_blank');
          else console.error('PayRuns: no URL in magic-link response', d);
        },
      },
    );
  };

  return (
    <div className="max-w-4xl">
      {/* Handoff explainer — mirrors the demo's "security is a feature" beat */}
      <div className="mb-6 rounded-xl border border-border bg-background p-5 flex items-start gap-4">
        <div className="h-10 w-10 shrink-0 rounded-lg bg-[var(--color-tertiary)] flex items-center justify-center text-[var(--color-primary)]">
          <ShieldCheck size={20} />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-foreground">Approve and run payroll in Remote</h2>
          <p className="text-sm text-secondary mt-1 max-w-2xl">
            You review pay runs here in HiBob. Approving a run and releasing payment are the highest-risk
            actions, so they happen in Remote's own secure surface with step-up verification. One click takes
            you straight there, no separate login.
          </p>
          <button className={`${primaryBtn} mt-4`} onClick={openInRemote} disabled={isPending}>
            {isPending ? 'Opening Remote…' : 'Open pay runs in Remote'}
            {!isPending && <ExternalLink size={15} />}
          </button>
          {error && (
            <p className="text-xs text-error mt-2">
              Couldn't open Remote: {(error as Error).message}. The demo session may need a Reset.
            </p>
          )}
        </div>
      </div>

      {/* Control-tower view: state lives in HiBob, the action hands off to Remote */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Recent pay runs</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-secondary border-b border-border">
              <th className="px-5 py-2.5 font-medium">Period</th>
              <th className="px-5 py-2.5 font-medium">Country</th>
              <th className="px-5 py-2.5 font-medium">Employees</th>
              <th className="px-5 py-2.5 font-medium">Status</th>
              <th className="px-5 py-2.5 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {RECENT_RUNS.map((run, i) => {
              const isPaid = run.status === 'Paid';
              return (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-foreground">{run.period}</td>
                  <td className="px-5 py-3 text-secondary">{run.country}</td>
                  <td className="px-5 py-3 text-secondary">{run.employees}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        isPaid
                          ? 'bg-surface text-secondary'
                          : 'bg-[var(--color-tertiary)] text-[var(--color-primary)]'
                      }`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={openInRemote}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline disabled:opacity-50"
                    >
                      {isPaid ? 'View in Remote' : 'Review in Remote'}
                      <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-secondary mt-3">
        Pay-run data is illustrative in this demo. The button performs a real magic-link handoff into Remote.
      </p>
    </div>
  );
}
