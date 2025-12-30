import { Card } from '../components/ui/Card';
import { CreateCompany } from '../features/company/CreateCompany';

export function CreateCompanyPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card
        title="Create Company"
        description="Register a new company on the Remote platform. This uses the direct API approach with JSON Schema forms."
      >
        <CreateCompany />
      </Card>
    </div>
  );
}

