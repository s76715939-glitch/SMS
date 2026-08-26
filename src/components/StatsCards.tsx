import { ArrowDownLeft, CheckCircle2, Clock, MessageSquare, TrendingUp } from 'lucide-react';
import { SMSStats } from '../types';

interface StatsCardsProps {
  stats: SMSStats | null;
  selectedProvider: string;
  onSelectProvider: (provider: string) => void;
}

export function StatsCards({ stats, selectedProvider, onSelectProvider }: StatsCardsProps) {
  const totalCount = stats?.totalCount || 0;
  const todayCount = stats?.todayCount || 0;
  const creditAmount = stats?.totalReceivedAmount || 0;
  const checkedCount = stats?.checkedCount || 0;
  const uncheckedCount = stats?.uncheckedCount || 0;
  const providers = stats?.providerStats || {};

  const formatCurrency = (amount: number) => {
    return `৳ ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const verificationRate = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {/* Total Inflow */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Inflow</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              {formatCurrency(creditAmount)}
            </span>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Sum of received payments</div>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total SMS</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">{totalCount}</span>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              +{todayCount} today
            </span>
          </div>
        </div>

        {/* Verified / Checked */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Verified</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-xl font-black tracking-tight text-emerald-700 sm:text-2xl">{checkedCount}</span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono">{verificationRate}% Rate</span>
          </div>
        </div>

        {/* Pending / Unchecked */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-xl font-black tracking-tight text-amber-700 sm:text-2xl">{uncheckedCount}</span>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-mono">Needs Action</span>
          </div>
        </div>
      </div>

      {/* Provider Quick Filter Badges */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">Gateway:</span>
        <button
          onClick={() => onSelectProvider('all')}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-xs ${
            selectedProvider === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          All Services ({totalCount})
        </button>

        {Object.entries(providers).map(([providerName, count]) => {
          const isSelected = selectedProvider === providerName;

          let badgeClasses = 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50';

          if (providerName.toLowerCase() === 'bkash') {
            badgeClasses = isSelected
              ? 'bg-[#E2136E] text-white border-[#E2136E] font-bold'
              : 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100 font-semibold';
          } else if (providerName.toLowerCase() === 'nagad') {
            badgeClasses = isSelected
              ? 'bg-[#EA580C] text-white border-[#EA580C] font-bold'
              : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 font-semibold';
          } else if (providerName.toLowerCase() === 'rocket') {
            badgeClasses = isSelected
              ? 'bg-[#7E22CE] text-white border-[#7E22CE] font-bold'
              : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 font-semibold';
          } else if (providerName.toLowerCase() === 'bank') {
            badgeClasses = isSelected
              ? 'bg-[#2563EB] text-white border-[#2563EB] font-bold'
              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-semibold';
          } else {
            badgeClasses = isSelected
              ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-semibold';
          }

          return (
            <button
              key={providerName}
              onClick={() => onSelectProvider(providerName)}
              className={`rounded-xl px-3 py-1.5 text-xs transition flex items-center space-x-1.5 shadow-xs border ${badgeClasses}`}
            >
              <span>{providerName}</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold font-mono ${isSelected ? 'bg-white/25 text-white' : 'bg-slate-200/70 text-slate-700'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

