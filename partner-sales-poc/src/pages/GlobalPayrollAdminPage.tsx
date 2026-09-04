import { AdminOnboarding } from '../features/gp/AdminOnboarding';

// GP admin (employer) view — "Global Payroll" area inside HiBob.
export function GlobalPayrollAdminPage() {
  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Global Payroll</h1>
          <span className="inline-flex items-center rounded-full bg-tertiary px-2.5 py-0.5 text-xs font-semibold text-primary">
            Powered by Remote
          </span>
        </div>
        <p className="text-sm text-secondary mt-1">
          Run payroll for your global team, inside HiBob.
        </p>
      </div>
      <AdminOnboarding />
    </div>
  );
}
