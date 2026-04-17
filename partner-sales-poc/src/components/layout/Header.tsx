import { Link, useLocation } from 'react-router-dom';
import { Bell, Search, User } from 'lucide-react';
import config from '../../config/partner';

const PRIMARY_NAV = [
  { path: '/', label: 'HOME' },
  { path: '/myself', label: 'MYSELF' },
  { path: '/people', label: 'PEOPLE' },
  { path: '/process', label: 'PROCESS' },
  { path: '/reports', label: 'REPORTS' },
];

export function Header() {
  const location = useLocation();

  const isActiveNav = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header>
      {/* Primary top bar — navy */}
      <div className="bg-primary text-white">
        <div className="flex items-center gap-8 px-6 h-14">
          <Link to="/" className="flex items-center shrink-0 hover:opacity-90 transition-opacity">
            <img src={config.logo.src} alt={config.logo.alt} className="h-7" />
          </Link>

          <nav className="flex items-center gap-1 flex-1">
            {PRIMARY_NAV.map((link) => {
              const active = isActiveNav(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 h-14 flex items-center text-xs font-semibold tracking-wider transition-colors ${
                    active
                      ? 'bg-primary-hover text-white'
                      : 'text-white/80 hover:bg-primary-hover hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4 text-white/90 shrink-0">
            <button
              type="button"
              aria-label="Search"
              className="p-1.5 hover:bg-primary-hover rounded transition-colors"
            >
              <Search size={16} />
            </button>
            <button
              type="button"
              aria-label="Notifications"
              className="p-1.5 hover:bg-primary-hover rounded transition-colors"
            >
              <Bell size={16} />
            </button>
            <button
              type="button"
              aria-label="Account"
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
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
            {config.company.name} Workforce Now
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

function getBreadcrumbLabel(pathname: string): string {
  if (pathname === '/') return 'Home';
  if (pathname.startsWith('/new-hire')) return 'Process / New Hire';
  if (pathname.startsWith('/create-company')) return 'Process / New Hire / Register Company';
  return pathname.replace(/^\//, '');
}
