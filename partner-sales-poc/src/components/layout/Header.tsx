import { Link, useLocation } from 'react-router-dom';
import config from '../../config/partner';

export function Header() {
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/create-company', label: 'Create Company' },
    { path: '/create-employment', label: 'Create Employment' },
  ];

  return (
    <header 
      className="flex h-16 items-center justify-between px-6 border-b"
      style={{ 
        borderColor: config.colors.borders,
        backgroundColor: config.colors.tertiary 
      }}
    >
      <nav className="flex items-center space-x-6">
        <Link to="/" className="flex items-center">
          <img src={config.logo.src} alt={config.logo.alt} className="h-8" />
        </Link>
        
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="text-sm font-medium transition-colors"
            style={{
              color: location.pathname === link.path 
                ? config.colors.primary 
                : config.colors.secondary,
            }}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      
      <div className="text-sm" style={{ color: config.colors.secondary }}>
        {config.company.name}
      </div>
    </header>
  );
}

