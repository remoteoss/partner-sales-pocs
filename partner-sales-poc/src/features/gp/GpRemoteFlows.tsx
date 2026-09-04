import type { ReactNode } from 'react';
import { RemoteFlows } from '@remoteoss/remote-flows';
import { defaultComponents } from '@remoteoss/remote-flows/default-components';
import '@remoteoss/remote-flows/styles.css';

// GP SDK provider. We use the server-side-token proxy pattern: no auth callback
// on the FE (the POC server mints the JWTs), so we pass `proxy` and omit `auth`.
// When `employmentId` is set, the proxy header routes /v1/employee/* calls to an
// employee-scoped token (see server/api/gp-proxy.js).

const ENV = (import.meta.env.VITE_REMOTE_GATEWAY as string) || 'sandbox';

interface Props {
  children: ReactNode;
  employmentId?: string;
}

export function GpRemoteFlows({ children, employmentId }: Props) {
  const proxy = employmentId
    ? { url: window.location.origin, headers: { 'x-rf-employment-id': employmentId } }
    : { url: window.location.origin };

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <RemoteFlows environment={ENV as any} proxy={proxy} components={defaultComponents}>
      {children}
    </RemoteFlows>
  );
}
