import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Code2,
  Terminal,
  Zap,
  Phone,
  RefreshCw,
  Building,
  DollarSign,
  Hash,
} from 'lucide-react';
import { SMSMessage, PaymentVerifyResponse } from '../types';

interface PaymentVerifyTesterProps {
  recentTransactions: SMSMessage[];
  onVerificationComplete: () => void;
  initialTrxId?: string;
  initialAmount?: number;
}

export function PaymentVerifyTester({
  recentTransactions,
  onVerificationComplete,
  initialTrxId = '',
  initialAmount,
}: PaymentVerifyTesterProps) {
  const [trxId, setTrxId] = useState(initialTrxId);
  const [sender, setSender] = useState<string>('bkash');
  const [customerNumber, setCustomerNumber] = useState('');
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<PaymentVerifyResponse | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'js' | 'php' | 'python'>('curl');

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';

  const uncheckedTxs = recentTransactions.filter((t) => !t.isChecked && t.parsed?.trxId);

  const isValidForm =
    Boolean(trxId.trim()) &&
    Boolean(sender.trim()) &&
    Boolean(customerNumber.trim()) &&
    Boolean(amount.trim()) &&
    !isNaN(Number(amount)) &&
    Number(amount) > 0;

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValidForm) return;

    setIsSubmitting(true);
    setResponse(null);
    setHttpStatus(null);

    try {
      const payload = {
        trxId: trxId.trim(),
        sender: sender.trim().toLowerCase(),
        number: customerNumber.trim(),
        amount: Number(amount),
      };

      const res = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: PaymentVerifyResponse = await res.json();
      setHttpStatus(res.status);
      setResponse(data);
      if (data.verified) {
        onVerificationComplete();
      }
    } catch (err: any) {
      setHttpStatus(500);
      setResponse({
        success: false,
        verified: false,
        code: 'INTERNAL_ERROR',
        message: err.message || 'Failed to connect to verification server',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCodeSnippet = () => {
    const cleanTrx = trxId || '9K8L7M6N5P';
    const cleanSender = sender || 'bkash';
    const cleanPhone = customerNumber || '01712345678';
    const cleanAmt = amount || '1500';

    switch (selectedLanguage) {
      case 'curl':
        return `curl -X POST "${originUrl}/api/verify-payment" \\
  -H "Content-Type: application/json" \\
  -d '{
    "trxId": "${cleanTrx}",
    "sender": "${cleanSender}",
    "number": "${cleanPhone}",
    "amount": ${cleanAmt}
  }'`;

      case 'js':
        return `// Node.js / Frontend verification (All 4 parameters are required)
const response = await fetch("${originUrl}/api/verify-payment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    trxId: "${cleanTrx}",
    sender: "${cleanSender}",
    number: "${cleanPhone}",
    amount: ${cleanAmt}
  })
});

const result = await response.json();

if (result.verified) {
  console.log("Payment Verified!", result.data);
  // Transaction is confirmed and marked isChecked: true
} else {
  console.error("Verification Failed [" + result.code + "]:", result.message);
  // Error codes: TRANSACTION_NOT_FOUND | ALREADY_VERIFIED | SENDER_MISMATCH | NUMBER_MISMATCH | AMOUNT_MISMATCH
}`;

      case 'php':
        return `<?php
// PHP Payment Verification Handler
$url = "${originUrl}/api/verify-payment";
$payload = array(
  "trxId"  => "${cleanTrx}",
  "sender" => "${cleanSender}",
  "number" => "${cleanPhone}",
  "amount" => ${cleanAmt}
);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$result = curl_exec($ch);
curl_close($ch);

$res = json_decode($result, true);

if (!empty($res['verified'])) {
    echo "Payment verified for TrxID: " . $res['data']['trxId'];
} else {
    echo "Verification Failed (" . $res['code'] . "): " . $res['message'];
}
?>`;

      case 'python':
        return `import requests

# Python Backend Payment Verification
url = "${originUrl}/api/verify-payment"
payload = {
    "trxId": "${cleanTrx}",
    "sender": "${cleanSender}",
    "number": "${cleanPhone}",
    "amount": ${cleanAmt}
}

response = requests.post(url, json=payload)
data = response.json()

if data.get("verified"):
    print("Payment Verified! Data:", data["data"])
else:
    print(f"Failed [{data.get('code')}]: {data.get('message')}")`;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyJson = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Payment Verification Sandbox
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Verify customer payments in real time by validating <strong>TrxID</strong>, <strong>Sender/Provider</strong>, <strong>Customer Mobile Number</strong>, and <strong>Amount (BDT)</strong>. Upon successful verification, the record is flagged as <code>isChecked: true</code> to prevent duplicate reuse.
            </p>
          </div>
        </div>

        {/* Quick select from recent pending transactions */}
        {uncheckedTxs.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 mb-2 block">
              Quick Select Pending Transactions (Click to pre-fill all 4 parameters):
            </span>
            <div className="flex flex-wrap gap-2">
              {uncheckedTxs.slice(0, 5).map((t) => (
                <button
                  key={t._id}
                  onClick={() => {
                    if (t.parsed?.trxId) setTrxId(t.parsed.trxId);
                    if (t.parsed?.amount) setAmount(String(t.parsed.amount));
                    setSender(t.sender ? t.sender.toLowerCase() : 'bkash');
                    if (t.parsed?.mobileNumber || t.parsed?.counterparty) {
                      setCustomerNumber(t.parsed.mobileNumber || t.parsed.counterparty || '');
                    }
                  }}
                  className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800 transition active:scale-95 shadow-xs"
                >
                  <span className="font-mono font-bold text-slate-900">{t.parsed?.trxId}</span>
                  <span className="text-emerald-700 font-bold">
                    (৳{t.parsed?.amount || 0})
                  </span>
                  <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono">
                    {t.sender}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Two Column Layout: Tester Form + Response & Code */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Zap className="h-4 w-4 text-emerald-600" />
                <span>Verify Parameters</span>
              </h3>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                All 4 Fields Required
              </span>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              {/* 1. TrxID Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Hash className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Transaction ID (trxId)</span>
                  </span>
                  <span className="text-[10px] font-bold text-rose-600">* Required</span>
                </label>
                <input
                  type="text"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder="e.g. 9K8L7M6N5P or 71X89KZ1"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* 2. Sender / Provider Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Building className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Payment Gateway / Sender (sender)</span>
                  </span>
                  <span className="text-[10px] font-bold text-rose-600">* Required</span>
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {['bkash', 'nagad', 'rocket', 'upay'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSender(s)}
                      className={`rounded-xl border px-2.5 py-1.5 text-xs font-bold transition flex items-center justify-center ${
                        sender.toLowerCase() === s
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={sender}
                  onChange={(e) => setSender(e.target.value.toLowerCase())}
                  placeholder="e.g. bkash, nagad, rocket, upay"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* 3. Customer Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Customer Mobile Number (number)</span>
                  </span>
                  <span className="text-[10px] font-bold text-rose-600">* Required</span>
                </label>
                <input
                  type="text"
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value)}
                  placeholder="e.g. 01712345678 or 01898765432"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* 4. Expected Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Exact Amount in BDT (amount)</span>
                  </span>
                  <span className="text-[10px] font-bold text-rose-600">* Required</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-emerald-600">৳</span>
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3.5 py-2.5 text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !isValidForm}
                className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Verifying with Database...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Execute 4-Field Verification</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Live Result & Code Snippet Column */}
        <div className="lg:col-span-7 space-y-4">
          {/* Response Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Terminal className="h-4 w-4 text-emerald-600" />
                <span>Server API Response</span>
              </h3>
              {httpStatus && (
                <span
                  className={`rounded-md px-2.5 py-0.5 text-xs font-mono font-bold ${
                    httpStatus === 200
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : httpStatus === 409
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  HTTP {httpStatus}
                </span>
              )}
            </div>

            {response ? (
              <div className="space-y-3">
                {/* Visual Status Banner */}
                {response.verified ? (
                  <div className="flex items-start space-x-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-emerald-900">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-emerald-900">
                        Payment Verified Successfully! (Code: {response.code})
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">{response.message}</p>
                      {response.data && (
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                          <span className="bg-white border border-emerald-200 text-slate-800 px-2 py-0.5 rounded font-bold">
                            Amount: ৳{response.data.amount ?? response.data.parsed?.amount}
                          </span>
                          <span className="bg-white border border-emerald-200 text-slate-800 px-2 py-0.5 rounded font-mono font-bold">
                            TrxID: {response.data.trxId ?? response.data.parsed?.trxId}
                          </span>
                          <span className="bg-white border border-emerald-200 text-slate-800 px-2 py-0.5 rounded font-mono">
                            Customer: {response.data.mobileNumber ?? response.data.parsed?.mobileNumber ?? 'N/A'}
                          </span>
                          <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded">
                            isChecked: TRUE
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : response.code === 'ALREADY_VERIFIED' ? (
                  <div className="flex items-start space-x-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-amber-900">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-amber-900">Already Verified (Code: ALREADY_VERIFIED)</div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">{response.message}</p>
                      <p className="text-[10px] text-slate-500">
                        Duplicate payment protection: This TrxID cannot be reused for a second purchase.
                      </p>
                    </div>
                  </div>
                ) : response.code === 'TRANSACTION_NOT_FOUND' ? (
                  <div className="flex items-start space-x-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-rose-900">
                    <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-rose-900">Transaction Not Found (HTTP 404)</div>
                      <p className="text-[11px] text-rose-800 leading-relaxed">{response.message}</p>
                      <p className="text-[10px] text-slate-500">
                        Check if the customer provided the exact TrxID or ensure the SMS forwarder sent the webhook.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-rose-900">
                    <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-rose-900">Verification Failed (Code: {response.code})</div>
                      <p className="text-[11px] text-rose-800 leading-relaxed">{response.message}</p>
                    </div>
                  </div>
                )}

                {/* Raw JSON viewer */}
                <div className="relative rounded-xl border border-slate-200 bg-slate-900 p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                  <button
                    onClick={handleCopyJson}
                    className="absolute right-2 top-2 rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:text-white transition"
                    title="Copy JSON Response"
                  >
                    {copiedJson ? 'Copied!' : 'Copy JSON'}
                  </button>
                  <pre className="pr-16">{JSON.stringify(response, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-400 font-medium">
                Fill out the verification parameters on the left and click "Execute 4-Field Verification" to test.
              </div>
            )}
          </div>

          {/* Integration Code Generator */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code2 className="h-4 w-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900">Backend Integration Snippet</h3>
              </div>
              <div className="flex items-center space-x-1 rounded-xl bg-slate-100 p-1">
                {(['curl', 'js', 'php', 'python'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase transition ${
                      selectedLanguage === lang
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-[11px] text-slate-200 overflow-x-auto">
              <button
                onClick={handleCopyCode}
                className="absolute right-2.5 top-2.5 inline-flex items-center space-x-1 rounded-lg bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition"
              >
                {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
              <pre className="pr-16 leading-relaxed whitespace-pre-wrap">{getCodeSnippet()}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

