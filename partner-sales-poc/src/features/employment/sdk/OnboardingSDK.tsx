import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  OnboardingFlow,
  OnboardingRenderProps,
  NormalizedFieldError,
  CreditRiskState,
  CreditRiskStatus,
} from '@remoteoss/remote-flows';
import { RemoteFlowsWrapper } from './RemoteFlowsWrapper';
import { Button } from '../../../components/ui/Button';
import { Loading } from '../../../components/ui/Loading';
import { useCounter, getDefaultEmployeeValues } from '../../../hooks/useCounter';
import config from '../../../config/partner';

interface Session {
  company_id: string | null;
  user_id: string | null;
  refresh_token: string | null;
  country_code: string | null;
}

const STEPS = [
  'Select Country',
  'Basic Information',
  'Contract Details',
  'Benefits',
  'Review & Invite',
];

// Alert component for errors
function AlertError({ errors }: { errors: { apiError: string; fieldErrors: NormalizedFieldError[] } }) {
  if (!errors.apiError && errors.fieldErrors.length === 0) return null;
  
  return (
    <div className="p-3 rounded-lg mt-4" style={{ backgroundColor: `${config.colors.error}15`, border: `1px solid ${config.colors.error}` }}>
      {errors.apiError && (
        <p className="text-sm" style={{ color: config.colors.error }}>{errors.apiError}</p>
      )}
      {errors.fieldErrors.map((err, i) => (
        <p key={i} className="text-sm" style={{ color: config.colors.error }}>
          {err.path}: {err.message}
        </p>
      ))}
    </div>
  );
}

// Credit Risk Status display
function CreditRiskSection({ 
  creditRiskState, 
  creditRiskStatus,
  employeeName 
}: { 
  creditRiskState: CreditRiskState;
  creditRiskStatus?: CreditRiskStatus;
  employeeName?: string;
}) {
  switch (creditRiskState) {
    case 'referred':
      return (
        <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: config.colors.tertiary }}>
          <h3 className="font-medium mb-2">Account Under Review</h3>
          <p className="text-sm" style={{ color: config.colors.secondary }}>
            Once your account is approved, you can invite {employeeName || 'the employee'} to Remote.
          </p>
          {creditRiskStatus && (
            <p className="text-xs mt-2" style={{ color: config.colors.secondary }}>
              Status: {creditRiskStatus}
            </p>
          )}
        </div>
      );
    case 'deposit_required':
      return (
        <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: `${config.colors.primary}10` }}>
          <h3 className="font-medium mb-2">Reserve Payment Required</h3>
          <p className="text-sm" style={{ color: config.colors.secondary }}>
            A reserve payment is required before inviting this employee. Click "Create Reserve" to proceed.
          </p>
        </div>
      );
    case 'deposit_required_successful':
      return (
        <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: `${config.colors.success}15` }}>
          <h3 className="font-medium mb-2">Reserve Invoice Created</h3>
          <p className="text-sm" style={{ color: config.colors.secondary }}>
            You'll receive a reserve invoice soon. The employee can be invited after payment is received.
          </p>
        </div>
      );
    case 'invite':
      return (
        <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: `${config.colors.success}15` }}>
          <h3 className="font-medium mb-2">Ready to Invite!</h3>
          <p className="text-sm" style={{ color: config.colors.secondary }}>
            {employeeName ? `${employeeName} is` : 'The employee is'} ready to be invited to Remote.
          </p>
        </div>
      );
    case 'invite_successful':
      return (
        <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: `${config.colors.success}15` }}>
          <h3 className="font-medium mb-2">🎉 Invitation Sent!</h3>
          <p className="text-sm" style={{ color: config.colors.secondary }}>
            {employeeName || 'The employee'} has been invited to Remote. They'll receive an email to complete their onboarding.
          </p>
        </div>
      );
    default:
      return null;
  }
}

// Review Step Component
function ReviewStepContent({ 
  onboardingBag, 
  components,
  errors,
  setErrors,
}: {
  onboardingBag: OnboardingRenderProps['onboardingBag'];
  components: OnboardingRenderProps['components'];
  errors: { apiError: string; fieldErrors: NormalizedFieldError[] };
  setErrors: (errors: { apiError: string; fieldErrors: NormalizedFieldError[] }) => void;
}) {
  const { 
    OnboardingInvite, 
    BackButton,
    ReviewStep,
  } = components;

  const employeeName = onboardingBag.employment?.basic_information?.name as string | undefined;

  return (
    <div>
      {/* Review Summary */}
      <div className="mb-6">
        <h3 className="font-medium mb-3" style={{ color: config.colors.foreground }}>
          Employment Summary
        </h3>
        
        {/* Basic Information */}
        {onboardingBag.meta?.fields?.basic_information && (
          <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: config.colors.tertiary }}>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Basic Information</h4>
              <button 
                className="text-xs px-2 py-1 rounded"
                style={{ color: config.colors.primary }}
                onClick={() => onboardingBag.goTo('basic_information')}
                disabled={onboardingBag.isEmploymentReadOnly}
              >
                Edit
              </button>
            </div>
            <div className="text-sm space-y-1" style={{ color: config.colors.secondary }}>
              {Object.entries(onboardingBag.meta.fields.basic_information).map(([key, value]: [string, any]) => {
                if (value?.label && value?.prettyValue) {
                  return (
                    <p key={key}>
                      <span className="font-medium">{value.label}:</span> {value.prettyValue}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}

        {/* Contract Details */}
        {onboardingBag.meta?.fields?.contract_details && (
          <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: config.colors.tertiary }}>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Contract Details</h4>
              <button 
                className="text-xs px-2 py-1 rounded"
                style={{ color: config.colors.primary }}
                onClick={() => onboardingBag.goTo('contract_details')}
                disabled={onboardingBag.isEmploymentReadOnly}
              >
                Edit
              </button>
            </div>
            <div className="text-sm space-y-1" style={{ color: config.colors.secondary }}>
              {Object.entries(onboardingBag.meta.fields.contract_details).map(([key, value]: [string, any]) => {
                if (value?.label && value?.prettyValue) {
                  return (
                    <p key={key}>
                      <span className="font-medium">{value.label}:</span> {value.prettyValue}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}
      </div>

      {/* Credit Risk / Invite Section using SDK's ReviewStep */}
      <ReviewStep
        render={({ creditRiskState, creditRiskStatus }: { 
          creditRiskState: CreditRiskState; 
          creditRiskStatus?: CreditRiskStatus;
        }) => (
          <>
            <CreditRiskSection 
              creditRiskState={creditRiskState}
              creditRiskStatus={creditRiskStatus}
              employeeName={employeeName}
            />
            
            <AlertError errors={errors} />
            
            <div className="flex gap-2 mt-6">
              <BackButton 
                className="px-4 py-2 border rounded-lg"
                disabled={onboardingBag.isEmploymentReadOnly}
              >
                Previous Step
              </BackButton>
              
              {/* OnboardingInvite - The actual invite button from SDK */}
              {creditRiskStatus !== 'referred' && (
                <OnboardingInvite
                  disabled={!onboardingBag.canInvite}
                  className="px-4 py-2 rounded-lg text-white"
                  style={{ backgroundColor: config.colors.primary }}
                  onSuccess={() => {
                    console.log('Invitation sent successfully!');
                    setErrors({ apiError: '', fieldErrors: [] });
                  }}
                  onError={({ error }: { error: Error }) => {
                    console.error('Invitation failed:', error);
                    setErrors({ apiError: error.message, fieldErrors: [] });
                  }}
                  render={({ employmentStatus }: { employmentStatus: 'invited' | 'created_awaiting_reserve' }) => {
                    return employmentStatus === 'created_awaiting_reserve'
                      ? 'Create Reserve'
                      : 'Invite Employee';
                  }}
                />
              )}
            </div>
          </>
        )}
      />
    </div>
  );
}

// Multi-step form following SDK example pattern
function MultiStepForm({ onboardingBag, components }: {
  onboardingBag: OnboardingRenderProps['onboardingBag'];
  components: OnboardingRenderProps['components'];
}) {
  const {
    BasicInformationStep,
    ContractDetailsStep,
    BenefitsStep,
    SubmitButton,
    BackButton,
    SelectCountryStep,
  } = components;

  const [errors, setErrors] = useState<{
    apiError: string;
    fieldErrors: NormalizedFieldError[];
  }>({
    apiError: '',
    fieldErrors: [],
  });

  switch (onboardingBag.stepState.currentStep.name) {
    case 'select_country':
      return (
        <>
          <SelectCountryStep
            onSubmit={(payload) => console.log('Country payload:', payload)}
            onSuccess={(response) => console.log('Country selected:', response)}
            onError={({ error, fieldErrors }) => 
              setErrors({ apiError: error.message, fieldErrors })
            }
          />
          <AlertError errors={errors} />
          <div className="flex gap-2 mt-6">
            <SubmitButton className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: config.colors.primary }}>
              Continue
            </SubmitButton>
          </div>
        </>
      );

    case 'basic_information':
      return (
        <>
          <BasicInformationStep
            onSubmit={(payload) => console.log('Basic info payload:', payload)}
            onSuccess={(data) => console.log('Employment created:', data)}
            onError={({ error, fieldErrors }) => 
              setErrors({ apiError: error.message, fieldErrors })
            }
          />
          <AlertError errors={errors} />
          <div className="flex gap-2 mt-6">
            <BackButton 
              className="px-4 py-2 border rounded-lg"
              onClick={() => setErrors({ apiError: '', fieldErrors: [] })}
            >
              Previous Step
            </BackButton>
            <SubmitButton 
              className="px-4 py-2 rounded-lg text-white"
              style={{ backgroundColor: config.colors.primary }}
              onClick={() => setErrors({ apiError: '', fieldErrors: [] })}
            >
              Create Employment & Continue
            </SubmitButton>
          </div>
        </>
      );

    case 'contract_details':
      return (
        <>
          <ContractDetailsStep
            onSubmit={(payload) => console.log('Contract payload:', payload)}
            onSuccess={(data) => console.log('Contract updated:', data)}
            onError={({ error, fieldErrors }) => 
              setErrors({ apiError: error.message, fieldErrors })
            }
          />
          <AlertError errors={errors} />
          <div className="flex gap-2 mt-6">
            <BackButton 
              className="px-4 py-2 border rounded-lg"
              onClick={() => setErrors({ apiError: '', fieldErrors: [] })}
            >
              Previous Step
            </BackButton>
            <SubmitButton 
              className="px-4 py-2 rounded-lg text-white"
              style={{ backgroundColor: config.colors.primary }}
              onClick={() => setErrors({ apiError: '', fieldErrors: [] })}
            >
              Continue
            </SubmitButton>
          </div>
        </>
      );

    case 'benefits':
      return (
        <>
          <BenefitsStep
            onSubmit={(payload) => console.log('Benefits payload:', payload)}
            onSuccess={(data) => console.log('Benefits updated:', data)}
            onError={({ error, fieldErrors }) => 
              setErrors({ apiError: error.message, fieldErrors })
            }
          />
          <AlertError errors={errors} />
          <div className="flex gap-2 mt-6">
            <BackButton 
              className="px-4 py-2 border rounded-lg"
              onClick={() => setErrors({ apiError: '', fieldErrors: [] })}
            >
              Previous Step
            </BackButton>
            <SubmitButton 
              className="px-4 py-2 rounded-lg text-white"
              style={{ backgroundColor: config.colors.primary }}
              onClick={() => setErrors({ apiError: '', fieldErrors: [] })}
            >
              Continue
            </SubmitButton>
          </div>
        </>
      );

    case 'review':
      return (
        <ReviewStepContent 
          onboardingBag={onboardingBag}
          components={components}
          errors={errors}
          setErrors={setErrors}
        />
      );

    default:
      return <p>Unknown step: {onboardingBag.stepState.currentStep.name}</p>;
  }
}

// Main render function following SDK example
function OnboardingRender({ onboardingBag, components }: OnboardingRenderProps) {
  if (onboardingBag.isLoading) {
    return <Loading message="Loading onboarding form..." />;
  }

  const currentStepIndex = onboardingBag.stepState.currentStep.index;
  const stepTitle = STEPS[currentStepIndex] || 'Onboarding';

  return (
    <>
      {/* Step navigation */}
      <div className="mb-6">
        <ul className="flex flex-wrap gap-2">
          {STEPS.map((step, index) => (
            <li
              key={index}
              className={`px-3 py-1 rounded-full text-xs ${
                index === currentStepIndex 
                  ? 'text-white' 
                  : index < currentStepIndex 
                    ? 'text-green-600 bg-green-100'
                    : 'text-gray-500 bg-gray-100'
              }`}
              style={index === currentStepIndex ? { backgroundColor: config.colors.primary } : {}}
            >
              {index + 1}. {step}
            </li>
          ))}
        </ul>
      </div>

      {/* Current step content */}
      <div className="p-4 rounded-lg border" style={{ borderColor: config.colors.borders }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: config.colors.foreground }}>
          {stepTitle}
        </h2>
        <MultiStepForm onboardingBag={onboardingBag} components={components} />
      </div>
    </>
  );
}

// Onboarding flow with props
interface OnboardingFormData {
  companyId: string;
  countryCode?: string;
  useSessionToken: boolean;
  initialValues?: Record<string, unknown>;
}

function OnboardingWithProps({ companyId, countryCode, useSessionToken, initialValues }: OnboardingFormData) {
  return (
    <RemoteFlowsWrapper useSessionToken={useSessionToken}>
      <OnboardingFlow
        companyId={companyId}
        countryCode={countryCode}
        type="employee"
        initialValues={initialValues}
        render={OnboardingRender}
      />
    </RemoteFlowsWrapper>
  );
}

// Main component - auto-starts with session or .env company_id
export function OnboardingSDK() {
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  
  // Check URL params
  const useSessionFromUrl = searchParams.get('use_session') === 'true';
  const companyIdFromUrl = searchParams.get('company_id');
  
  // Fallback company ID from .env (for direct homepage access)
  const envCompanyId = import.meta.env.VITE_COMPANY_ID as string | undefined;
  
  // Get counter for default employee values - capture once to prevent re-renders
  const { counter, isLoading: counterLoading } = useCounter();
  const initialCounterRef = useRef<number | null>(null);
  
  // Capture counter value once when it first loads
  if (initialCounterRef.current === null && !counterLoading) {
    initialCounterRef.current = counter;
  }
  
  const currentCounter = initialCounterRef.current ?? counter;
  const defaultEmployeeValues = getDefaultEmployeeValues(currentCounter);
  
  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/session');
        const data = await response.json();
        setSession(data);
      } catch (err) {
        console.error('Failed to fetch session:', err);
      } finally {
        setSessionLoading(false);
      }
    };
    fetchSession();
  }, []);

  if (sessionLoading || counterLoading) {
    return <Loading message="Loading..." />;
  }

  // Determine company ID source (priority: URL > session > .env)
  const isUsingSession = (useSessionFromUrl && session?.company_id) || (!companyIdFromUrl && session?.company_id);
  const companyId = companyIdFromUrl || session?.company_id || envCompanyId;
  
  // Use session token if we have session with refresh_token
  const useSessionToken = !!(session?.company_id && session?.refresh_token);

  // Determine source label for display
  const getSourceLabel = () => {
    if (companyIdFromUrl) return 'from URL';
    if (session?.company_id) return 'from session';
    if (envCompanyId) return 'from .env';
    return '';
  };

  // If we have a company ID, auto-start the flow
  if (companyId) {
    return (
      <div>
        <div className="mb-4 p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: config.colors.tertiary }}>
          <span className="text-sm" style={{ color: config.colors.secondary }}>
            Company: <code className="px-2 py-1 rounded font-mono" style={{ backgroundColor: config.colors.background }}>{companyId}</code>
            <span className="ml-2 text-xs" style={{ color: config.colors.primary }}>({getSourceLabel()})</span>
          </span>
        </div>
        <OnboardingWithProps 
          companyId={companyId}
          useSessionToken={useSessionToken}
          initialValues={defaultEmployeeValues}
        />
      </div>
    );
  }

  // No company ID available anywhere - show error
  return (
    <div className="space-y-4">
      <div 
        className="p-4 rounded-lg text-center"
        style={{ backgroundColor: `${config.colors.error}15`, border: `1px solid ${config.colors.error}` }}
      >
        <p className="text-sm font-medium mb-2" style={{ color: config.colors.error }}>
          No Company ID Available
        </p>
        <p className="text-sm" style={{ color: config.colors.secondary }}>
          Please create a company first, or add <code>VITE_COMPANY_ID</code> to your <code>.env</code> file.
        </p>
      </div>
      
      <div className="text-center">
        <Button onClick={() => window.location.href = '/create-company'}>
          Create a Company
        </Button>
      </div>
    </div>
  );
}
