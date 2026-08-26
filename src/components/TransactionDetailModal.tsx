import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Phone,
  ShieldCheck,
  Code2,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { SMSMessage } from '../types';

interface TransactionDetailModalProps {
  transaction: SMSMessage | null;
  onClose: () => void;
  onToggleCheck: (id: string, currentStatus: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TransactionDetailModal({
  transaction,
  onClose,
  onToggleCheck,
  onDelete,
}: TransactionDetailModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!transaction) return null;

  const { _id, sender, isChecked, receivedAt, timestamp, massage, parsed, sourceIp, verifiedAt, verifiedBy } = transaction;
  const { provider, amount, trxId, mobileNumber, counterparty, fee, balance, type, isCredit } = parsed || {};

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className="text-base font-bold text-slate-900">Transaction Details & Audit</span>
              <span
                className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                  isChecked
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                {isChecked ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <Clock className="h-3 w-3 text-amber-600" />}
                <span>{isChecked ? 'Verified (True)' : 'Pending Verification'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">Record ID: {_id}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Primary Data Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Amount */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Amount (BDT)</div>
            <div className="text-xl font-black text-slate-900 mt-1">
              ৳ {amount !== null && amount !== undefined ? amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'N/A'}
            </div>
          </div>

          {/* TrxID */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Transaction ID</div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono text-xs font-bold text-slate-900">{trxId || 'N/A'}</span>
              {trxId && (
                <button
                  onClick={() => handleCopy(trxId, 'trx')}
                  className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-800"
                  title="Copy TrxID"
                >
                  {copiedKey === 'trx' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                </button>
              )}
            </div>
          </div>

          {/* Customer Mobile */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Customer Phone</div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono text-xs font-bold text-slate-900">
                {mobileNumber || counterparty || 'N/A'}
              </span>
              {(mobileNumber || counterparty) && (
                <button
                  onClick={() => handleCopy(mobileNumber || counterparty || '', 'phone')}
                  className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-800"
                  title="Copy Phone"
                >
                  {copiedKey === 'phone' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                </button>
              )}
            </div>
          </div>

          {/* Provider */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Gateway Provider</div>
            <div className="text-xs font-bold text-slate-900 mt-1">{provider || 'General'} ({sender})</div>
          </div>

          {/* Type */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Type</div>
            <div className="text-xs font-bold text-slate-900 mt-1 flex items-center space-x-1">
              {isCredit === true ? <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" /> : <ArrowUpRight className="h-3.5 w-3.5 text-rose-600" />}
              <span>{type || 'General'}</span>
            </div>
          </div>

          {/* Current Balance */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Post-SMS Balance</div>
            <div className="text-xs font-bold text-slate-900 mt-1">
              {balance !== null && balance !== undefined ? `৳ ${balance.toLocaleString('en-US')}` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Status: <strong className={isChecked ? 'text-emerald-700 font-extrabold' : 'text-amber-700 font-extrabold'}>{isChecked ? 'VERIFIED (isChecked = true)' : 'PENDING (isChecked = false)'}</strong></span>
            </div>
            {verifiedAt && (
              <p className="text-[11px] text-slate-500">
                Verified At: {new Date(verifiedAt).toLocaleString()} ({verifiedBy || 'API'})
              </p>
            )}
          </div>

          <button
            onClick={() => onToggleCheck(_id, isChecked)}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition active:scale-95 shadow-xs ${
              isChecked
                ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isChecked ? 'Mark as Pending (isChecked = False)' : 'Mark as Verified (isChecked = True)'}
          </button>
        </div>

        {/* Raw SMS Message Section (Auditing) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Raw SMS Body (Original Source):</span>
            <button
              onClick={() => handleCopy(massage, 'sms')}
              className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 hover:underline"
            >
              {copiedKey === 'sms' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              <span>{copiedKey === 'sms' ? 'Copied' : 'Copy SMS'}</span>
            </button>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs font-medium text-slate-800 leading-relaxed select-all">
            {massage || 'No message body'}
          </div>
        </div>

        {/* Raw JSON toggle */}
        <div className="space-y-2">
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>{showRawJson ? 'Hide Raw Database Document' : 'View Raw Database JSON Document'}</span>
          </button>
          {showRawJson && (
            <div className="rounded-xl border border-slate-200 bg-slate-900 p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-48">
              <pre>{JSON.stringify(transaction, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          {confirmDelete ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  onDelete(_id);
                  onClose();
                }}
                className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 shadow-xs active:scale-95"
              >
                Yes, Delete Record
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center space-x-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 text-white px-4 py-2 text-xs font-bold hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

