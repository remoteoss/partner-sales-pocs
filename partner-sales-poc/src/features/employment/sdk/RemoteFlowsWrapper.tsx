import type { ReactNode } from 'react';
import {
  RemoteFlows as RemoteFlowsProvider,
} from '@remoteoss/remote-flows';
import '@remoteoss/remote-flows/styles.css';

interface RemoteFlowsWrapperProps {
  children: ReactNode;
  useSessionToken?: boolean; // If true, use session token from newly created company
}

// Fetch token from .env credentials (default behavior)
const fetchEnvToken = async () => {
  const response = await fetch('/api/fetch-customer-token');
  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
};

// Fetch token from session (newly created company)
const fetchSessionToken = async () => {
  const response = await fetch('/api/session/token');
  if (!response.ok) {
    console.warn('Session token not available, falling back to env token');
    return fetchEnvToken();
  }
  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
};

export function RemoteFlowsWrapper({ children, useSessionToken = false }: RemoteFlowsWrapperProps) {
  const environment = (import.meta.env.VITE_REMOTE_GATEWAY as 'partners' | 'sandbox' | 'production') || 'partners';

  // Choose token source based on prop
  const fetchToken = useSessionToken ? fetchSessionToken : fetchEnvToken;

  return (
    <RemoteFlowsProvider
      auth={fetchToken}
      environment={environment}
      debug
      errorBoundary={{
        useParentErrorBoundary: false,
        fallback: (error) => (
          <div className="p-4 text-center">
            <p className="text-red-500">Something went wrong: {error.message}</p>
          </div>
        ),
      }}
    >
      {children}
    </RemoteFlowsProvider>
  );
}
