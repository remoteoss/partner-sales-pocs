import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { useCounter } from '../../hooks/useCounter';
import config from '../../config/partner';

export function Layout() {
  const { counter, isLoading } = useCounter();

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
        className="py-4 text-center text-sm border-t relative"
        style={{ 
          borderColor: config.colors.borders,
          color: config.colors.secondary 
        }}
      >
        <span>Powered by Remote.com</span>
        
        {/* Counter display in bottom right corner */}
        <div 
          className="absolute right-4 bottom-4 px-3 py-1 rounded-full text-xs font-mono"
          style={{ 
            backgroundColor: config.colors.tertiary,
            color: config.colors.secondary,
            border: `1px solid ${config.colors.borders}`
          }}
          title="Company creation counter (persisted)"
        >
          Counter: {isLoading ? '...' : counter}
        </div>
      </footer>
    </div>
  );
}
