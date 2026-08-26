import React, { useState } from 'react';
import { Check, Loader2, Send, X, AlertCircle } from 'lucide-react';

interface TestSenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_MESSAGES = [
  {
    label: 'bKash - Received Money',
    sender: 'bkash',
    massage: `You have received Tk 1,250.00 from 01799887766. Ref Order#45. Fee Tk 0.00. Balance Tk 5,420.50. TrxID 9H7G6F5D4S at ${new Date().toLocaleString()}`,
  },
  {
    label: 'Nagad - Cash In',
    sender: 'nagad',
    massage: `Cash In Amount: Tk 3,000.00 Sender: 01811223344 TxnID: 71NB6V54 Balance: Tk 8,540.00 Time: ${new Date().toLocaleString()}`,
  },
  {
    label: 'Rocket - Received Money',
    sender: 'rocket',
    massage: `You have received Tk 2,000.00 from A/C: 01922334455 TxnId: 83948271 Balance: Tk 4,100.00`,
  },
  {
    label: 'Upay - Received Money',
    sender: 'upay',
    massage: `You have received Tk 600.00 from 01344556677. Ref gift. Fee Tk 0.00. Balance Tk 4,815.50. TrxID 8A7B6C5D4E`,
  },
];

export function TestSenderModal({ isOpen, onClose, onSuccess }: TestSenderModalProps) {
  const [sender, setSender] = useState('bkash');
  const [massage, setMassage] = useState(
    `You have received Tk 1,500.00 from 01712345678. Fee Tk 0.00. Balance Tk 3,450.00. TrxID 9H8G7F6D5S`
  );
  const [timestamp, setTimestamp] = useState(String(Date.now()));
  const [isLoading, setIsLoading] = useState(false);
  const [responseLog, setResponseLog] = useState<{ ok: boolean; data: any } | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESET_MESSAGES[0]) => {
    setSender(preset.sender);
    setMassage(preset.massage);
    setTimestamp(String(Date.now()));
    setResponseLog(null);
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResponseLog(null);

    try {
      const payload = {
        sender: sender.trim(),
        massage: massage.trim(),
        timestamp: isNaN(Number(timestamp)) ? timestamp : Number(timestamp),
      };

      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResponseLog({ ok: res.ok, data });
      if (res.ok) {
        onSuccess();
      }
    } catch (err: any) {
      setResponseLog({
        ok: false,
        data: { error: err?.message || 'Network request failed' },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">API Webhook Simulator</h3>
              <p className="text-xs text-slate-500">
                Simulate POST request to <code className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">/api/sms</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="mt-4">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Choose a Sample Transaction:</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {PRESET_MESSAGES.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Test Form */}
        <form onSubmit={handleSendTest} className="mt-4 space-y-3">
          {/* Sender */}
          <div>
            <label className="block text-xs font-bold text-slate-700">
              sender <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="e.g. bkash, nagad, rocket..."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* massage */}
          <div>
            <label className="block text-xs font-bold text-slate-700">
              massage (SMS Body) <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={massage}
              onChange={(e) => setMassage(e.target.value)}
              placeholder="Full SMS body text..."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* timestamp */}
          <div>
            <label className="block text-xs font-bold text-slate-700">
              timestamp
            </label>
            <input
              type="text"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              placeholder="Epoch milliseconds or ISO string"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center space-x-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing SMS...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send POST /api/sms</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Response Feedback */}
        {responseLog && (
          <div
            className={`mt-4 rounded-xl border p-3.5 text-xs ${
              responseLog.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            <div className="flex items-center space-x-1.5 font-bold">
              {responseLog.ok ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600" />
              )}
              <span>{responseLog.ok ? 'HTTP 201 - Successfully Ingested SMS!' : 'Request Failed'}</span>
            </div>
            <pre className="mt-2 max-h-36 overflow-auto rounded-lg border border-slate-200 bg-slate-900 p-2.5 font-mono text-[11px] text-emerald-400">
              {JSON.stringify(responseLog.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

