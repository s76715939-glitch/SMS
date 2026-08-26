export interface ParsedData {
  provider: 'bKash' | 'Nagad' | 'Rocket' | 'Upay' | 'CellFin' | 'Bank' | 'General';
  type: 'Received Money' | 'Cash In' | 'Add Money' | 'Bank Deposit' | 'General';
  amount: number | null;
  currency: string;
  trxId: string | null;
  mobileNumber: string | null;
  fee: number | null;
  balance: number | null;
  counterparty: string | null;
  isCredit: boolean; // Always true for money received
  refNote: string | null;
}

export function parseSmsText(sender: string, body: string): ParsedData {
  const text = (body || '').trim();
  const lowerText = text.toLowerCase();
  const lowerSender = (sender || '').toLowerCase();

  let provider: ParsedData['provider'] = 'General';
  let type: ParsedData['type'] = 'Received Money';
  let amount: number | null = null;
  let currency = 'BDT';
  let trxId: string | null = null;
  let mobileNumber: string | null = null;
  let fee: number | null = null;
  let balance: number | null = null;
  let counterparty: string | null = null;
  const isCredit = true;
  let refNote: string | null = null;

  // 1. Identify Provider
  if (lowerSender.includes('bkash') || lowerText.includes('bkash')) {
    provider = 'bKash';
  } else if (lowerSender.includes('nagad') || lowerText.includes('nagad')) {
    provider = 'Nagad';
  } else if (lowerSender.includes('rocket') || lowerSender.includes('16216') || lowerText.includes('rocket')) {
    provider = 'Rocket';
  } else if (lowerSender.includes('upay') || lowerText.includes('upay')) {
    provider = 'Upay';
  } else if (lowerSender.includes('cellfin') || lowerText.includes('cellfin')) {
    provider = 'CellFin';
  } else if (
    lowerSender.includes('bank') ||
    lowerSender.includes('dbbl') ||
    lowerSender.includes('brac') ||
    lowerSender.includes('ebl') ||
    lowerSender.includes('city') ||
    lowerSender.includes('scb') ||
    lowerSender.includes('ibbl') ||
    lowerSender.includes('islami') ||
    lowerText.includes('a/c') ||
    lowerText.includes('acct')
  ) {
    provider = 'Bank';
  }

  // 2. Extract Transaction ID (TrxID / TxnID / TxnId / Trx Id / Ref)
  const trxMatch = text.match(/(?:TrxID|TxnID|TxnId|Trx\s*Id|Trx\s*#|Transaction\s*ID|Txn)\s*[:.]?\s*([A-Za-z0-9]+)/i);
  if (trxMatch && trxMatch[1]) {
    trxId = trxMatch[1].trim();
  }

  // 3. Extract Amount
  const amountMatch = text.match(/(?:(?:Amount|Tk\.?|BDT|USD|\$)\s*:?\s*|(?:received|credited|cash in|cashin|add money|deposit)\s+(?:of\s+)?(?:Tk\.?|BDT)?\s*)([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i);
  
  if (amountMatch && amountMatch[1]) {
    const rawNum = amountMatch[1].replace(/,/g, '');
    const num = parseFloat(rawNum);
    if (!isNaN(num) && num > 0) {
      amount = num;
    }
  }

  // Fallback Amount extraction
  if (amount === null) {
    const directTkMatch = text.match(/(?:Tk\.?|BDT)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
    if (directTkMatch && directTkMatch[1]) {
      const rawNum = directTkMatch[1].replace(/,/g, '');
      const num = parseFloat(rawNum);
      if (!isNaN(num) && num > 0) amount = num;
    }
  }

  // 4. Extract Fee
  const feeMatch = text.match(/Fee\s*(?:Tk\.?|BDT)?\s*:?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
  if (feeMatch && feeMatch[1]) {
    const feeNum = parseFloat(feeMatch[1].replace(/,/g, ''));
    if (!isNaN(feeNum)) fee = feeNum;
  }

  // 5. Extract Balance
  const balanceMatch = text.match(/(?:Balance|Bal|Available\s*Balance|Available\s*Bal)\s*(?:is|Tk\.?|BDT)?\s*:?\s*(?:Tk\.?|BDT)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
  if (balanceMatch && balanceMatch[1]) {
    const balNum = parseFloat(balanceMatch[1].replace(/,/g, ''));
    if (!isNaN(balNum)) balance = balNum;
  }

  // 6. Extract Reference Note
  const refMatch = text.match(/Ref\s*(?:[:.]|is)?\s*([^.]+?)(?=\.|\s+Fee|\s+Balance|\s+TrxID|\s+TxnID|$)/i);
  if (refMatch && refMatch[1]) {
    const cleanRef = refMatch[1].trim();
    if (cleanRef.length > 0 && cleanRef.length < 50) {
      refNote = cleanRef;
    }
  }

  // 7. Extract Bangladeshi Mobile Number (013, 014, 015, 016, 017, 018, 019)
  const bdPhoneRegex = /(?:\+?88)?(01[3-9]\d{8})/g;
  
  const contextualPhoneMatch = text.match(/(?:from|Sender|Receiver|A\/C:?|Account:?)\s*:?\s*(?:\+?88)?(01[3-9]\d{8})/i);
  if (contextualPhoneMatch && contextualPhoneMatch[1]) {
    mobileNumber = contextualPhoneMatch[1];
    counterparty = contextualPhoneMatch[1];
  } else {
    const allPhones = text.match(bdPhoneRegex);
    if (allPhones && allPhones.length > 0) {
      const cleanPhone = allPhones[0].replace(/^\+?88/, '');
      mobileNumber = cleanPhone;
      counterparty = cleanPhone;
    }
  }

  // If still no mobile number but there's an account number / name
  if (!mobileNumber) {
    const counterpartyMatch = text.match(/(?:from|Sender|A\/C)\s*:?\s*([0-9A-Za-z\s\-\_]{5,25})/i);
    if (counterpartyMatch && counterpartyMatch[1]) {
      const cp = counterpartyMatch[1].trim().split(/\s+(?:successful|Fee|Ref|Balance|at|on|Time|TrxID|TxnID)/i)[0];
      if (cp && cp.length >= 3 && !cp.toLowerCase().includes('received')) {
        counterparty = cp.trim();
        if (/^\d{8,15}$/.test(cp.trim())) {
          mobileNumber = cp.trim();
        }
      }
    }
  }

  // 8. Determine Specific Money Received Sub-Type
  if (lowerText.includes('cash in') || lowerText.includes('cashin')) {
    type = 'Cash In';
  } else if (lowerText.includes('add money') || lowerText.includes('money added')) {
    type = 'Add Money';
  } else if (lowerText.includes('deposit') || lowerText.includes('credited') || lowerText.includes('bank transfer')) {
    type = 'Bank Deposit';
  } else {
    type = 'Received Money';
  }

  return {
    provider,
    type,
    amount,
    currency,
    trxId,
    mobileNumber,
    fee,
    balance,
    counterparty,
    isCredit,
    refNote,
  };
}

