import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

export function ApiDocsView() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<'curl' | 'js' | 'php' | 'python'>('curl');

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const webhookEndpoint = `${originUrl}/api/sms`;
  const verifyEndpoint = `${originUrl}/api/verify-payment`;
  const listEndpoint = `${originUrl}/api/transactions`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Developer API Reference & Integration Guide
              </h2>
              <p className="text-xs text-slate-500">
                Complete documentation for SMS webhook ingestion and automated payment verification
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Endpoints: 100% Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: PAYMENT VERIFICATION API */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <span className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-mono font-bold text-white">
              POST
            </span>
            <span className="font-mono text-sm font-bold text-slate-900">/api/verify-payment</span>
          </div>
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-800">
            Payment Verification Engine
          </span>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-1.5">Overview & Verification Logic</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Call this endpoint from your website, checkout backend, or mobile app when a user submits their payment details. All 4 parameters (<code className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">trxId</code>, <code className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">sender</code>, <code className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">number</code>, <code className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">amount</code>) are <strong>strictly required</strong>.
            The server checks each field against the recorded transaction. If all 4 match and the transaction has not yet been used, it sets <code className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">isChecked: true</code> and returns <code className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">VERIFIED_SUCCESS</code>. If any field does not match, or if the transaction was already claimed, a descriptive error response is returned.
          </p>
        </div>

        {/* Request Parameters Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Request Body (JSON) — All 4 Fields are Required
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Field</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">trxId</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">string</td>
                  <td className="py-2.5 px-3 text-rose-600 font-bold">Required *</td>
                  <td className="py-2.5 px-3 text-[11px]">Transaction ID from SMS (e.g. <code>"9K8L7M6N5P"</code>).</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">sender</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">string</td>
                  <td className="py-2.5 px-3 text-rose-600 font-bold">Required *</td>
                  <td className="py-2.5 px-3 text-[11px]">Gateway name (e.g. <code>"bkash"</code>, <code>"nagad"</code>, <code>"rocket"</code>, <code>"upay"</code>). Case-insensitive.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">number</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">string</td>
                  <td className="py-2.5 px-3 text-rose-600 font-bold">Required *</td>
                  <td className="py-2.5 px-3 text-[11px]">Customer sender mobile number (e.g. <code>"01712345678"</code>).</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">amount</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">number</td>
                  <td className="py-2.5 px-3 text-rose-600 font-bold">Required *</td>
                  <td className="py-2.5 px-3 text-[11px]">Expected amount in BDT (e.g. <code>1500</code>). Matches against SMS amount.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Request Sample */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>cURL Request Example:</span>
            <button
              onClick={() =>
                handleCopy(
                  `curl -X POST "${verifyEndpoint}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "trxId": "9K8L7M6N5P",\n    "sender": "bkash",\n    "number": "01712345678",\n    "amount": 1500\n  }'`,
                  'verify-req'
                )
              }
              className="inline-flex items-center space-x-1 text-emerald-700 hover:underline font-bold"
            >
              {copiedSection === 'verify-req' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              <span>{copiedSection === 'verify-req' ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>

          <pre className="rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-[11px] text-emerald-400 overflow-x-auto">
{`curl -X POST "${verifyEndpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "trxId": "9K8L7M6N5P",
    "sender": "bkash",
    "number": "01712345678",
    "amount": 1500
  }'`}
          </pre>
        </div>

        {/* All Response Status Codes & Examples */}
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Possible Response Scenarios & Error Codes
          </h4>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1. Success Response */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>HTTP 200 OK — Verified Success</span>
                </div>
                <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  VERIFIED_SUCCESS
                </span>
              </div>
              <p className="text-[11px] text-emerald-900 font-medium">
                Payment is valid, details matched, and marked <code className="bg-white border border-emerald-200 px-1 py-0.5 rounded">isChecked = true</code>.
              </p>
              <pre className="rounded-lg bg-slate-900 p-3 font-mono text-[10px] text-emerald-400 overflow-x-auto">
{`{
  "success": true,
  "verified": true,
  "code": "VERIFIED_SUCCESS",
  "message": "Payment verified successfully",
  "data": {
    "trxId": "9K8L7M6N5P",
    "amount": 1500,
    "mobileNumber": "01712345678",
    "provider": "bKash",
    "sender": "bKash",
    "receivedAt": "2026-08-26T09:15:00.000Z",
    "isChecked": true
  }
}`}
              </pre>
            </div>

            {/* 2. Transaction Not Found */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs">
                  <XCircle className="h-4 w-4 text-rose-600" />
                  <span>HTTP 404 Not Found — No Match</span>
                </div>
                <span className="font-mono text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">
                  TRANSACTION_NOT_FOUND
                </span>
              </div>
              <p className="text-[11px] text-rose-900 font-medium">
                No transaction found with this TrxID or matching phone/amount details.
              </p>
              <pre className="rounded-lg bg-slate-900 p-3 font-mono text-[10px] text-rose-300 overflow-x-auto">
{`{
  "success": false,
  "verified": false,
  "code": "TRANSACTION_NOT_FOUND",
  "message": "No transaction found matching TrxID \\"9K8L7M6N5P\\""
}`}
              </pre>
            </div>

            {/* 3. Already Verified Conflict */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>HTTP 409 Conflict — Already Used</span>
                </div>
                <span className="font-mono text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                  ALREADY_VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-amber-900 font-medium">
                This transaction was already checked and cannot be used again. Prevents duplicate order fraud.
              </p>
              <pre className="rounded-lg bg-slate-900 p-3 font-mono text-[10px] text-amber-300 overflow-x-auto">
{`{
  "success": false,
  "verified": false,
  "code": "ALREADY_VERIFIED",
  "message": "This transaction has already been verified and checked",
  "data": {
    "trxId": "9K8L7M6N5P",
    "amount": 1500,
    "verifiedAt": "2026-08-26T09:16:10.000Z",
    "isChecked": true
  }
}`}
              </pre>
            </div>

            {/* 4. Sender / Number / Amount Mismatch */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs">
                  <XCircle className="h-4 w-4 text-rose-600" />
                  <span>HTTP 422 Unprocessable — Field Mismatch</span>
                </div>
                <span className="font-mono text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold">
                  AMOUNT_MISMATCH
                </span>
              </div>
              <p className="text-[11px] text-slate-700 font-medium">
                Transaction exists, but provider, customer phone, or expected amount did not match the SMS record.
              </p>
              <pre className="rounded-lg bg-slate-900 p-3 font-mono text-[10px] text-slate-200 overflow-x-auto">
{`{
  "success": false,
  "verified": false,
  "code": "AMOUNT_MISMATCH",
  "message": "Amount mismatch! Expected ৳1500.00, but actual transaction amount is ৳500.00.",
  "data": {
    "expectedAmount": 1500,
    "actualAmount": 500,
    "trxId": "9K8L7M6N5P"
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: INCOMING SMS WEBHOOK API */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <span className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-mono font-bold text-white">
              POST
            </span>
            <span className="font-mono text-sm font-bold text-slate-900">/api/sms</span>
          </div>
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-bold text-blue-800">
            SMS Webhook Ingestion (Sender saved in lowercase)
          </span>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-1.5">Overview & Auto-Normalization</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Forward SMS messages from any Android SMS Forwarder application (such as "SMS Forwarder", "Tasker", or "Macrodroid") to this URL. The backend automatically converts the <code className="text-blue-700 font-bold bg-blue-50 border border-blue-200 px-1 py-0.5 rounded">sender</code> to <strong>lowercase</strong> (e.g. <code>"bkash"</code>, <code>"nagad"</code>, <code>"rocket"</code>, <code>"upay"</code>) before saving to the database to eliminate case-sensitivity issues.
          </p>
        </div>

        {/* Webhook Format */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Webhook Payload Example:</span>
            <button
              onClick={() =>
                handleCopy(
                  `curl -X POST "${webhookEndpoint}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "sender": "bkash",\n    "massage": "You have received Tk 1,500.00 from 01712345678. Fee Tk 0.00. Balance Tk 4,850.50. TrxID 9K8L7M6N5P",\n    "timestamp": ${Date.now()}\n  }'`,
                  'webhook-req'
                )
              }
              className="inline-flex items-center space-x-1 text-blue-700 hover:underline font-bold"
            >
              {copiedSection === 'webhook-req' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              <span>{copiedSection === 'webhook-req' ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>

          <pre className="rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-[11px] text-blue-300 overflow-x-auto">
{`curl -X POST "${webhookEndpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sender": "bkash",
    "massage": "You have received Tk 1,500.00 from 01712345678. Fee Tk 0.00. Balance Tk 4,850.50. TrxID 9K8L7M6N5P",
    "timestamp": ${Date.now()}
  }'`}
          </pre>
        </div>
      </div>

      {/* SECTION 3: CODE INTEGRATION SNIPPETS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <Terminal className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Full Integration Code Examples</h3>
          </div>
          <div className="flex items-center space-x-1 rounded-xl bg-slate-100 p-1">
            {(['curl', 'js', 'php', 'python'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase transition ${
                  selectedLang === lang
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
          {selectedLang === 'curl' && (
            <pre>{`# 1. Verify Payment (All 4 parameters are strictly required)
curl -X POST "${verifyEndpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "trxId": "9K8L7M6N5P",
    "sender": "bkash",
    "number": "01712345678",
    "amount": 1500
  }'

# 2. Query Transactions List
curl -X GET "${listEndpoint}?status=unchecked&limit=20"`}</pre>
          )}

          {selectedLang === 'js' && (
            <pre>{`// Node.js Express / Next.js / React Payment Verification
// All 4 fields (trxId, sender, number, amount) are strictly required
async function verifyCustomerPayment(trxId, sender, customerNumber, amount) {
  try {
    const response = await fetch("${verifyEndpoint}", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trxId: trxId,
        sender: sender.toLowerCase(),
        number: customerNumber,
        amount: Number(amount)
      })
    });

    const result = await response.json();

    if (result.verified) {
      console.log("Payment Verified Successfully:", result.data);
      // Fulfill order, deliver goods, or activate user account
      return { success: true, transaction: result.data };
    } else {
      console.error("Verification Failed [" + result.code + "]:", result.message);
      return { success: false, reason: result.message, code: result.code };
    }
  } catch (error) {
    console.error("Network Error:", error);
    return { success: false, reason: "Server connection failed" };
  }
}`}</pre>
          )}

          {selectedLang === 'php' && (
            <pre>{`<?php
// PHP Payment Verification Function
// All 4 fields (trxId, sender, number, amount) are strictly required
function verifyPayment($trxId, $sender, $number, $amount) {
    $url = "${verifyEndpoint}";
    $payload = array(
        'trxId'  => $trxId,
        'sender' => strtolower($sender),
        'number' => $number,
        'amount' => floatval($amount)
    );

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
    
    $response = curl_exec($ch);
    curl_close($ch);

    $result = json_decode($response, true);

    if (!empty($result['verified'])) {
        // Payment valid: Update your database (order = PAID)
        return array('success' => true, 'data' => $result['data']);
    } else {
        // Payment failed or duplicate
        return array('success' => false, 'code' => $result['code'], 'message' => $result['message']);
    }
}
?>`}</pre>
          )}

          {selectedLang === 'python' && (
            <pre>{`import requests

# Python Payment Verification Function
# All 4 fields (trxId, sender, number, amount) are strictly required
def verify_payment(trx_id, sender, number, amount):
    url = "${verifyEndpoint}"
    payload = {
        "trxId": trx_id,
        "sender": str(sender).lower(),
        "number": str(number),
        "amount": float(amount)
    }

    response = requests.post(url, json=payload)
    data = response.json()

    if data.get("verified"):
        print("Payment Verified:", data["data"])
        return True, data["data"]
    else:
        print(f"Failed [{data.get('code')}]: {data.get('message')}")
        return False, data.get("message")`}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

