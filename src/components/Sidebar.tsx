import {
  ListFilter,
  CheckCircle2,
  Clock,
  Zap,
  Smartphone,
  BarChart3,
  Code2,
  ShieldCheck,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { SMSStats } from '../types';

export type ActiveTab =
  | 'transactions'
  | 'pending'
  | 'verified'
  | 'sandbox'
  | 'analytics'
  | 'webhook'
  | 'apidocs';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  stats: SMSStats | null;
  onOpenTestModal: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  stats,
  onOpenTestModal,
  onRefresh,
  isLoading,
}: SidebarProps) {
  const menuItems = [
    {
      id: 'transactions' as ActiveTab,
      label: 'All Transactions',
      icon: ListFilter,
      badge: stats?.totalCount,
      badgeColor: 'bg-slate-100 text-slate-700 border border-slate-200',
    },
    {
      id: 'pending' as ActiveTab,
      label: 'Pending Verification',
      icon: Clock,
      badge: stats?.uncheckedCount !== undefined ? stats.uncheckedCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border border-amber-200',
    },
    {
      id: 'verified' as ActiveTab,
      label: 'Verified Transactions',
      icon: CheckCircle2,
      badge: stats?.checkedCount !== undefined ? stats.checkedCount : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    },
    {
      id: 'sandbox' as ActiveTab,
      label: 'Payment Verify Sandbox',
      icon: Zap,
      highlight: true,
    },
    {
      id: 'analytics' as ActiveTab,
      label: 'Analytics & Insights',
      icon: BarChart3,
    },
    {
      id: 'webhook' as ActiveTab,
      label: 'Android SMS Forwarder',
      icon: Smartphone,
    },
    {
      id: 'apidocs' as ActiveTab,
      label: 'API Docs & Reference',
      icon: Code2,
    },
  ];

  return (
    <aside className="w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white p-4 sm:p-5 flex flex-col justify-between">
      <div className="space-y-6">
        {/* Gateway branding summary */}
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">Total Received Inflow</span>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-700 transition"
              title="Refresh Stats"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            ৳ {(stats?.totalReceivedAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-emerald-100/70 pt-2.5 text-[11px]">
            <span className="text-slate-600 font-medium">Verified: <strong className="text-emerald-700 font-bold">{stats?.checkedCount || 0}</strong></span>
            <span className="text-slate-600 font-medium">Pending: <strong className="text-amber-700 font-bold">{stats?.uncheckedCount || 0}</strong></span>
          </div>
        </div>

        {/* Navigation links */}
        <div className="space-y-1.5">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  id={`nav-${item.id}`}
                  className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.badgeColor || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && !item.badge && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 border border-emerald-200">
                      LIVE
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick simulator banner */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <CreditCard className="h-4 w-4 text-emerald-600" />
            <span>Test SMS Simulator</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Simulate incoming bKash, Nagad, or Rocket SMS to test parsing & instant auto-verification.
          </p>
          <button
            onClick={onOpenTestModal}
            className="w-full rounded-xl bg-white border border-slate-200 py-2 text-xs font-bold text-slate-800 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white transition active:scale-95 flex items-center justify-center space-x-1.5 shadow-xs"
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>Open Test Sender</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 border-t border-slate-200 pt-3 text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>MongoDB Atlas Real-time</span>
        </div>
        <span className="font-mono text-[10px] text-slate-400 font-semibold">v2.3</span>
      </div>
    </aside>
  );
}

