import { useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { SMSMessage } from '../types';

interface RawJsonModalProps {
  message: SMSMessage | null;
  onClose: () => void;
}

export function RawJsonModal({ message, onClose }: RawJsonModalProps) {
  const [copied, setCopied] = useState(false);

  if (!message) return null;

  const jsonString = JSON.stringify(message, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Database Document View</h3>
            <p className="text-xs font-mono text-slate-500">_id: {message._id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider text-[11px]">Raw JSON Document</span>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>
          <pre className="max-h-96 overflow-auto rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs leading-relaxed text-emerald-400">
            {jsonString}
          </pre>
        </div>

        <div className="mt-4 text-right">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

