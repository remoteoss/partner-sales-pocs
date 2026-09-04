import { PayRuns } from '../features/gp/PayRuns';

// GP pay-runs (employer) view — the magic-link handoff into Remote's secure
// payroll surface. Sits under "Global Payroll" in the HiBob admin nav.
export function GlobalPayrollPayRunsPage() {
  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Pay runs</h1>
          <span className="inline-flex items-center rounded-full bg-tertiary px-2.5 py-0.5 text-xs font-semibold text-primary">
            Powered by Remote
          </span>
        </div>
        <p className="text-sm text-secondary mt-1">
          Review and approve payroll, inside HiBob.
        </p>
      </div>
      <PayRuns />
    </div>
  );
}
