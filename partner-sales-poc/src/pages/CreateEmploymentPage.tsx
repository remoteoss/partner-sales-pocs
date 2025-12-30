import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { OnboardingSDK } from '../features/employment/sdk/OnboardingSDK';
import { CreateEmploymentAPI } from '../features/employment/api/CreateEmploymentAPI';

export function CreateEmploymentPage() {
  const tabs = [
    {
      id: 'sdk',
      label: 'SDK Approach',
      content: <OnboardingSDK />,
    },
    {
      id: 'api',
      label: 'API Approach',
      content: <CreateEmploymentAPI />,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <Card
        title="Create Employment"
        description="Onboard a new employee using either the SDK's pre-built components or direct API calls."
      >
        <Tabs tabs={tabs} defaultTab="sdk" />
      </Card>
    </div>
  );
}

