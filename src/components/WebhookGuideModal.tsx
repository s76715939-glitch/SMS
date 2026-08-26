import { useState } from 'react';
import { Check, Copy, Smartphone, X } from 'lucide-react';

interface WebhookGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WebhookGuideModal({ isOpen, onClose }: WebhookGuideModalProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  if (!isOpen) return null;

  const endpointUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/sms`
    : 'https://your-domain.com/api/sms';

  const curlText = `curl -X POST "${endpointUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sender": "bkash",
    "massage": "You have received Tk 2,500.00 from 01711223344. Fee Tk 0.00. Balance Tk 6,200.00. TrxID 9K8L7M6N5P",
    "timestamp": ${Date.now()}
  }'`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
              <Smartphone className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Android SMS App Integration Guide</h3>
              <p className="text-xs text-slate-500">How to forward SMS to this dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4 text-xs text-slate-600">
          {/* Step 1 */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="font-bold text-slate-900">Step 1: Set Target Webhook URL in Android App</h4>
            <p className="mt-1 text-slate-600">
              In your Android application settings where it asks for the API URL, enter:
            </p>
            <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2 font-mono text-xs">
              <span className="truncate text-emerald-700 font-bold px-1">{endpointUrl}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(endpointUrl);
                  setCopiedUrl(true);
                  setTimeout(() => setCopiedUrl(false), 2000);
                }}
                className="ml-2 flex shrink-0 items-center space-x-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
              >
                {copiedUrl ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="font-bold text-slate-900">Step 2: JSON Body Schema Sent by Your App</h4>
            <p className="mt-1 text-slate-600">
              Your Android app should send an HTTP <code className="font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">POST</code> request with <code className="font-mono text-slate-800">Content-Type: application/json</code>:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-emerald-400">
{`{
  "sender": "%sender%",        // e.g. "bkash", "nagad", "rocket"
  "massage": "%body%",         // e.g. "You have received Tk 500..."
  "timestamp": %timestamp%     // e.g. 1724610000000 or current epoch time
}`}
            </pre>
            <p className="mt-2 text-[11px] text-slate-500">
              💡 <strong>Note:</strong> We accept <code className="font-mono text-emerald-700 font-bold">massage</code>, <code className="font-mono text-emerald-700 font-bold">message</code>, <code className="font-mono text-emerald-700 font-bold">body</code>, <code className="font-mono text-emerald-700 font-bold">text</code>, and <code className="font-mono text-emerald-700 font-bold">sender</code> gracefully so you don't have to worry about field name typos.
            </p>
          </div>

          {/* Step 3: MongoDB info */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-emerald-900">
            <h4 className="font-bold text-emerald-900">Automatic Normalization & Real-Time Processing</h4>
            <p className="mt-1 text-emerald-800 text-xs">
              Incoming sender names are automatically converted to lowercase (e.g. <code>"bKash"</code> → <code>"bkash"</code>) to prevent case-sensitivity issues during verification.
            </p>
          </div>

          {/* Step 4: cURL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-800">Test via cURL / Postman</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(curlText);
                  setCopiedCurl(true);
                  setTimeout(() => setCopiedCurl(false), 2000);
                }}
                className="flex items-center space-x-1 text-emerald-700 hover:underline font-bold text-xs"
              >
                {copiedCurl ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-slate-200">
              {curlText}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 border-t border-slate-100 pt-3 text-right">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}

