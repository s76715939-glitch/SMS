import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Trash2,
  Eye,
  ArrowDownLeft,
  ArrowUpRight,
  Phone,
  Hash,
  X,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
  LayoutGrid,
  List,
  ExternalLink,
} from 'lucide-react';
import { SMSMessage } from '../types';

interface TransactionTableProps {
  transactions: SMSMessage[];
  isLoading: boolean;
  onToggleCheck: (id: string, currentStatus: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onViewDetails: (tx: SMSMessage) => void;
  onQuickVerify: (trxId: string, amount?: number) => void;
}

export function TransactionTable({
  transactions,
  isLoading,
  onToggleCheck,
  onDelete,
  onViewDetails,
  onQuickVerify,
}: TransactionTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Provider badge design
  const getProviderStyle = (provider?: string) => {
    const p = provider?.toLowerCase() || '';
    if (p.includes('bkash')) {
      return {
        badge: 'bg-pink-50 border-pink-200 text-pink-700 font-bold',
        dot: 'bg-[#E2136E]',
        name: 'bKash',
      };
    }
    if (p.includes('nagad')) {
      return {
        badge: 'bg-orange-50 border-orange-200 text-orange-800 font-bold',
        dot: 'bg-[#EA580C]',
        name: 'Nagad',
      };
    }
    if (p.includes('rocket') || p === '16216') {
      return {
        badge: 'bg-purple-50 border-purple-200 text-purple-800 font-bold',
        dot: 'bg-[#7E22CE]',
        name: 'Rocket',
      };
    }
    if (p.includes('upay')) {
      return {
        badge: 'bg-teal-50 border-teal-200 text-teal-800 font-bold',
        dot: 'bg-[#0D9488]',
        name: 'Upay',
      };
    }
    if (p.includes('bank') || p.includes('city') || p.includes('ebl') || p.includes('brac')) {
      return {
        badge: 'bg-blue-50 border-blue-200 text-blue-800 font-bold',
        dot: 'bg-[#2563EB]',
        name: provider || 'Bank A/C',
      };
    }
    return {
      badge: 'bg-slate-100 border-slate-200 text-slate-700 font-semibold',
      dot: 'bg-slate-400',
      name: provider || 'Gateway',
    };
  };

  const formatDate = (isoOrTimestamp: string | number) => {
    try {
      const d = new Date(isoOrTimestamp);
      if (isNaN(d.getTime())) return String(isoOrTimestamp);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(isoOrTimestamp);
    }
  };

  const formatTime = (isoOrTimestamp: string | number) => {
    try {
      const d = new Date(isoOrTimestamp);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  const exportToCSV = () => {
    if (!transactions.length) return;
    const headers = [
      'Status (isChecked)',
      'Provider',
      'Sender',
      'Customer Mobile',
      'Amount (BDT)',
      'TrxID',
      'Type',
      'Received Date',
      'Received Time',
      'Verified At',
      'Verified By',
      'Raw SMS',
    ];
    const rows = transactions.map((t) => [
      t.isChecked ? 'VERIFIED' : 'PENDING',
      t.parsed?.provider || 'General',
      t.sender,
      t.parsed?.mobileNumber || t.parsed?.counterparty || 'N/A',
      t.parsed?.amount || '0',
      t.parsed?.trxId || 'N/A',
      t.parsed?.type || 'Information',
      formatDate(t.receivedAt || t.timestamp),
      formatTime(t.receivedAt || t.timestamp),
      t.verifiedAt ? new Date(t.verifiedAt).toLocaleString() : 'N/A',
      t.verifiedBy || 'N/A',
      `"${(t.massage || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `paybridge_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent mb-3" />
        <p className="text-sm font-bold text-slate-800">Loading live transactions...</p>
        <p className="text-xs text-slate-500 mt-0.5">Fetching records from MongoDB cluster</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No Transactions Found</h3>
        <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
          No records match your active filters. Try clicking "Seed Sample SMS Data" above or adjust your search parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Table Top Bar: Actions & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center space-x-2.5">
          <span className="text-xs font-bold text-slate-700">
            Total Records: <strong className="text-slate-900 font-extrabold">{transactions.length}</strong>
          </span>
          <span className="inline-block h-3 w-px bg-slate-300" />
          <span className="text-xs text-slate-500 font-medium">
            Live Stream Feed
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 shadow-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
          </div>

          {/* Export to CSV */}
          <button
            onClick={exportToCSV}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition active:scale-95 shadow-xs"
            title="Export transactions to CSV file"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Grid View Mode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transactions.map((tx) => {
            const { _id, sender, isChecked, receivedAt, timestamp, parsed, massage } = tx;
            const { provider, amount, trxId, mobileNumber, counterparty, type, isCredit } = parsed || {};
            const providerStyle = getProviderStyle(provider);
            const displayPhone = mobileNumber || counterparty;

            return (
              <div
                key={_id}
                onClick={() => onViewDetails(tx)}
                className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer space-y-3"
              >
                {/* Card Header: Provider + Status */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center space-x-1.5 rounded-lg border px-2.5 py-0.5 text-xs ${providerStyle.badge}`}>
                    <span className={`h-2 w-2 rounded-full ${providerStyle.dot}`} />
                    <span>{providerStyle.name}</span>
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCheck(_id, isChecked);
                    }}
                    className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border transition ${
                      isChecked
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {isChecked ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <Clock className="h-3 w-3 text-amber-600" />}
                    <span>{isChecked ? 'Verified' : 'Pending'}</span>
                  </button>
                </div>

                {/* Amount & Type */}
                <div className="flex items-baseline justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Amount</span>
                    <div className="text-xl font-black text-slate-900 tracking-tight">
                      ৳ {amount !== null && amount !== undefined ? amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                    </div>
                  </div>

                  <span className={`inline-flex items-center space-x-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                    isCredit === true
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isCredit === false
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {isCredit === true ? <ArrowDownLeft className="h-3 w-3 text-emerald-600" /> : <ArrowUpRight className="h-3 w-3 text-rose-600" />}
                    <span>{type || 'General'}</span>
                  </span>
                </div>

                {/* Key Metadata: TrxID & Customer */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">TrxID:</span>
                    {trxId ? (
                      <div className="flex items-center space-x-1">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {trxId}
                        </span>
                        <button
                          onClick={(e) => handleCopy(trxId, `trx-${_id}`, e)}
                          className="rounded p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                        >
                          {copiedId === `trx-${_id}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">None</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Customer:</span>
                    {displayPhone ? (
                      <div className="flex items-center space-x-1">
                        <span className="font-mono font-bold text-slate-700">{displayPhone}</span>
                        <button
                          onClick={(e) => handleCopy(displayPhone, `phone-${_id}`, e)}
                          className="rounded p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                        >
                          {copiedId === `phone-${_id}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">N/A</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Time:</span>
                    <span>{formatDate(receivedAt || timestamp)} {formatTime(receivedAt || timestamp)}</span>
                  </div>
                </div>

                {/* Card Footer: Quick Actions */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2.5" onClick={(e) => e.stopPropagation()}>
                  {trxId && !isChecked ? (
                    <button
                      onClick={() => onQuickVerify(trxId, amount || undefined)}
                      className="inline-flex items-center space-x-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-600 hover:text-white transition active:scale-95"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Verify Now</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onViewDetails(tx)}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Details</span>
                    </button>
                  )}

                  <div className="flex items-center space-x-1">
                    {deleteConfirmId === _id ? (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onDelete(_id)}
                          className="rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs hover:bg-rose-700"
                        >
                          Delete?
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="rounded-md bg-slate-100 p-0.5 text-slate-600 hover:bg-slate-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(_id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Delete Record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Structured Responsive Table View */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              {/* Table Header */}
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 pl-4 pr-3">Status</th>
                  <th className="py-3.5 px-3">Gateway / Provider</th>
                  <th className="py-3.5 px-3">Customer Phone</th>
                  <th className="py-3.5 px-3">Amount (BDT)</th>
                  <th className="py-3.5 px-3">TrxID</th>
                  <th className="py-3.5 px-3">Type</th>
                  <th className="py-3.5 px-3">Date & Time</th>
                  <th className="py-3.5 pl-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const { _id, sender, isChecked, receivedAt, timestamp, parsed } = tx;
                  const { provider, amount, trxId, mobileNumber, counterparty, type, isCredit } = parsed || {};
                  const providerStyle = getProviderStyle(provider);
                  const displayPhone = mobileNumber || counterparty;

                  return (
                    <tr
                      key={_id}
                      className="group transition-colors hover:bg-slate-50/80 cursor-pointer"
                      onClick={() => onViewDetails(tx)}
                    >
                      {/* 1. Status / isChecked */}
                      <td className="py-3.5 pl-4 pr-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onToggleCheck(_id, isChecked)}
                          className={`inline-flex items-center space-x-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide transition-all border shadow-xs ${
                            isChecked
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                          }`}
                          title={isChecked ? 'Verified! Click to mark as Pending' : 'Pending! Click to mark as Verified'}
                        >
                          {isChecked ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Verified (True)</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-3.5 w-3.5 text-amber-600" />
                              <span>Pending (False)</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* 2. Provider & Sender */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center space-x-1.5 rounded-lg border px-2 py-0.5 text-[11px] ${providerStyle.badge}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${providerStyle.dot}`} />
                            <span>{providerStyle.name}</span>
                          </span>
                          {sender && sender.toLowerCase() !== provider?.toLowerCase() && (
                            <span className="text-[10px] text-slate-400 font-mono">({sender})</span>
                          )}
                        </div>
                      </td>

                      {/* 3. Customer Mobile Number */}
                      <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                        {displayPhone ? (
                          <div className="flex items-center space-x-1.5">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span className="font-mono font-bold text-slate-800">{displayPhone}</span>
                            <button
                              onClick={(e) => handleCopy(displayPhone, `phone-${_id}`, e)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
                              title="Copy Phone Number"
                            >
                              {copiedId === `phone-${_id}` ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">N/A</span>
                        )}
                      </td>

                      {/* 4. Amount */}
                      <td className="py-3.5 px-3">
                        {amount !== null && amount !== undefined ? (
                          <span
                            className={`text-sm font-black tracking-tight ${
                              isCredit === false ? 'text-rose-600' : 'text-slate-900'
                            }`}
                          >
                            ৳ {amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">N/A</span>
                        )}
                      </td>

                      {/* 5. TrxID */}
                      <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                        {trxId ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-bold tracking-wider text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-[11px]">
                              {trxId}
                            </span>
                            <button
                              onClick={(e) => handleCopy(trxId, `trx-${_id}`, e)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
                              title="Copy TrxID"
                            >
                              {copiedId === `trx-${_id}` ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono italic">No TrxID</span>
                        )}
                      </td>

                      {/* 6. Type (IN vs OUT) */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center space-x-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            isCredit === true
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isCredit === false
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isCredit === true ? (
                            <ArrowDownLeft className="h-3 w-3 text-emerald-600" />
                          ) : isCredit === false ? (
                            <ArrowUpRight className="h-3 w-3 text-rose-600" />
                          ) : null}
                          <span>{type || 'Transaction'}</span>
                        </span>
                      </td>

                      {/* 7. Date & Time */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="text-[11px] font-bold text-slate-800">
                          {formatDate(receivedAt || timestamp)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {formatTime(receivedAt || timestamp)}
                        </div>
                      </td>

                      {/* 8. Actions */}
                      <td className="py-3.5 pl-3 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Quick Sandbox Verify Button */}
                          {trxId && !isChecked && (
                            <button
                              onClick={() => onQuickVerify(trxId, amount || undefined)}
                              className="inline-flex items-center space-x-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-600 hover:text-white transition active:scale-95 shadow-xs"
                              title="Verify using API Sandbox"
                            >
                              <ShieldCheck className="h-3 w-3" />
                              <span>Verify</span>
                            </button>
                          )}

                          {/* View Details */}
                          <button
                            onClick={() => onViewDetails(tx)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                            title="View Full Details / Raw SMS"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete with 2-step confirm */}
                          {deleteConfirmId === _id ? (
                            <div className="flex items-center space-x-1 animate-in fade-in duration-200">
                              <button
                                onClick={() => onDelete(_id)}
                                className="rounded-md bg-rose-600 px-2 py-1 text-[10px] font-bold text-white shadow-xs hover:bg-rose-700 active:scale-95"
                                title="Confirm Delete"
                              >
                                Delete?
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="rounded-md bg-slate-100 p-1 text-xs text-slate-600 hover:bg-slate-200"
                                title="Cancel"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(_id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                              title="Delete Transaction"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

