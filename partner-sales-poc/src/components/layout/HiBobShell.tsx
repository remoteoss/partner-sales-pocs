import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Home,
  Users,
  CalendarClock,
  Wallet,
  FileText,
  Settings,
  Receipt,
  ListTodo,
  Bell,
  Search,
} from 'lucide-react';
import config from '../../config/partner';

// One HiBob shell, two personas. The persona is derived from the route:
//   /gp/employee*  → employee self-service view (Home / Time off / Expenses / Tasks)
//   everything else → admin view (People / Payroll / Global Payroll / Reports)
// The top-bar toggle flips between the two — that's the demo's "employer view"
// vs "employee view" switch. Both are visually HiBob; the SDK mounts inside.

type NavItem = {
  label: string;
  icon: typeof Home;
  to?: string;
  active?: boolean;
  indent?: boolean;
  subtext?: string;
};

const ADMIN_NAV = (pathname: string): NavItem[] => [
  { label: 'Home', icon: Home },
  { label: 'People', icon: Users },
  { label: 'Time & Attendance', icon: CalendarClock },
  {
    label: 'Global Payroll',
    icon: Wallet,
    to: '/gp/admin',
    active: pathname.startsWith('/gp/admin'),
    subtext: 'Powered by Remote',
  },
  {
    label: 'Pay runs',
    icon: Receipt,
    to: '/gp/pay-runs',
    active: pathname.startsWith('/gp/pay-runs'),
    indent: true,
  },
  { label: 'Documents', icon: FileText },
  { label: 'Settings', icon: Settings },
];

const EMPLOYEE_NAV = (pathname: string): NavItem[] => [
  { label: 'Home', icon: Home },
  {
    label: 'Tasks',
    icon: ListTodo,
    to: '/gp/employee',
    active: pathname.startsWith('/gp/employee'),
  },
  { label: 'Time off', icon: CalendarClock },
  { label: 'Expenses', icon: Receipt },
  { label: 'Documents', icon: FileText },
];

export function HiBobShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const isEmployee = location.pathname.startsWith('/gp/employee');
  const nav = isEmployee
    ? EMPLOYEE_NAV(location.pathname)
    : ADMIN_NAV(location.pathname);

  // The signed-in person differs by persona: an employer admin vs the new hire.
  const person = isEmployee
    ? { name: 'Jordan Lee', role: 'New hire', initials: 'JL' }
    : { name: 'Alex Morgan', role: 'Payroll admin', initials: 'AM' };
  const togglePersona = () =>
    navigate(isEmployee ? '/gp/admin' : '/gp/employee');

  return (
    <div className="flex min-h-screen bg-surface font-sans text-foreground">
      {/* Left sidebar */}
      <aside className="w-64 shrink-0 bg-background border-r border-border flex flex-col">
        <Link
          to={isEmployee ? '/gp/employee' : '/gp/admin'}
          className="h-16 flex items-center px-5 border-b border-border hover:bg-surface transition-colors"
        >
          <img src={config.logo.src} alt={config.logo.alt} className="h-7" />
        </Link>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map((item) => {
            const Icon = item.icon;
            const base = `flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors ${
              item.indent ? 'ml-7 px-3 text-[13px]' : 'px-3'
            }`;
            const inner = (
              <>
                <Icon size={18} strokeWidth={2} className="shrink-0" />
                <span className="flex flex-col leading-tight">
                  <span>{item.label}</span>
                  {item.subtext && (
                    <span className="text-[10.5px] font-normal text-[var(--color-primary)]">
                      {item.subtext}
                    </span>
                  )}
                </span>
              </>
            );
            if (item.to) {
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`${base} ${
                    item.active
                      ? 'text-primary bg-tertiary'
                      : 'text-secondary hover:text-foreground hover:bg-surface'
                  }`}
                >
                  {inner}
                </Link>
              );
            }
            return (
              <div
                key={item.label}
                className={`${base} text-secondary/70 cursor-default`}
              >
                {inner}
              </div>
            );
          })}
        </nav>

        {/* Signed-in user block — HiBob shows the person at the foot of the nav */}
        <div className="px-3 py-3 border-t border-border">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface transition-colors cursor-default">
            <div className="h-9 w-9 shrink-0 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              {person.initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">{person.name}</div>
              <div className="text-xs text-secondary truncate">{person.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 shrink-0 bg-background border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-2 rounded-full bg-surface border border-border px-3.5 py-2 text-secondary w-72">
            <Search size={16} />
            <span className="text-sm">Search</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Persona toggle — the "employer vs employee" demo switch */}
            <div className="flex items-center rounded-full bg-surface border border-border p-0.5 text-xs font-semibold">
              <button
                onClick={() => !isEmployee || togglePersona()}
                className={`px-3 py-1.5 rounded-full transition-colors ${
                  !isEmployee ? 'bg-primary text-white' : 'text-secondary hover:text-foreground'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => isEmployee || togglePersona()}
                className={`px-3 py-1.5 rounded-full transition-colors ${
                  isEmployee ? 'bg-primary text-white' : 'text-secondary hover:text-foreground'
                }`}
              >
                Employee
              </button>
            </div>
            <button className="relative text-secondary hover:text-foreground transition-colors">
              <Bell size={18} />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
            </button>
            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              {person.initials}
            </div>
          </div>
        </header>

        <main className="flex-1 px-8 py-7 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
