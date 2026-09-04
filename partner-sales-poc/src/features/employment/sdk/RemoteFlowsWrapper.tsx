import type { ReactNode } from 'react';
import { RemoteFlows as RemoteFlowsProvider } from '@remoteoss/remote-flows';
import '@remoteoss/remote-flows/styles.css';

// Host for the remote-flows SDK.
//
// Transport: we pass `proxy`, NOT `environment`. With `environment` the SDK
// calls the gateway straight from the browser (for local that is
// http://localhost:4000/api/eor), which is cross-origin from the POC on :3002
// and puts the access token in page JS. With `proxy` it calls same-origin
// /v1/... and our Express server attaches the token — the rule AGENTS.md
// states, and what the GP demo already did.
//
//   Browser ──/v1/*──► Express (:3002) ──► Remote Gateway
//                          └─ attaches partner | session | customer token
//
// Token choice: the SDK's proxy headers are fixed at mount, so it cannot flip
// a header mid-flow. We therefore decide once, here, from the session — and
// the server honours it per request (see getAuthType in server/api/proxy.js).
// `useSessionToken` must be true whenever a company was created live, or the
// employment is created under the .env company instead, silently.

interface RemoteFlowsWrapperProps {
  children: ReactNode;
  /** True once a company exists in server/session.json — routes SDK calls to that company's token. */
  useSessionToken?: boolean;
}

export function RemoteFlowsWrapper({
  children,
  useSessionToken = false,
}: RemoteFlowsWrapperProps) {
  const proxy = {
    url: window.location.origin,
    ...(useSessionToken ? { headers: { 'x-use-session-token': 'true' } } : {}),
  };

  return (
    <RemoteFlowsProvider
      proxy={proxy}
      debug
      errorBoundary={{
        useParentErrorBoundary: false,
        fallback: (error) => (
          <div className="p-4 text-center">
            <p className="text-error text-sm">Something went wrong: {error.message}</p>
          </div>
        ),
      }}
    >
      {children}
    </RemoteFlowsProvider>
  );
}
