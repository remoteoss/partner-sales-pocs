import { EmployeeOnboarding } from '../features/gp/EmployeeOnboarding';

// GP employee (self-service) view — "Tasks" inside HiBob.
export function GlobalPayrollEmployeePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Your tasks</h1>
        <p className="text-sm text-secondary mt-1">
          A few things to finish setting up your profile.
        </p>
      </div>
      <EmployeeOnboarding />
    </div>
  );
}
