import { Activity, Database, RefreshCw, Send, ShieldCheck, WifiOff, LogOut } from 'lucide-react';

interface NavbarProps {
  isConnected: boolean;
  dbStatus: { ok: boolean; message: string; ping?: number } | null;
  onRefresh: () => void;
  isLoading: boolean;
  onOpenTestModal: () => void;
  onOpenWebhookGuide: () => void;
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
  onLogout?: () => void;
}

export function Navbar({
  isConnected,
  dbStatus,
  onRefresh,
  isLoading,
  onOpenTestModal,
  onOpenWebhookGuide,
  onLogout,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Left: Brand & Status */}
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
            <Activity className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                PayBridge <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">SMS Webhook</span>
              </h1>
            </div>
            <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
              Real-time Android SMS Gateway & Payment Verifier
            </p>
          </div>
        </div>

        {/* Right: Actions & Real-time badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Live SSE Badge */}
          <div
            className={`flex items-center space-x-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
              isConnected
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}
            title={isConnected ? 'Real-time live stream connected' : 'Connecting to real-time events...'}
          >
            {isConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
                </span>
                <span className="text-[11px] tracking-wide">LIVE SYNC</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-amber-500" />
                <span className="text-[11px]">CONNECTING</span>
              </>
            )}
          </div>

          {/* Database Health Badge */}
          <div
            className={`hidden md:flex items-center space-x-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
              dbStatus?.ok
                ? 'border-slate-200 bg-slate-50 text-slate-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            <Database className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-[11px] font-medium">DB: transactions</span>
            {dbStatus?.ping && (
              <span className="text-[10px] text-slate-400">({dbStatus.ping}ms)</span>
            )}
          </div>

          {/* Webhook URL / Android Setup Button */}
          <button
            onClick={onOpenWebhookGuide}
            className="inline-flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 shadow-xs"
            id="btn-webhook-guide"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Webhook Guide</span>
          </button>

          {/* Test Sender / Simulator Modal */}
          <button
            onClick={onOpenTestModal}
            className="inline-flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-700 active:scale-95"
            id="btn-test-sender"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Test SMS API</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 active:scale-95 shadow-xs"
            title="Refresh list"
            id="btn-refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 active:scale-95 shadow-xs"
              title="Sign Out"
              id="btn-logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

