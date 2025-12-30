import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import config from '../../config/partner';

export function Layout() {
  return (
    <div 
      className="flex flex-col min-h-screen"
      style={{ 
        backgroundColor: config.colors.background,
        fontFamily: config.fonts.family 
      }}
    >
      <Header />
      <main className="flex-1 p-8">
        <Outlet />
      </main>
      <footer 
        className="py-4 text-center text-sm border-t"
        style={{ 
          borderColor: config.colors.borders,
          color: config.colors.secondary 
        }}
      >
        Powered by Remote.com
      </footer>
    </div>
  );
}

