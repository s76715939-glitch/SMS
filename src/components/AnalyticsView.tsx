import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  Percent,
  Wallet,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { SMSStats, SMSMessage } from '../types';

interface AnalyticsViewProps {
  stats: SMSStats | null;
  transactions: SMSMessage[];
}

export function AnalyticsView({ stats, transactions }: AnalyticsViewProps) {
  const totalCredit = stats?.totalReceivedAmount || 0;
  const totalCount = stats?.totalCount || 0;
  const checkedCount = stats?.checkedCount || 0;
  const uncheckedCount = stats?.uncheckedCount || 0;
  const verificationRate = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  // Provider breakdown
  const providerStats = stats?.providerStats || {};

  // Calculate provider amount breakdown from loaded transactions
  const providerAmounts: Record<string, number> = {};
  for (const t of transactions) {
    const p = t.parsed?.provider || 'General';
    if (t.parsed?.amount && t.parsed?.isCredit !== false) {
      providerAmounts[p] = (providerAmounts[p] || 0) + t.parsed.amount;
    }
  }

  const providers = [
    { name: 'bKash', color: '#E2136E' },
    { name: 'Nagad', color: '#EA580C' },
    { name: 'Rocket', color: '#7E22CE' },
    { name: 'Upay', color: '#0D9488' },
    { name: 'Bank', color: '#2563EB' },
    { name: 'General', color: '#64748B' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Volume & Gateway Analytics
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live metrics on received volume, verification rate, and provider distribution.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">Total Inflow</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2.5 tracking-tight">
            ৳ {totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Across all MFS gateways</p>
        </div>

        {/* Verification Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">Verification Rate</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2.5 tracking-tight">
            {verificationRate}%
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">{checkedCount} verified of {totalCount} total</p>
        </div>

        {/* Verified Count */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-800">
            <span className="font-bold uppercase tracking-wider text-[10px]">Verified Count</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-2.5 tracking-tight">
            {checkedCount}
          </div>
          <p className="text-[11px] text-emerald-700 font-bold mt-1 font-mono">isChecked = true</p>
        </div>

        {/* Pending Count */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-800">
            <span className="font-bold uppercase tracking-wider text-[10px]">Pending Count</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900 mt-2.5 tracking-tight">
            {uncheckedCount}
          </div>
          <p className="text-[11px] text-amber-700 font-bold mt-1 font-mono">isChecked = false</p>
        </div>
      </div>

      {/* Provider Volume Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inflow Amount by Provider */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Inflow Volume by Gateway (BDT)
          </h3>
          <div className="space-y-3.5 pt-1">
            {providers.map((p) => {
              const amount = providerAmounts[p.name] || 0;
              const percent = totalCredit > 0 ? Math.round((amount / totalCredit) * 100) : 0;
              return (
                <div key={p.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 font-bold">{p.name}</span>
                    <span className="font-bold text-slate-900">
                      ৳ {amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-slate-400 font-normal">({percent}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%`, backgroundColor: p.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SMS Count by Provider */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Transaction Count by Gateway
          </h3>
          <div className="space-y-3.5 pt-1">
            {providers.map((p) => {
              const count = providerStats[p.name] || 0;
              const percent = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              return (
                <div key={p.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 font-bold">{p.name}</span>
                    <span className="font-mono text-xs text-slate-600">
                      {count} records <span className="text-slate-400 font-normal">({percent}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%`, backgroundColor: p.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

