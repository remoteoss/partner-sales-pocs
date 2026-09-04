import { Link, useLocation } from 'react-router-dom';
import { Bell, RotateCcw, Search, User } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import config from '../../config/partner';
import { useSession } from '../../features/company/hooks';
import { useDemoActivation } from '../../hooks/useDemoActivation';

const PRIMARY_NAV = [
  { path: '/', label: 'HOME' },
  { path: '/myself', label: 'MYSELF' },
  { path: '/people', label: 'PEOPLE' },
  { path: '/process', label: 'PROCESS' },
  { path: '/reports', label: 'REPORTS' },
];

type DemoState = 'discovery' | 'activation' | 'hiring';

export function Header() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { isActivated, activate, deactivate } = useDemoActivation();

  const demoState: DemoState = session?.company_id
    ? 'hiring'
    : isActivated
    ? 'activation'
    : 'discovery';

  const isActiveNav = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const gotoDiscovery = async () => {
    deactivate();
    await fetch('/api/session', { method: 'DELETE' });
    await fetch('/api/counter/increment', { method: 'POST' });
    await queryClient.invalidateQueries({ queryKey: ['session'] });
    await queryClient.invalidateQueries({ queryKey: ['counter'] });
  };

  const gotoActivation = async () => {
    activate();
    await queryClient.invalidateQueries({ queryKey: ['session'] });
  };

  return (
    <header>
      {/* Primary top bar — light chrome so the partner logo leads */}
      <div className="bg-white text-foreground border-b border-border">
        <div className="flex items-center gap-8 px-6 h-14">
          <Link to="/" className="flex items-center shrink-0 hover:opacity-80 transition-opacity">
            <img src={config.logo.src} alt={config.logo.alt} className="h-5" />
          </Link>

          <nav className="flex items-center gap-1 flex-1">
            {PRIMARY_NAV.map((link) => {
              const active = isActiveNav(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 h-14 flex items-center text-xs font-semibold tracking-wider border-b-2 -mb-px no-underline hover:no-underline transition-colors ${
                    active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-secondary hover:bg-tertiary hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 text-secondary shrink-0">
            <DemoStatePill
              state={demoState}
              onDiscovery={gotoDiscovery}
              onActivation={gotoActivation}
            />
            <button
              type="button"
              onClick={gotoDiscovery}
              className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold tracking-wide uppercase border border-border text-secondary hover:bg-tertiary hover:text-foreground hover:border-input rounded-sm transition-colors"
              title="Clear the activated session and return to Discovery"
            >
              <RotateCcw size={12} />
              Reset Demo
            </button>
            <button
              type="button"
              aria-label="Search"
              className="p-1.5 hover:bg-tertiary hover:text-foreground rounded transition-colors"
            >
              <Search size={16} />
            </button>
            <button
              type="button"
              aria-label="Notifications"
              className="p-1.5 hover:bg-tertiary hover:text-foreground rounded transition-colors"
            >
              <Bell size={16} />
            </button>
            <button
              type="button"
              aria-label="Account"
              className="w-8 h-8 rounded-full bg-tertiary text-primary hover:opacity-80 flex items-center justify-center transition-colors"
            >
              <User size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary sub-nav row — section tabs */}
      <div className="bg-surface border-b border-border">
        <div className="flex items-center px-6 h-10 text-xs">
          <span className="text-secondary">
            {config.company.name} {config.productName}
          </span>
          <span className="mx-2 text-secondary">/</span>
          <span className="font-medium text-foreground">
            {getBreadcrumbLabel(location.pathname)}
          </span>
        </div>
      </div>
    </header>
  );
}

interface DemoStatePillProps {
  state: DemoState;
  onDiscovery: () => void;
  onActivation: () => void;
}

function DemoStatePill({ state, onDiscovery, onActivation }: DemoStatePillProps) {
  const segments: Array<{ key: DemoState; label: string }> = [
    { key: 'discovery', label: 'Discovery' },
    { key: 'activation', label: 'Activation' },
    { key: 'hiring', label: 'Hiring' },
  ];

  const segmentProps = (key: DemoState): {
    disabled: boolean;
    onClick?: () => void;
    title: string;
  } => {
    if (key === state) return { disabled: true, title: 'Current state' };
    if (key === 'discovery') return { disabled: false, onClick: onDiscovery, title: 'Reset to Discovery' };
    if (key === 'activation') {
      if (state === 'hiring') {
        return { disabled: true, title: 'Click Discovery first to leave Hiring' };
      }
      return { disabled: false, onClick: onActivation, title: 'Simulate post-sales activation' };
    }
    // key === 'hiring'
    return { disabled: true, title: 'Register a company to enter Hiring' };
  };

  return (
    <div
      className="flex items-center gap-0.5 p-0.5 rounded-sm border border-border bg-tertiary"
      role="group"
      aria-label="Demo state"
    >
      {segments.map((seg) => {
        const current = seg.key === state;
        const { disabled, onClick, title } = segmentProps(seg.key);
        return (
          <button
            key={seg.key}
            type="button"
            onClick={onClick}
            disabled={disabled && !current}
            aria-pressed={current}
            title={title}
            className={`px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-[3px] transition-colors ${
              current
                ? 'bg-primary text-white'
                : disabled
                ? 'text-input cursor-not-allowed'
                : 'text-secondary hover:bg-surface hover:text-foreground'
            }`}
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}

function getBreadcrumbLabel(pathname: string): string {
  if (pathname === '/') return 'Home';
  if (pathname.startsWith('/new-hire')) return 'Process / New Hire';
  if (pathname.startsWith('/create-company')) return 'Process / New Hire / Register Company';
  return pathname.replace(/^\//, '');
}
