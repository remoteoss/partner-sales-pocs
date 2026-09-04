import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import {
  PayrollAdminOnboardingFlow,
  type PayrollAdminOnboardingRenderProps,
} from '@remoteoss/remote-flows';
import { GpRemoteFlows } from './GpRemoteFlows';
import { AlertError, emptyErrors, type FlowErrors } from './AlertError';
import {
  COMPANY_ID,
  GP_COUNTRIES,
  getEntityForCountry,
  getGpCountry,
} from '../../config/gp';
import { saveEmployment } from './employmentHandoff';

const STEP_LABELS: Record<string, string> = {
  select_country: 'Employee details',
  contract_details: 'Contract',
  administrative_details: 'Payroll details',
  invite: 'Invite',
};

const primaryBtn =
  'rounded-lg px-4 py-2 text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50';
const ghostBtn =
  'rounded-lg px-4 py-2 text-sm font-medium border border-border text-secondary hover:bg-surface';

type RenderArgs = PayrollAdminOnboardingRenderProps;

function toFieldErrors(
  e: { error: Error; fieldErrors: { field: string; messages: string[] }[] },
): FlowErrors {
  return {
    apiError: e.error.message,
    fieldErrors: e.fieldErrors.map((fe) => ({ ...fe, userFriendlyLabel: fe.field })),
  };
}

function AdminSteps({
  adminBag,
  components,
  countryCode,
  onInvited,
}: {
  adminBag: RenderArgs['adminBag'];
  components: RenderArgs['components'];
  countryCode: string;
  onInvited: (employmentId: string) => void;
}) {
  const {
    SelectCountryStep,
    ContractDetailsStep,
    AdministrativeDetailsStep,
    InvitationStep,
    SubmitButton,
    BackButton,
  } = components;
  const [errors, setErrors] = useState<FlowErrors>(emptyErrors);
  const clear = () => setErrors(emptyErrors);
  const onStepError = (e: {
    error: Error;
    fieldErrors: { field: string; messages: string[] }[];
  }) => setErrors(toFieldErrors(e));

  // Pre-select the country picked on the HiBob screen, so the SDK's create call
  // uses it (and matches the legal entity we mounted with).
  useEffect(() => {
    if (!adminBag.countryCode) adminBag.setInternalCountryCode(countryCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = adminBag.stepState.currentStep.name;
  const stepEntries = Object.entries(STEP_LABELS);
  const countryName = getGpCountry(countryCode)?.name ?? countryCode;

  if (adminBag.isLoading && !adminBag.countryCode) {
    return <p className="text-sm text-secondary">Loading…</p>;
  }

  return (
    <>
      <ol className="flex flex-wrap gap-4 mb-6">
        {stepEntries.map(([key, label], i) => (
          <li
            key={key}
            className={`flex items-center gap-2 text-xs font-semibold ${
              key === current ? 'text-foreground' : 'text-secondary'
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full flex items-center justify-center text-white text-[10px] ${
                key === current
                  ? 'bg-[var(--color-primary)]'
                  : 'bg-[var(--color-input)]'
              }`}
            >
              {i + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>

      <div className="rounded-xl border border-border bg-background p-6">
        {current === 'select_country' && (
          <>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-medium text-secondary">
              Country: <strong className="text-foreground">{countryName}</strong> · prefilled from HiBob
            </div>
            <SelectCountryStep onError={onStepError} onSuccess={clear} />
            <AlertError errors={errors} />
            {adminBag.countryCode && adminBag.fields.length > 0 && (
              <div className="mt-5 flex justify-end">
                <SubmitButton className={primaryBtn} onClick={clear}>
                  Create &amp; continue
                </SubmitButton>
              </div>
            )}
          </>
        )}

        {current === 'contract_details' && (
          <>
            <ContractDetailsStep onError={onStepError} onSuccess={clear} />
            <AlertError errors={errors} />
            <div className="mt-5 flex justify-between">
              <BackButton className={ghostBtn} onClick={clear}>
                Back
              </BackButton>
              <SubmitButton className={primaryBtn} onClick={clear}>
                Save &amp; continue
              </SubmitButton>
            </div>
          </>
        )}

        {current === 'administrative_details' && (
          <>
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-900">
              <Sparkles size={15} className="mt-0.5 shrink-0 text-amber-500" />
              <p>
                These are <strong className="font-semibold">{countryName}-specific payroll fields</strong>, collected here
                in HiBob and stored in Remote. No custom fields for HiBob to build or maintain.
              </p>
            </div>
            <AdministrativeDetailsStep onError={onStepError} onSuccess={clear} />
            <AlertError errors={errors} />
            <div className="mt-5 flex justify-between">
              <BackButton className={ghostBtn} onClick={clear}>
                Back
              </BackButton>
              <SubmitButton className={primaryBtn} onClick={clear}>
                Save &amp; continue
              </SubmitButton>
            </div>
          </>
        )}

        {current === 'invite' && (
          <>
            <p className="text-sm text-secondary mb-4">
              Send the invitation so your new hire can complete their payroll onboarding inside HiBob.
            </p>
            <AlertError errors={errors} />
            <div className="flex justify-between">
              <BackButton className={ghostBtn} onClick={clear}>
                Back
              </BackButton>
              <InvitationStep
                onSuccess={() => {
                  clear();
                  const id = adminBag.employmentId;
                  if (id) {
                    saveEmployment({ employmentId: id, countryCode, name: countryName });
                    onInvited(id);
                  }
                }}
                onError={onStepError}
              >
                Send invitation
              </InvitationStep>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function CountryPicker({ onPick }: { onPick: (code: string) => void }) {
  return (
    <div className="rounded-xl border border-border bg-background p-6 max-w-2xl">
      <h2 className="text-base font-semibold text-foreground mb-1">Add a new hire</h2>
      <p className="text-sm text-secondary mb-5">
        Where is this employee based? Payroll onboarding is powered by Remote, embedded here in HiBob.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {GP_COUNTRIES.map((c) => (
          <button
            key={c.code}
            onClick={() => onPick(c.code)}
            className="text-left rounded-lg border border-border p-4 hover:border-[var(--color-primary)] hover:bg-surface transition-colors"
          >
            <div className="font-semibold text-foreground">{c.name}</div>
            <div className="text-xs text-secondary mt-0.5">
              {c.hasTaxSteps ? 'Includes federal + state tax setup' : 'Country-specific payroll fields'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function AdminOnboarding() {
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [invitedId, setInvitedId] = useState<string | null>(null);
  const navigate = useNavigate();

  if (invitedId) {
    return (
      <div className="rounded-xl border border-border bg-background p-6 max-w-2xl">
        <h2 className="text-base font-semibold text-foreground mb-1">Invitation sent ✓</h2>
        <p className="text-sm text-secondary mb-5">
          Your new hire will get a task in HiBob to complete their payroll onboarding. Switch to the
          employee view to see their experience.
        </p>
        <div className="flex gap-3">
          <button className={primaryBtn} onClick={() => navigate('/gp/employee')}>
            View employee experience →
          </button>
          <button
            className={ghostBtn}
            onClick={() => {
              setInvitedId(null);
              setCountryCode(null);
            }}
          >
            Add another hire
          </button>
        </div>
      </div>
    );
  }

  if (!countryCode) {
    return <CountryPicker onPick={setCountryCode} />;
  }

  return (
    <GpRemoteFlows>
      <PayrollAdminOnboardingFlow
        companyId={COMPANY_ID}
        legalEntityId={getEntityForCountry(countryCode)}
        render={({ adminBag, components }: RenderArgs) => (
          <AdminSteps
            adminBag={adminBag}
            components={components}
            countryCode={countryCode}
            onInvited={setInvitedId}
          />
        )}
      />
    </GpRemoteFlows>
  );
}
