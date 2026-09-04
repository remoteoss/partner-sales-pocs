import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { NewHirePage } from './pages/NewHirePage';
import { CreateCompanyPage } from './pages/CreateCompanyPage';
import { GlobalPayrollAdminPage } from './pages/GlobalPayrollAdminPage';
import { GlobalPayrollEmployeePage } from './pages/GlobalPayrollEmployeePage';
import { GlobalPayrollPayRunsPage } from './pages/GlobalPayrollPayRunsPage';
import config from './config/partner';

const isHiBob = config.chrome === 'hibob';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function App() {
  useEffect(() => {
    document.title = `${config.company.name} ${config.productName}`;
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon) favicon.href = config.logo.src;

    const root = document.documentElement;
    const map: Record<string, string> = {
      '--color-primary': config.colors.primary,
      '--color-primary-hover': config.colors.primaryHover,
      '--color-secondary': config.colors.secondary,
      '--color-tertiary': config.colors.tertiary,
      '--color-accent': config.colors.accent,
      '--color-accent-hover': config.colors.accentHover,
      '--color-error': config.colors.error,
      '--color-success': config.colors.success,
      '--color-border': config.colors.borders,
      '--color-input': config.colors.input,
      '--color-background': config.colors.background,
      '--color-surface': config.colors.surface,
      '--color-foreground': config.colors.foreground,
    };
    for (const [name, value] of Object.entries(map)) {
      root.style.setProperty(name, value);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route
              index
              element={isHiBob ? <Navigate to="/gp/admin" replace /> : <HomePage />}
            />
            <Route path="new-hire" element={<NewHirePage />} />
            <Route path="create-company" element={<CreateCompanyPage />} />
            <Route path="gp/admin" element={<GlobalPayrollAdminPage />} />
            <Route path="gp/pay-runs" element={<GlobalPayrollPayRunsPage />} />
            <Route path="gp/employee" element={<GlobalPayrollEmployeePage />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
