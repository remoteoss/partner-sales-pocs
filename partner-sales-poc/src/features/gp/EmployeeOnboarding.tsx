import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PayrollEmployeeOnboardingFlow,
  type PayrollEmployeeOnboardingRenderProps,
  type TaxStepUnavailableReason,
  useEmploymentQuery,
  useGPOnboardingSteps,
} from '@remoteoss/remote-flows';
import { GpRemoteFlows } from './GpRemoteFlows';
import { AlertError, emptyErrors, type FlowErrors } from './AlertError';
import { getGpCountry } from '../../config/gp';
import { readEmployment, clearEmployment, listEmployments } from './employmentHandoff';

const STEP_LABELS: Record<string, string> = {
  personal_details: 'Personal details',
  home_address: 'Home address',
  bank_account: 'Bank account',
  federal_taxes: 'Federal taxes (W-4)',
  state_taxes: 'State taxes',
};

const primaryBtn =
  'rounded-lg px-4 py-2 text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50';
const ghostBtn =
  'rounded-lg px-4 py-2 text-sm font-medium border border-border text-secondary hover:bg-surface';

function toFieldErrors(e: {
  error: Error;
  fieldErrors: { field: string; messages: string[] }[];
}): FlowErrors {
  return {
    apiError: e.error.message,
    fieldErrors: e.fieldErrors.map((fe) => ({ ...fe, userFriendlyLabel: fe.field })),
  };
}

// ── Outer (company-manager) context: read country + jurisdiction + substeps ──
function useEmployeeFlowContext(employmentId: string) {
  const { data: apiSteps, isLoading: loadingSteps } = useGPOnboardingSteps(employmentId);
  const { data: employment, isLoading: loadingEmp } = useEmploymentQuery({ employmentId });

  const selfOnboarding = apiSteps?.find((s: { type: string }) => s.type === 'self_onboarding');
  const substeps = (selfOnboarding?.sub_steps ?? []) as { type: string }[];
  const hasBankAccount = substeps.some(
    (s) => s.type === 'employee_provides_bank_details',
  );
  const countryCode = employment?.country?.code;
  const workState = (employment?.work_address_details as { state?: string } | undefined)?.state;
  const homeState = (employment?.address_details as { state?: string } | undefined)?.state;
  const jurisdiction = workState || homeState;

  return {
    hasBankAccount,
    countryCode,
    jurisdiction,
    isLoading: loadingSteps || loadingEmp,
  };
}

function TaxStepNotAvailable({
  reason,
  jurisdiction,
}: {
  reason: TaxStepUnavailableReason;
  jurisdiction?: string;
}) {
  let message: string;
  if (reason === 'unsupported_country') message = 'Tax steps are only available for USA employments.';
  else if (reason === 'no_jurisdiction') message = 'A US state code is required to submit state taxes.';
  else if (reason === 'schema_unavailable') message = 'No form schema returned for this tax step.';
  else
    message = jurisdiction
      ? `Not active yet. The state-tax task for "${jurisdiction}" is created after activation.`
      : `Not active yet. The federal-tax task is created after activation.`;
  return (
    <div className="rounded-lg bg-surface border border-border p-3 text-sm text-secondary">
      <strong className="text-foreground">Available after activation.</strong> {message}
    </div>
  );
}

// ── Inner (employee-token) context: the actual self-onboarding form ──────────
function EmployeeFlowInner({
  employmentId,
  hasBankAccount,
  countryCode,
  jurisdiction,
  onDone,
}: {
  employmentId: string;
  hasBankAccount: boolean;
  countryCode: string;
  jurisdiction?: string;
  onDone: () => void;
}) {
  const [errors, setErrors] = useState<FlowErrors>(emptyErrors);
  const clear = () => setErrors(emptyErrors);
  const onStepError = (e: {
    error: Error;
    fieldErrors: { field: string; messages: string[] }[];
  }) => setErrors(toFieldErrors(e));

  const isUSA = countryCode === 'USA';
  const visibleSteps = Object.entries(STEP_LABELS).filter(([key]) => {
    if (key === 'bank_account') return hasBankAccount;
    if (key === 'federal_taxes') return isUSA;
    if (key === 'state_taxes') return isUSA && !!jurisdiction;
    return true;
  });
  const lastStepKey = visibleSteps[visibleSteps.length - 1][0];

  return (
    <PayrollEmployeeOnboardingFlow
      employmentId={employmentId}
      countryCode={countryCode}
      jurisdiction={isUSA ? jurisdiction : undefined}
      render={({ employeeBag, components }: PayrollEmployeeOnboardingRenderProps) => {
        const {
          PersonalDetailsStep,
          HomeAddressStep,
          BankAccountStep,
          FederalTaxesStep,
          StateTaxesStep,
          SubmitButton,
          BackButton,
        } = components;
        const current = employeeBag.stepState.currentStep.name;
        const isLast = current === lastStepKey;
        const fed = employeeBag.taxStepsAvailability.federal_taxes;
        const st = employeeBag.taxStepsAvailability.state_taxes;

        if (employeeBag.isLoading && !employeeBag.fields.length) {
          return <p className="text-sm text-secondary">Loading…</p>;
        }

        const backSubmit = (submitLabel: string) => (
          <div className="mt-5 flex justify-between">
            <BackButton className={ghostBtn} onClick={clear}>
              Back
            </BackButton>
            <SubmitButton className={primaryBtn} onClick={clear}>
              {submitLabel}
            </SubmitButton>
          </div>
        );

        return (
          <>
            <ol className="flex flex-wrap gap-4 mb-6">
              {visibleSteps.map(([key, label], i) => (
                <li
                  key={key}
                  className={`flex items-center gap-2 text-xs font-semibold ${
                    key === current ? 'text-foreground' : 'text-secondary'
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-white text-[10px] ${
                      key === current ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-input)]'
                    }`}
                  >
                    {i + 1}
                  </span>
                  {label}
                </li>
              ))}
            </ol>

            <div className="rounded-xl border border-border bg-background p-6">
              {current === 'personal_details' && (
                <>
                  <PersonalDetailsStep onError={onStepError} onSuccess={clear} />
                  <AlertError errors={errors} />
                  {employeeBag.fields.length > 0 && (
                    <div className="mt-5 flex justify-end">
                      <SubmitButton className={primaryBtn} onClick={clear}>
                        Save &amp; continue
                      </SubmitButton>
                    </div>
                  )}
                </>
              )}

              {current === 'home_address' && (
                <>
                  <HomeAddressStep
                    onError={onStepError}
                    onSuccess={() => {
                      clear();
                      if (isLast) onDone();
                    }}
                  />
                  <AlertError errors={errors} />
                  {backSubmit(isLast ? 'Submit' : 'Save & continue')}
                </>
              )}

              {current === 'bank_account' && hasBankAccount && (
                <>
                  <BankAccountStep
                    onError={onStepError}
                    onSuccess={() => {
                      clear();
                      if (isLast) onDone();
                    }}
                  />
                  <AlertError errors={errors} />
                  {backSubmit(isLast ? 'Submit' : 'Save & continue')}
                </>
              )}

              {current === 'federal_taxes' && (
                <>
                  {fed.isAvailable ? (
                    <FederalTaxesStep
                      onError={onStepError}
                      onSuccess={() => {
                        clear();
                        if (isLast) onDone();
                      }}
                    />
                  ) : (
                    <TaxStepNotAvailable reason={fed.unavailableReason!} />
                  )}
                  <AlertError errors={errors} />
                  <div className="mt-5 flex justify-between">
                    <BackButton className={ghostBtn} onClick={clear}>
                      Back
                    </BackButton>
                    {fed.isAvailable ? (
                      <SubmitButton className={primaryBtn} onClick={clear}>
                        {isLast ? 'Submit' : 'Save & continue'}
                      </SubmitButton>
                    ) : (
                      <button className={primaryBtn} onClick={() => employeeBag.next()}>
                        Skip
                      </button>
                    )}
                  </div>
                </>
              )}

              {current === 'state_taxes' && (
                <>
                  {st.isAvailable ? (
                    <StateTaxesStep
                      onError={onStepError}
                      onSuccess={() => {
                        clear();
                        onDone();
                      }}
                    />
                  ) : (
                    <TaxStepNotAvailable
                      reason={st.unavailableReason!}
                      jurisdiction={employeeBag.jurisdiction}
                    />
                  )}
                  <AlertError errors={errors} />
                  <div className="mt-5 flex justify-between">
                    <BackButton className={ghostBtn} onClick={clear}>
                      Back
                    </BackButton>
                    {st.isAvailable ? (
                      <SubmitButton className={primaryBtn} onClick={clear}>
                        Submit
                      </SubmitButton>
                    ) : (
                      <button className={primaryBtn} onClick={onDone}>
                        Finish
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        );
      }}
    />
  );
}

// Outer context loader: reads country/jurisdiction, then hands to employee ctx.
function EmployeeFlowLoader({ employmentId, onDone }: { employmentId: string; onDone: () => void }) {
  const { hasBankAccount, countryCode, jurisdiction, isLoading } =
    useEmployeeFlowContext(employmentId);

  if (isLoading) return <p className="text-sm text-secondary">Loading your onboarding…</p>;
  if (!countryCode) {
    return (
      <div className="rounded-xl border border-border bg-background p-6">
        <p className="text-sm text-secondary">
          Couldn't load onboarding for this employment. It may still be processing the invite, so try again shortly.
        </p>
      </div>
    );
  }

  return (
    <GpRemoteFlows employmentId={employmentId}>
      <EmployeeFlowInner
        employmentId={employmentId}
        hasBankAccount={hasBankAccount}
        countryCode={countryCode}
        jurisdiction={jurisdiction}
        onDone={onDone}
      />
    </GpRemoteFlows>
  );
}

export function EmployeeOnboarding() {
  const hires = listEmployments();
  const latest = readEmployment();
  const [selectedId, setSelectedId] = useState<string | null>(
    latest?.employmentId ?? hires[0]?.employmentId ?? null,
  );
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const selected = hires.find((h) => h.employmentId === selectedId) ?? hires[0] ?? null;

  if (!selected) {
    return (
      <div className="rounded-xl border border-border bg-background p-6 max-w-2xl">
        <h2 className="text-base font-semibold text-foreground mb-1">No pending onboarding</h2>
        <p className="text-sm text-secondary mb-5">
          Once an admin adds you as a new hire, your payroll onboarding task appears here.
        </p>
        <button className={ghostBtn} onClick={() => navigate('/gp/admin')}>
          Go to admin view
        </button>
      </div>
    );
  }

  const countryName = getGpCountry(selected.countryCode)?.name ?? selected.countryCode;

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-background p-6 max-w-2xl">
        <h2 className="text-base font-semibold text-foreground mb-1">Onboarding complete ✓</h2>
        <p className="text-sm text-secondary mb-5">
          Your details are submitted to Remote. Your employer will review and activate your employment.
        </p>
        <button
          className={ghostBtn}
          onClick={() => {
            clearEmployment(selected.employmentId);
            navigate('/gp/admin');
          }}
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* New-hire switcher — pick which invited employee to onboard (DE vs US). */}
      {hires.length > 1 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-medium text-secondary">New hire:</span>
          <div className="flex items-center rounded-full bg-surface border border-border p-0.5 text-xs font-semibold">
            {hires.map((h) => {
              const n = getGpCountry(h.countryCode)?.name ?? h.countryCode;
              const active = h.employmentId === selected.employmentId;
              return (
                <button
                  key={h.employmentId}
                  onClick={() => {
                    setSelectedId(h.employmentId);
                    setDone(false);
                  }}
                  className={`px-3 py-1.5 rounded-full transition-colors ${
                    active ? 'bg-primary text-white' : 'text-secondary hover:text-foreground'
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Task card framing — this is a HiBob "task" that opens the embedded SDK */}
      <div className="mb-5 rounded-xl border border-border bg-background p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-[var(--color-tertiary)] flex items-center justify-center text-[var(--color-primary)] font-bold">
          !
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">
            Complete your payroll onboarding
          </div>
          <div className="text-xs text-secondary">
            {countryName} · a few payroll details Remote needs to pay you
          </div>
        </div>
      </div>

      {/* key forces a clean remount of the flow when switching hires */}
      <GpRemoteFlows key={selected.employmentId}>
        <EmployeeFlowLoader employmentId={selected.employmentId} onDone={() => setDone(true)} />
      </GpRemoteFlows>
    </div>
  );
}
