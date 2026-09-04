import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { OnboardingSDK } from '../features/employment/sdk/OnboardingSDK';
import config from '../config/partner';

// The headline beat: hiring an EOR employee without leaving the partner's UI.
//
// Everything below the header is Remote's own SDK, mounted inside this chrome.
// The partner builds and maintains none of the country-specific fields — that
// is the whole argument, so the framing above the flow says it out loud.
export function HirePage() {
  return (
    <div className="max-w-4xl">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-xs text-secondary hover:text-primary"
      >
        <ChevronLeft size={14} /> Back
      </Link>

      <div className="mt-3 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">Hire internationally</h1>
          <span className="inline-flex items-center rounded-full bg-tertiary px-2.5 py-0.5 text-xs font-semibold text-primary">
            Powered by Remote
          </span>
        </div>
        <p className="text-sm text-secondary mt-1 max-w-2xl">
          Hire in countries where you have no legal entity. Remote is the employer of record;
          the contract, payroll and compliance are handled for you. Every field below is
          country-specific and maintained by Remote — collected here in {config.company.name},
          stored in Remote.
        </p>
      </div>

      <OnboardingSDK />
    </div>
  );
}
