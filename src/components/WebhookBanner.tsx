import { useState } from 'react';
import { Check, Copy, Sparkles, Smartphone, ChevronDown, ChevronUp } from 'lucide-react';

interface WebhookBannerProps {
  onSeedSample: () => void;
  isSeeding: boolean;
}

export function WebhookBanner({ onSeedSample, isSeeding }: WebhookBannerProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const apiEndpoint = typeof window !== 'undefined'
    ? `${window.location.origin}/api/sms`
    : 'https://your-domain.com/api/sms';

  const copyUrl = () => {
    navigator.clipboard.writeText(apiEndpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const curlExample = `curl -X POST "${apiEndpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sender": "bKash",
    "massage": "You have received Tk 1,500.00 from 01712345678. Fee Tk 0.00. Balance Tk 3,450.00. TrxID 9H8G7F6D5S",
    "timestamp": ${Date.now()}
  }'`;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left Side Info */}
        <div className="flex items-start space-x-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-xs">
            <Smartphone className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Android SMS Forwarder Webhook
              </h2>
              <span className="rounded bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                POST /api/sms
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Copy this URL into your Android SMS Forwarder app to ingest messages in real-time.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Seed Demo data */}
          <button
            onClick={onSeedSample}
            disabled={isSeeding}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-95 disabled:opacity-50 shadow-xs"
            id="btn-seed-sample"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>{isSeeding ? 'Generating Sample Data...' : 'Seed Sample SMS Data'}</span>
          </button>

          {/* Toggle Full Guide */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center space-x-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <span>{isOpen ? 'Hide Payload Info' : 'Show Payload Info'}</span>
            {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* URL Copy Bar */}
      <div className="mt-3.5 flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1.5 shadow-xs">
        <span className="px-2.5 py-1 text-xs font-mono font-bold text-emerald-700 bg-white border border-slate-200 rounded-lg shadow-xs">POST</span>
        <input
          type="text"
          readOnly
          value={apiEndpoint}
          className="w-full bg-transparent px-3 text-xs font-mono font-medium text-slate-800 focus:outline-none"
        />
        <button
          onClick={copyUrl}
          className="inline-flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95 shadow-xs"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy URL</span>
            </>
          )}
        </button>
      </div>

      {/* Expandable Android Setup Documentation */}
      {isOpen && (
        <div className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-600">
          <div className="grid gap-4 md:grid-cols-2">
            {/* JSON Schema */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-bold text-slate-800">Expected JSON Request Body</span>
                <span className="text-[10px] text-slate-500 font-mono">Content-Type: application/json</span>
              </div>
              <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-emerald-400">
{`{
  "sender": "bKash",
  "massage": "You have received Tk 1,500.00 from 017...",
  "timestamp": ${Date.now()}
}`}
              </pre>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Note: Both <code className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">massage</code> and <code className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">message</code> keys are automatically accepted.
              </p>
            </div>

            {/* cURL command */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-bold text-slate-800">Test via Terminal (cURL)</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(curlExample);
                  }}
                  className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 hover:underline"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy cURL</span>
                </button>
              </div>
              <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-slate-200">
                {curlExample}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

