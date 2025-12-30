import { ReactNode } from 'react';
import {
  RemoteFlows as RemoteFlowsProvider,
} from '@remoteoss/remote-flows';
import { defaultComponents } from '@remoteoss/remote-flows/default-components';
import '@remoteoss/remote-flows/styles.css';

interface RemoteFlowsWrapperProps {
  children: ReactNode;
}

const fetchToken = async () => {
  const response = await fetch('/api/fetch-customer-token');
  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
};

export function RemoteFlowsWrapper({ children }: RemoteFlowsWrapperProps) {
  const environment = (import.meta.env.VITE_REMOTE_GATEWAY as 'partners' | 'sandbox' | 'production') || 'partners';

  return (
    <RemoteFlowsProvider
      auth={fetchToken}
      environment={environment}
      components={defaultComponents}
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

