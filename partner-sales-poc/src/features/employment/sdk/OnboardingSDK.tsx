import { useState } from 'react';
import { OnboardingFlow } from '@remoteoss/remote-flows';
import { RemoteFlowsWrapper } from './RemoteFlowsWrapper';
import { Button } from '../../../components/ui/Button';
import { Loading } from '../../../components/ui/Loading';
import config from '../../../config/partner';

interface OnboardingFormData {
  companyId: string;
  countryCode: string;
}

function OnboardingFlowWithProps({ companyId, countryCode }: OnboardingFormData) {
  return (
    <RemoteFlowsWrapper>
      <OnboardingFlow
        companyId={companyId}
        countryCode={countryCode}
        type="employee"
        render={({ stepState, isLoading, components }) => {
          if (isLoading) {
            return <Loading message="Loading onboarding form..." />;
          }

          const {
            SelectCountryStep,
            BasicInformationStep,
            ContractDetailsStep,
            BenefitsStep,
            ReviewStep,
            SubmitButton,
            BackButton,
          } = components;

          const renderStep = () => {
            switch (stepState.currentStep.name) {
              case 'select_country':
                return (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Select Country</h3>
                    <SelectCountryStep
                      onSuccess={(data) => console.log('Country selected:', data)}
                      onError={(error) => console.error('Country error:', error)}
                    />
                  </div>
                );
              case 'basic_information':
                return (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                    <BasicInformationStep
                      onSubmit={(payload) => console.log('Basic info:', payload)}
                      onSuccess={(data) => console.log('Employment created:', data)}
                      onError={(error) => console.error('Basic info error:', error)}
                    />
                  </div>
                );
              case 'contract_details':
                return (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Contract Details</h3>
                    <ContractDetailsStep
                      onSuccess={(data) => console.log('Contract updated:', data)}
                      onError={(error) => console.error('Contract error:', error)}
                    />
                  </div>
                );
              case 'benefits':
                return (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Benefits</h3>
                    <BenefitsStep
                      onSuccess={(data) => console.log('Benefits updated:', data)}
                      onError={(error) => console.error('Benefits error:', error)}
                    />
                  </div>
                );
              case 'review':
                return (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Review</h3>
                    <ReviewStep />
                  </div>
                );
              default:
                return <p>Unknown step: {stepState.currentStep.name}</p>;
            }
          };

          return (
            <div>
              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: config.colors.tertiary }}>
                <p className="text-sm" style={{ color: config.colors.secondary }}>
                  Step {stepState.currentStepIndex + 1} of {stepState.steps.length}:{' '}
                  <strong style={{ color: config.colors.foreground }}>
                    {stepState.currentStep.name.replace(/_/g, ' ')}
                  </strong>
                </p>
              </div>
              
              {renderStep()}
              
              <div className="flex gap-2 mt-6">
                {stepState.currentStepIndex > 0 && (
                  <BackButton className="px-4 py-2 border rounded-lg">
                    Previous
                  </BackButton>
                )}
                <SubmitButton className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  {stepState.currentStepIndex === stepState.steps.length - 1
                    ? 'Complete'
                    : 'Continue'}
                </SubmitButton>
              </div>
            </div>
          );
        }}
      />
    </RemoteFlowsWrapper>
  );
}

export function OnboardingSDK() {
  const [formData, setFormData] = useState<OnboardingFormData | null>(null);
  const [inputValues, setInputValues] = useState({
    companyId: '',
    countryCode: 'PRT',
  });

  if (formData) {
    return (
      <div>
        <div className="mb-4">
          <Button variant="outline" onClick={() => setFormData(null)}>
            ← Back to Setup
          </Button>
        </div>
        <OnboardingFlowWithProps {...formData} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div 
        className="p-4 rounded-lg"
        style={{ backgroundColor: config.colors.tertiary }}
      >
        <p className="text-sm" style={{ color: config.colors.secondary }}>
          This uses the <code>@remoteoss/remote-flows</code> SDK's{' '}
          <strong>OnboardingFlow</strong> component which provides a complete
          multi-step onboarding experience out of the box.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setFormData(inputValues);
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: config.colors.foreground }}>
            Company ID <span style={{ color: config.colors.error }}>*</span>
          </label>
          <input
            type="text"
            value={inputValues.companyId}
            onChange={(e) => setInputValues({ ...inputValues, companyId: e.target.value })}
            placeholder="Enter the company ID from Remote"
            required
            className="w-full p-2 rounded-lg text-sm"
            style={{ border: `1px solid ${config.colors.input}` }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: config.colors.foreground }}>
            Country Code
          </label>
          <select
            value={inputValues.countryCode}
            onChange={(e) => setInputValues({ ...inputValues, countryCode: e.target.value })}
            className="w-full p-2 rounded-lg text-sm"
            style={{ border: `1px solid ${config.colors.input}` }}
          >
            <option value="PRT">Portugal</option>
            <option value="GBR">United Kingdom</option>
            <option value="DEU">Germany</option>
            <option value="ESP">Spain</option>
            <option value="FRA">France</option>
          </select>
        </div>

        <Button type="submit">Start Onboarding Flow</Button>
      </form>
    </div>
  );
}

