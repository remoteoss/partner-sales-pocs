import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Plus,
  Bookmark,
  Home as HomeIcon,
  Sparkles,
  BarChart3,
  Grid3x3,
  Settings,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  RotateCcw,
} from 'lucide-react';
import config from '../../config/partner';
import { useSession } from '../../features/company/hooks';
import { useDemoActivation } from '../../hooks/useDemoActivation';

type DemoState = 'discovery' | 'activation' | 'hiring';

interface SidebarItem {
  label: string;
  active?: boolean;
  expanded?: boolean;
  children?: { label: string; active?: boolean }[];
}

const SIDEBAR: SidebarItem[] = [
  { label: 'Accounting' },
  { label: 'Expenses & Bills' },
  { label: 'Sales & Get Paid' },
  { label: 'Customer Hub' },
  {
    label: 'Payroll',
    expanded: true,
    children: [
      { label: 'Overview' },
      { label: 'Employees', active: true },
      { label: 'Contractors' },
      { label: 'Payroll taxes' },
      { label: 'Benefits' },
      { label: 'HR advisor' },
      { label: 'Compliance' },
    ],
  },
  { label: 'Team' },
  { label: 'Projects' },
  { label: 'Inventory' },
];

const RAIL_ITEMS = [
  { Icon: Briefcase, label: 'My menu' },
  { Icon: Plus, label: 'Create', accent: true },
  { Icon: Bookmark, label: 'Bookmarks' },
  { Icon: HomeIcon, label: 'Home' },
  { Icon: Sparkles, label: 'Feed' },
  { Icon: BarChart3, label: 'Reports' },
  { Icon: Grid3x3, label: 'My apps' },
  { Icon: Settings, label: 'Customize' },
];

export function QuickBooksShell() {
  return (
    <div className="flex min-h-screen bg-white text-[#1F2937]">
      <IconRail />
      <InnerSidebar />
      <div className="flex-1 flex flex-col relative min-w-0">
        <TopUtilityBar />
        <main className="flex-1 px-8 pt-6 pb-12">
          <Outlet />
        </main>
        <FeedbackRail />
        <DemoStatePill />
      </div>
    </div>
  );
}

function IconRail() {
  return (
    <nav
      aria-label="Primary"
      className="w-14 shrink-0 bg-[#F4F5F8] border-r border-[#E5E7EB] flex flex-col items-center py-3 gap-1"
    >
      {RAIL_ITEMS.map(({ Icon, label, accent }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          className="group w-12 flex flex-col items-center gap-0.5 py-1.5 rounded-sm hover:bg-white transition-colors"
        >
          <span
            className={`w-9 h-9 flex items-center justify-center rounded-full ${
              accent ? 'bg-[#2CA01C] text-white' : 'text-[#1F2937]'
            }`}
          >
            <Icon size={18} strokeWidth={1.75} />
          </span>
          <span className="text-[10px] leading-tight text-center text-[#1F2937] max-w-[52px] truncate">
            {label}
          </span>
        </button>
      ))}

      <div className="mt-2 flex flex-col items-center gap-0.5">
        <span className="text-[9px] uppercase tracking-wider text-[#6B7280] mt-3">PINNED</span>
        <button
          type="button"
          aria-label="More pinned"
          className="w-9 h-9 flex items-center justify-center text-[#6B7280] hover:bg-white rounded-full transition-colors"
        >
          <MoreHorizontal size={18} />
        </button>
        <button
          type="button"
          aria-label="Customize"
          className="w-9 h-9 flex items-center justify-center text-[#6B7280] hover:bg-white rounded-full transition-colors"
        >
          <Settings size={18} />
        </button>
      </div>
    </nav>
  );
}

function InnerSidebar() {
  const [collapsedTop, setCollapsedTop] = useState(false);

  return (
    <aside
      aria-label="My apps"
      className="w-56 shrink-0 bg-white border-r border-[#E5E7EB] py-4 px-3"
    >
      <button
        type="button"
        onClick={() => setCollapsedTop((v) => !v)}
        className="flex items-center justify-between w-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] hover:text-[#1F2937]"
      >
        <span>My apps</span>
        <ChevronDown size={14} className={collapsedTop ? '-rotate-90 transition-transform' : 'transition-transform'} />
      </button>
      <ul role="tree" className="mt-1 space-y-0.5">
        {SIDEBAR.map((item) => (
          <SidebarRow key={item.label} item={item} />
        ))}
      </ul>
    </aside>
  );
}

function SidebarRow({ item }: { item: SidebarItem }) {
  const hasChildren = !!item.children?.length;
  return (
    <li role={hasChildren ? 'group' : 'treeitem'}>
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm cursor-pointer ${
          item.active ? 'bg-[#E5E7EB] text-[#111827] font-medium' : 'text-[#1F2937] hover:bg-[#F3F4F6]'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-[#2CA01C] shrink-0" aria-hidden />
        <span className="flex-1">{item.label}</span>
        {hasChildren && (
          item.expanded ? <ChevronDown size={14} className="text-[#6B7280]" /> : <ChevronRight size={14} className="text-[#6B7280]" />
        )}
      </div>
      {hasChildren && item.expanded && (
        <ul className="mt-0.5 ml-4 space-y-0.5">
          {item.children!.map((child) => (
            <li key={child.label} role="treeitem" aria-current={child.active ? 'page' : undefined}>
              <div
                className={`px-2 py-1 rounded-sm text-sm cursor-pointer ${
                  child.active
                    ? 'bg-[#E5E7EB] text-[#111827] font-medium'
                    : 'text-[#1F2937] hover:bg-[#F3F4F6]'
                }`}
              >
                {child.label}
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function TopUtilityBar() {
  const [privacy, setPrivacy] = useState(false);
  return (
    <div className="h-14 px-8 flex items-center justify-between border-b border-[#E5E7EB] bg-white">
      <img src={config.logo.src} alt={config.logo.alt} className="h-6" />
      <label className="flex items-center gap-2 text-xs text-[#6B7280] cursor-pointer select-none">
        <span>Privacy</span>
        <span
          role="switch"
          aria-checked={privacy}
          tabIndex={0}
          onClick={() => setPrivacy((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              setPrivacy((v) => !v);
            }
          }}
          className={`w-7 h-4 rounded-full relative transition-colors ${
            privacy ? 'bg-[#2CA01C]' : 'bg-[#D1D5DB]'
          }`}
        >
          <span
            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${
              privacy ? 'left-3.5' : 'left-0.5'
            }`}
          />
        </span>
      </label>
    </div>
  );
}

function FeedbackRail() {
  return (
    <button
      type="button"
      aria-label="Feedback"
      className="fixed right-0 top-1/2 -translate-y-1/2 bg-[#2CA01C] text-white text-xs font-medium px-2 py-3 rounded-l-sm tracking-wide [writing-mode:vertical-rl] rotate-180 hover:bg-[#248A18] transition-colors z-10"
    >
      Feedback
    </button>
  );
}

function DemoStatePill() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { isActivated, activate, deactivate } = useDemoActivation();

  const demoState: DemoState = session?.company_id
    ? 'hiring'
    : isActivated
    ? 'activation'
    : 'discovery';

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
    if (key === demoState) return { disabled: true, title: 'Current state' };
    if (key === 'discovery') return { disabled: false, onClick: gotoDiscovery, title: 'Reset to Discovery' };
    if (key === 'activation') {
      if (demoState === 'hiring') return { disabled: true, title: 'Click Discovery first to leave Hiring' };
      return { disabled: false, onClick: gotoActivation, title: 'Simulate post-sales activation' };
    }
    return { disabled: true, title: 'Register a company to enter Hiring' };
  };

  return (
    <div
      role="group"
      aria-label="Demo state — sales tooling"
      className="fixed bottom-4 left-[72px] flex items-center gap-2 bg-[#1F2937] text-white px-2 py-1.5 rounded-md shadow-lg z-20"
    >
      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#2CA01C] text-white px-1.5 py-0.5 rounded-sm">
        DEMO
      </span>
      <div className="flex items-center gap-0.5 p-0.5 rounded bg-white/10">
        {segments.map((seg) => {
          const current = seg.key === demoState;
          const { disabled, onClick, title } = segmentProps(seg.key);
          return (
            <button
              key={seg.key}
              type="button"
              onClick={onClick}
              disabled={disabled && !current}
              aria-pressed={current}
              title={title}
              className={`px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase rounded transition-colors ${
                current
                  ? 'bg-white text-[#1F2937]'
                  : disabled
                  ? 'text-white/40 cursor-not-allowed'
                  : 'text-white/80 hover:bg-white/15 hover:text-white'
              }`}
            >
              {seg.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={gotoDiscovery}
        className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide border border-white/30 rounded hover:bg-white/10"
        title="Clear the activated session and return to Discovery"
      >
        <RotateCcw size={10} /> Reset
      </button>
    </div>
  );
}
