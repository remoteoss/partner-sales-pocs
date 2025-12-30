import { Link, useLocation } from 'react-router-dom';
import config from '../../config/partner';

export function Header() {
  const location = useLocation();

  const navLinks = [
    { path: '/create-company', label: 'Create Company' },
    { path: '/create-employment', label: 'Create Employment' },
  ];

  return (
    <header 
      className="border-b"
      style={{ 
        borderColor: config.colors.borders,
        backgroundColor: config.colors.background 
      }}
    >
      <div className="px-8 py-4 flex items-center justify-between">
        {/* Logo → Home */}
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <img src={config.logo.src} alt={config.logo.alt} className="h-8" />
        </Link>
        
        {/* Nav Links */}
        <nav className="flex items-center gap-12">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="text-sm font-medium pb-1 transition-colors"
                style={{
                  color: isActive ? config.colors.foreground : config.colors.secondary,
                  borderBottom: isActive ? `2px solid ${config.colors.primary}` : '2px solid transparent',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

