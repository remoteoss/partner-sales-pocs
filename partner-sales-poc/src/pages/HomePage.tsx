import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import config from '../config/partner';
import { Building2, Users } from 'lucide-react';

export function HomePage() {
  const features = [
    {
      title: 'Create Company',
      description: 'Register a new company on the Remote platform. Magic link into dashboard or continue with SDK.',
      icon: Building2,
      path: '/create-company',
      color: config.colors.primary,
    },
    {
      title: 'Create Employment',
      description: 'Onboard a new employee using either the SDK or direct API approach.',
      icon: Users,
      path: '/create-employment',
      color: config.colors.accent,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1
          className="text-4xl font-bold mb-4"
          style={{ color: config.colors.foreground, fontFamily: config.fonts.headingFamily }}
        >
          Partner Sales Demo
        </h1>
        <p className="text-lg" style={{ color: config.colors.secondary }}>
          Demonstrate Remote's embedded solution capabilities to potential partners
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <Card key={feature.path} className="hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${feature.color}15` }}
              >
                <feature.icon size={24} style={{ color: feature.color }} />
              </div>
              <div className="flex-1">
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: config.colors.foreground }}
                >
                  {feature.title}
                </h3>
                <p className="text-sm mb-4" style={{ color: config.colors.secondary }}>
                  {feature.description}
                </p>
                <Link to={feature.path}>
                  <Button variant="outline">Get Started →</Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-8" title="About This Demo">
        <p className="text-sm" style={{ color: config.colors.secondary }}>
          This demo showcases two approaches to integrating with Remote:
        </p>
        <ul className="mt-4 space-y-2 text-sm" style={{ color: config.colors.secondary }}>
          <li>
            <strong>SDK Approach:</strong> Using @remoteoss/remote-flows for pre-built UI components
          </li>
          <li>
            <strong>API Approach:</strong> Direct REST API calls with @remoteoss/json-schema-form for dynamic forms
          </li>
          <li>
            <strong>Magic Link:</strong> Seamless SSO into Remote dashboard for advanced workflows
          </li>
        </ul>
      </Card>
    </div>
  );
}

