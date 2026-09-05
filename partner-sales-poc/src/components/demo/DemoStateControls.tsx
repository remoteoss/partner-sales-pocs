import { useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { useSession } from '../../features/company/hooks';
import { useDemoActivation } from '../../hooks/useDemoActivation';

// The demo's three states, and the controls for moving between them.
//
// Shared by every partner chrome (WFN header, HiBob shell) so the driver of the
// demo always has the same affordance in the same place. It lived inside
// Header.tsx originally, which is why the HiBob shell had no way to reset.
//
//   discovery  ── activate ──►  activation  ── create company ──►  hiring
//       ▲                                                            │
//       └──────────────── Reset Demo (clears session) ───────────────┘
//
// State is DERIVED, never stored:
//   session.company_id present  → hiring      (a real company exists in Tiger)
//   localStorage flag set       → activation  (partner has "switched EOR on")
//   neither                     → discovery
//
// Only backwards moves are clickable. You cannot click into Hiring, because
// Hiring means a company genuinely exists — faking it would show an activated
// UI whose magic links all fail, which is TODOS.md item 2.

export type DemoState = 'discovery' | 'activation' | 'hiring';

export function useDemoState(): DemoState {
  const { data: session } = useSession();
  const { isActivated } = useDemoActivation();
  if (session?.company_id) return 'hiring';
  if (isActivated) return 'activation';
  return 'discovery';
}

interface Props {
  /** 'wfn' matches ADP's dense square chrome; 'pill' matches HiBob's rounded chrome. */
  variant?: 'wfn' | 'pill';
}

export function DemoStateControls({ variant = 'wfn' }: Props) {
  const queryClient = useQueryClient();
  const { activate, deactivate } = useDemoActivation();
  const state = useDemoState();

  const gotoDiscovery = async () => {
    deactivate();
    await fetch('/api/session', { method: 'DELETE' });
    await fetch('/api/counter/increment', { method: 'POST' });
    await queryClient.invalidateQueries({ queryKey: ['session'] });
    await queryClient.invalidateQueries({ queryKey: ['counter'] });
  };

  const gotoActivation = async () => {
    activate();
    await queryClient.invalidateQueries({ queryKey: ['session'] });
  };

  const segments: Array<{ key: DemoState; label: string }> = [
    { key: 'discovery', label: 'Discovery' },
    { key: 'activation', label: 'Activation' },
    { key: 'hiring', label: 'Hiring' },
  ];

  const segmentProps = (key: DemoState) => {
    if (key === state) return { disabled: true, onClick: undefined, title: 'Current state' };
    if (key === 'discovery') {
      return { disabled: false, onClick: gotoDiscovery, title: 'Reset to Discovery' };
    }
    if (key === 'activation') {
      if (state === 'hiring') {
        return { disabled: true, onClick: undefined, title: 'Click Discovery first to leave Hiring' };
      }
      return { disabled: false, onClick: gotoActivation, title: 'Simulate post-sales activation' };
    }
    return { disabled: true, onClick: undefined, title: 'Register a company to enter Hiring' };
  };

  const pill = variant === 'pill';
  const groupCls = pill
    ? 'flex items-center gap-0.5 p-0.5 rounded-full border border-border bg-surface'
    : 'flex items-center gap-0.5 p-0.5 rounded-sm border border-border bg-tertiary';
  const segCls = (current: boolean, disabled: boolean) =>
    [
      pill
        ? 'px-3 py-1 text-[10px] font-semibold tracking-wide rounded-full transition-colors'
        : 'px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-[3px] transition-colors',
      current
        ? 'bg-primary text-white'
        : disabled
          ? 'text-input cursor-not-allowed'
          : 'text-secondary hover:bg-background hover:text-foreground',
    ].join(' ');
  const resetCls = pill
    ? 'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full border border-border text-secondary hover:bg-surface hover:text-foreground transition-colors'
    : 'flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold tracking-wide uppercase border border-border text-secondary hover:bg-tertiary hover:text-foreground hover:border-input rounded-sm transition-colors';

  return (
    <div className="flex items-center gap-2">
      <div className={groupCls} role="group" aria-label="Demo state">
        {segments.map((seg) => {
          const current = seg.key === state;
          const { disabled, onClick, title } = segmentProps(seg.key);
          return (
            <button
              key={seg.key}
              type="button"
              onClick={onClick}
              disabled={disabled && !current}
              aria-pressed={current}
              title={title}
              className={segCls(current, disabled)}
            >
              {seg.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={gotoDiscovery}
        className={resetCls}
        title="Clear the activated session and return to Discovery"
      >
        <RotateCcw size={12} />
        Reset
      </button>
    </div>
  );
}
