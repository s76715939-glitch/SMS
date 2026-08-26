import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  Copy,
  Hash,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { SMSMessage } from '../types';

export interface MessageCardProps {
  key?: string | number;
  message: SMSMessage;
  onDelete: (id: string) => void;
  onViewJson: (msg: SMSMessage) => void;
}

export function MessageCard({ message, onDelete, onViewJson }: MessageCardProps) {
  const [copiedTrx, setCopiedTrx] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { sender, massage, receivedAt, timestamp, parsed, _id } = message;
  const { provider, type, amount, trxId, balance, fee, counterparty, isCredit } = parsed || {};

  const handleCopyTrx = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!trxId) return;
    navigator.clipboard.writeText(trxId);
    setCopiedTrx(true);
    setTimeout(() => setCopiedTrx(false), 2000);
  };

  const handleCopyBody = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(massage || '');
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  // Format date
  const dateObj = new Date(receivedAt || (typeof timestamp === 'number' ? timestamp : Date.now()));
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  // Provider Styling
  const getProviderBadge = () => {
    switch (provider?.toLowerCase()) {
      case 'bkash':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'nagad':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'rocket':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'upay':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'bank':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'otp':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amt)
      .replace('BDT', '৳');
  };

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-slate-300 hover:shadow-md">
      {/* Top row: Badges, Amount, Timestamp */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Left Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Provider */}
          <span
            className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-bold ${getProviderBadge()}`}
          >
            {provider || 'SMS'}
          </span>

          {/* Type Badge */}
          <span
            className={`inline-flex items-center space-x-1 rounded-lg border px-2 py-0.5 text-xs font-bold ${
              isCredit === true
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : isCredit === false
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-slate-200 bg-slate-100 text-slate-700'
            }`}
          >
            {isCredit === true && <ArrowDownLeft className="h-3 w-3 text-emerald-600" />}
            {isCredit === false && <ArrowUpRight className="h-3 w-3 text-rose-600" />}
            <span>{type || 'General'}</span>
          </span>

          {/* Sender */}
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
            From: {sender}
          </span>
        </div>

        {/* Right: Amount & Actions */}
        <div className="flex items-center space-x-3">
          {amount !== null && amount !== undefined && (
            <div className="text-right">
              <span
                className={`text-base font-extrabold sm:text-lg tracking-tight ${
                  isCredit === true
                    ? 'text-slate-900'
                    : isCredit === false
                    ? 'text-rose-600'
                    : 'text-slate-900'
                }`}
              >
                {isCredit === true ? '+' : isCredit === false ? '-' : ''}
                {formatCurrency(amount)}
              </span>
            </div>
          )}

          {/* Quick Actions (JSON, Delete) */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onViewJson(message)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
              title="View Raw MongoDB JSON"
            >
              <Code2 className="h-4 w-4" />
            </button>
            {confirmDelete ? (
              <div className="flex items-center space-x-1 animate-in fade-in duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(_id);
                  }}
                  className="inline-flex items-center space-x-1 rounded-md bg-rose-600 px-2 py-1 text-xs font-bold text-white shadow-xs hover:bg-rose-700 active:scale-95"
                  title="Confirm Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete?</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(false);
                  }}
                  className="rounded-md bg-slate-100 p-1 text-xs text-slate-600 hover:bg-slate-200"
                  title="Cancel"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(true);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                title="Delete SMS"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Middle Row: Extracted Details (TrxID, Balance, Fee, Counterparty) */}
      {(trxId || (balance !== null && balance !== undefined) || counterparty || (fee !== null && fee !== undefined)) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700">
          {trxId && (
            <div className="flex items-center space-x-1.5 rounded-lg bg-white border border-slate-200 px-2 py-1 shadow-xs">
              <Hash className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-semibold text-slate-500">TrxID:</span>
              <span className="font-mono font-bold text-slate-900">{trxId}</span>
              <button
                onClick={handleCopyTrx}
                className="ml-1 text-slate-400 hover:text-slate-800"
                title="Copy TrxID"
              >
                {copiedTrx ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          )}

          {balance !== null && balance !== undefined && (
            <div className="flex items-center space-x-1.5 rounded-lg bg-white border border-slate-200 px-2 py-1 shadow-xs">
              <Wallet className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-slate-500">Bal:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(balance)}</span>
            </div>
          )}

          {counterparty && (
            <div className="flex items-center space-x-1.5 rounded-lg bg-white border border-slate-200 px-2 py-1 shadow-xs">
              <span className="font-semibold text-slate-500">Party:</span>
              <span className="font-medium text-slate-800">{counterparty}</span>
            </div>
          )}

          {fee !== null && fee !== undefined && fee > 0 && (
            <div className="flex items-center space-x-1.5 rounded-lg bg-white border border-slate-200 px-2 py-1 shadow-xs">
              <span className="font-semibold text-slate-500">Fee:</span>
              <span className="text-slate-700">{formatCurrency(fee)}</span>
            </div>
          )}
        </div>
      )}

      {/* Raw SMS Body */}
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-start justify-between">
          <p
            className={`text-xs font-mono leading-relaxed text-slate-800 ${
              !isExpanded ? 'line-clamp-2' : ''
            }`}
          >
            {massage || '(Empty message body)'}
          </p>
          <button
            onClick={handleCopyBody}
            className="ml-2 shrink-0 rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-800 transition"
            title="Copy SMS text"
          >
            {copiedBody ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>

        {massage && massage.length > 120 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1.5 flex items-center space-x-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
          >
            <span>{isExpanded ? 'Show less' : 'Show full SMS'}</span>
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </div>

      {/* Footer: Date & Time */}
      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center space-x-1.5">
          <Clock className="h-3 w-3 text-slate-400" />
          <span>
            {formattedDate} at {formattedTime}
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-400">ID: {_id.slice(-6)}</span>
      </div>
    </div>
  );
}
