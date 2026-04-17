import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { CreateCompany } from '../features/company/CreateCompany';

export function CreateCompanyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link to="/new-hire" className="inline-flex items-center gap-1 text-xs text-secondary hover:text-primary">
        <ChevronLeft size={14} /> Back
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">Register Company</h1>
        <p className="text-sm text-secondary">
          Provision a company on Remote to activate international hiring via EOR.
        </p>
      </div>

      <Card title="Company Details" headerAccent>
        <CreateCompany />
      </Card>
    </div>
  );
}
