import { Link, Navigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { CreateCompany } from '../features/company/CreateCompany';
import { useSession } from '../features/company/hooks';
import { useDemoActivation } from '../hooks/useDemoActivation';
import config from '../config/partner';

export function CreateCompanyPage() {
  const { data: session } = useSession();
  const { isActivated: demoActivated } = useDemoActivation();
  if (session?.company_id) return <Navigate to="/" replace />;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-secondary hover:text-primary">
        <ChevronLeft size={14} /> Back
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">Connect Remote</h1>
        <p className="text-sm text-secondary">
          Connect Remote to your {config.productName} account to start hiring internationally.
        </p>
      </div>

      {demoActivated && !session?.company_id && (
        <div className="border-l-4 border-accent bg-accent/5 px-4 py-3 rounded-sm">
          <p className="text-sm font-semibold text-foreground">Complete your Remote registration</p>
          <p className="text-xs text-secondary mt-1 leading-relaxed">
            Your {config.productName} account isn't connected to Remote yet. Register below to
            start hiring in countries where you don't have a legal presence.
          </p>
        </div>
      )}

      <Card title="Company Details" headerAccent>
        <CreateCompany />
      </Card>
    </div>
  );
}
