import { Outlet } from 'react-router-dom';
import config from '../../config/partner';
import { Header } from './Header';
import { QuickBooksShell } from './QuickBooksShell';
import { HiBobShell } from './HiBobShell';

export function Layout() {
  if (config.chrome === 'quickbooks') {
    return <QuickBooksShell />;
  }

  if (config.chrome === 'hibob') {
    return <HiBobShell />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface font-sans text-foreground">
      <Header />
      <main className="flex-1 px-6 py-6">
        <Outlet />
      </main>
      <footer className="py-3 px-6 text-xs text-secondary border-t border-border bg-background">
        <div className="flex items-center justify-between">
          <span>© {new Date().getFullYear()} {config.legalEntity}. All rights reserved.</span>
          <span className="text-[11px]">Powered by Remote.com</span>
        </div>
      </footer>
    </div>
  );
}
