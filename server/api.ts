import { Router, Request, Response } from 'express';
import {
  saveSmsMessage,
  querySmsMessages,
  deleteSmsMessage,
  checkDatabaseHealth,
  findTransactionByTrxId,
  findTransactionByDetails,
  updateTransactionVerification,
  findAdminByUsername,
  updateAdminPassword,
} from './db.js';
import { parseSmsText } from './parser.js';
import { generateToken, comparePassword, hashPassword, requireAuth } from './auth.js';
import { SMSMessage } from '../src/types.js';

export const apiRouter = Router();

// ==================== AUTHENTICATION ROUTES ====================

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
      });
    }

    const admin = await findAdminByUsername(username);
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password',
      });
    }

    const isMatch = await comparePassword(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password',
      });
    }

    const tokenPayload = {
      id: admin._id,
      username: admin.username,
      role: admin.role || 'admin',
    };

    const token = generateToken(tokenPayload);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: admin._id,
        username: admin.username,
        role: admin.role || 'admin',
      },
    });
  } catch (err: any) {
    console.error('[POST /api/auth/login Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      details: err.message,
    });
  }
});

apiRouter.get('/auth/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    return res.json({
      success: true,
      user,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/auth/password', requireAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = (req as any).user;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new passwords are required' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'New password must be at least 4 characters long' });
    }

    const admin = await findAdminByUsername(user.username);
    if (!admin) {
      return res.status(404).json({ success: false, error: 'Admin account not found' });
    }

    const isMatch = await comparePassword(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    const hashedNew = await hashPassword(newPassword);
    const updated = await updateAdminPassword(user.username, hashedNew);

    if (!updated) {
      return res.status(500).json({ success: false, error: 'Failed to update password in database' });
    }

    return res.json({
      success: true,
      message: 'Admin password updated successfully',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Server-Sent Events (SSE) subscribers for real-time live feed
const sseClients = new Set<Response>();

function broadcastSmsEvent(eventType: 'new_sms' | 'delete_sms' | 'status_update' | 'bulk_update', payload: any) {
  const dataString = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(dataString);
    } catch {
      sseClients.delete(client);
    }
  }
}

// SSE stream endpoint
apiRouter.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial ping
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to realtime SMS stream' })}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Health check endpoint
apiRouter.get('/health', async (_req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth();
  res.json({
    status: dbHealth.ok ? 'healthy' : 'ready',
    database: dbHealth,
    serverTime: new Date().toISOString(),
    sseClients: sseClients.size,
  });
});

/**
 * MAIN POST ENDPOINT FOR ANDROID APP
 * Supports:
 * - sender: string
 * - massage / message / body / text / sms: string
 * - timestamp / time / date: string | number
 */
async function handleIncomingSms(req: Request, res: Response) {
  try {
    const body = req.body || {};

    // Extract sender and convert to lowercase for case-insensitive storage
    const rawSender = String(body.sender || body.from || body.address || body.phone || 'unknown').trim();
    const sender = (rawSender || 'unknown').toLowerCase();

    // Extract message text (handling user's "massage" spelling and standard "message"/"body")
    const rawMessage = String(
      body.massage !== undefined
        ? body.massage
        : body.message !== undefined
        ? body.message
        : body.body !== undefined
        ? body.body
        : body.text !== undefined
        ? body.text
        : body.content !== undefined
        ? body.content
        : ''
    ).trim();

    if (!rawMessage && !body.sender) {
      return res.status(400).json({
        success: false,
        error: 'Missing sender or message content. Expected JSON body: { "sender": "bkash", "massage": "You have received...", "timestamp": "..." }',
      });
    }

    // Extract timestamp
    let timestamp = body.timestamp || body.time || body.date || Date.now();
    if (typeof timestamp === 'string' && !isNaN(Number(timestamp)) && timestamp.length >= 10 && timestamp.length <= 13) {
      timestamp = Number(timestamp);
    }

    const receivedAt = new Date().toISOString();
    const parsed = parseSmsText(sender, rawMessage);

    const docToInsert = {
      sender: sender || 'unknown',
      massage: rawMessage,
      timestamp,
      receivedAt,
      parsed,
      isChecked: false,
      verifiedAt: null,
      verifiedBy: null,
      sourceIp: req.ip || req.headers['x-forwarded-for'] || 'unknown',
    };

    const { id, savedIn } = await saveSmsMessage(docToInsert);

    const fullDoc: SMSMessage = {
      _id: id,
      sender: docToInsert.sender,
      massage: docToInsert.massage,
      timestamp: docToInsert.timestamp,
      receivedAt: docToInsert.receivedAt,
      parsed: docToInsert.parsed,
      isChecked: false,
      verifiedAt: null,
      verifiedBy: null,
      sourceIp: String(docToInsert.sourceIp),
    };

    console.log(`[SMS Received] From: "${sender}" | TrxID: ${parsed.trxId || 'N/A'} | Amount: ${parsed.amount || 'N/A'} | Saved ID: ${id} (${savedIn})`);

    // Broadcast instantly to connected web browsers via SSE
    broadcastSmsEvent('new_sms', fullDoc);

    return res.status(201).json({
      success: true,
      message: 'SMS successfully received and saved to database',
      id,
      storage: savedIn,
      data: fullDoc,
    });
  } catch (error: any) {
    console.error('[POST /api/sms Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process incoming SMS',
      details: error?.message || String(error),
    });
  }
}

// Register POST handlers on multiple common webhook routes so the Android app can use any
apiRouter.post('/sms', handleIncomingSms);
apiRouter.post('/messages', handleIncomingSms);
apiRouter.post('/transactions', handleIncomingSms);
apiRouter.post('/webhook', handleIncomingSms);
apiRouter.post('/sms-receiver', handleIncomingSms);
apiRouter.post('/receive', handleIncomingSms);

/**
 * GET /api/sms, /api/messages, /api/transactions
 * Retrieves transactions with filtering
 */
async function handleGetSms(req: Request, res: Response) {
  try {
    const {
      sender,
      search,
      startDate,
      endDate,
      provider,
      type,
      status,
      limit = '100',
      page = '1',
    } = req.query;

    const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 50, 1), 500);
    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);

    const result = await querySmsMessages({
      sender: typeof sender === 'string' ? sender : undefined,
      search: typeof search === 'string' ? search : undefined,
      startDate: typeof startDate === 'string' ? startDate : undefined,
      endDate: typeof endDate === 'string' ? endDate : undefined,
      provider: typeof provider === 'string' ? provider : undefined,
      type: typeof type === 'string' ? type : undefined,
      status: typeof status === 'string' ? status : undefined,
      limit: limitNum,
      page: pageNum,
    });

    const formatted: SMSMessage[] = result.items.map((doc) => ({
      _id: String(doc._id),
      sender: doc.sender || 'Unknown',
      massage: doc.massage || doc.message || '',
      timestamp: doc.timestamp,
      receivedAt: doc.receivedAt,
      parsed: doc.parsed || parseSmsText(doc.sender, doc.massage || doc.message || ''),
      isChecked: Boolean(doc.isChecked),
      verifiedAt: doc.verifiedAt || null,
      verifiedBy: doc.verifiedBy || null,
      sourceIp: doc.sourceIp,
    }));

    return res.json({
      success: true,
      data: formatted,
      pagination: {
        total: result.total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(result.total / limitNum) || 1,
      },
    });
  } catch (error: any) {
    console.error('[GET /api/sms Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
      details: error?.message,
    });
  }
}

apiRouter.get('/sms', handleGetSms);
apiRouter.get('/messages', handleGetSms);
apiRouter.get('/transactions', handleGetSms);

/**
 * =========================================================================
 * PAYMENT VERIFICATION API ENDPOINTS
 * POST /api/verify-payment, GET /api/verify-payment, POST /api/verify, GET /api/verify
 * =========================================================================
 * Required Parameters (All 4 are strictly mandatory):
 * - trxId (string): Transaction ID e.g. "9K8L7M6N5P"
 * - sender (string): Payment gateway e.g. "bkash" | "nagad" | "rocket" | "upay"
 * - number (string): Customer mobile number e.g. "01712345678"
 * - amount (number): Expected amount in BDT e.g. 1500
 */
async function handleVerifyPayment(req: Request, res: Response) {
  try {
    const params = req.method === 'POST' ? req.body || {} : req.query || {};

    const trxId = String(
      params.trxId || params.trxid || params.trx_id || params.txnid || params.transaction_id || ''
    ).trim();

    const expectedSender = String(params.sender || params.provider || '').trim().toLowerCase();

    const expectedNumber = String(
      params.number || params.mobileNumber || params.phone || params.senderNumber || params.customerNumber || ''
    ).trim();

    const expectedAmountRaw =
      params.amount !== undefined && params.amount !== null && params.amount !== ''
        ? parseFloat(String(params.amount).replace(/,/g, ''))
        : NaN;

    // Validate that ALL 4 required parameters are provided
    const missingFields: string[] = [];
    if (!trxId) missingFields.push('trxId');
    if (!expectedSender) missingFields.push('sender');
    if (!expectedNumber) missingFields.push('number');
    if (isNaN(expectedAmountRaw) || expectedAmountRaw <= 0) missingFields.push('amount');

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        verified: false,
        code: 'MISSING_REQUIRED_FIELDS',
        message: `All 4 parameters (trxId, sender, number, amount) are required for payment verification. Missing or invalid: [${missingFields.join(', ')}].`,
        missingFields,
        provided: {
          trxId: trxId || null,
          sender: expectedSender || null,
          number: expectedNumber || null,
          amount: isNaN(expectedAmountRaw) ? null : expectedAmountRaw,
        },
      });
    }

    const expectedAmount = expectedAmountRaw;

    // 1. Search for matching transaction by TrxID in DB
    const transaction = await findTransactionByTrxId(trxId);

    // If transaction not found in database -> payment failed
    if (!transaction) {
      return res.status(404).json({
        success: false,
        verified: false,
        code: 'TRANSACTION_NOT_FOUND',
        message: `No transaction found with TrxID '${trxId}'.`,
        data: {
          trxId,
          sender: expectedSender,
          number: expectedNumber,
          amount: expectedAmount,
        },
      });
    }

    // 2. Check if transaction has already been verified / used -> duplicate attempt
    if (transaction.isChecked === true) {
      return res.status(409).json({
        success: false,
        verified: false,
        code: 'ALREADY_VERIFIED',
        message: `This transaction (TrxID: ${transaction.parsed?.trxId || trxId}) has already been verified and cannot be reused.`,
        data: {
          _id: transaction._id,
          sender: transaction.sender,
          provider: transaction.parsed?.provider,
          amount: transaction.parsed?.amount,
          trxId: transaction.parsed?.trxId,
          mobileNumber: transaction.parsed?.mobileNumber || transaction.parsed?.counterparty,
          isChecked: true,
          verifiedAt: transaction.verifiedAt,
          receivedAt: transaction.receivedAt,
        },
      });
    }

    // 3. Check Sender / Gateway match (case-insensitive) -> fail if mismatch
    const actualSender = (transaction.sender || '').toLowerCase();
    const actualProvider = (transaction.parsed?.provider || '').toLowerCase();
    const expSender = expectedSender.toLowerCase();

    const isSenderMatch =
      actualSender === expSender ||
      actualProvider === expSender ||
      actualSender.includes(expSender) ||
      expSender.includes(actualSender) ||
      actualProvider.includes(expSender) ||
      expSender.includes(actualProvider);

    if (!isSenderMatch) {
      return res.status(422).json({
        success: false,
        verified: false,
        code: 'SENDER_MISMATCH',
        message: `Sender mismatch! Expected gateway '${expectedSender}', but transaction is from '${transaction.sender}' (${transaction.parsed?.provider || 'Unknown'}).`,
        data: {
          expectedSender,
          actualSender: transaction.sender,
          actualProvider: transaction.parsed?.provider,
          trxId: transaction.parsed?.trxId,
        },
      });
    }

    // 4. Check Customer Mobile Number match -> fail if mismatch
    const cleanExpected = expectedNumber.replace(/\D/g, '');
    const expectedLast10 = cleanExpected.slice(-10);
    const actualRaw = (transaction.parsed?.mobileNumber || transaction.parsed?.counterparty || '').replace(/\D/g, '');
    const actualMsgRaw = (transaction.massage || '').replace(/\D/g, '');

    const isNumberMatch =
      (actualRaw && (actualRaw === cleanExpected || actualRaw.endsWith(expectedLast10) || cleanExpected.endsWith(actualRaw.slice(-10)))) ||
      (actualMsgRaw.includes(expectedLast10) && expectedLast10.length >= 8);

    if (!isNumberMatch) {
      return res.status(422).json({
        success: false,
        verified: false,
        code: 'NUMBER_MISMATCH',
        message: `Customer mobile number mismatch! Expected '${expectedNumber}', but transaction was from '${transaction.parsed?.mobileNumber || transaction.parsed?.counterparty || 'Unknown'}'.`,
        data: {
          expectedNumber,
          actualNumber: transaction.parsed?.mobileNumber || transaction.parsed?.counterparty,
          trxId: transaction.parsed?.trxId,
        },
      });
    }

    // 5. Check Amount match -> fail if mismatch
    const parsedAmount = transaction.parsed?.amount;
    if (parsedAmount === null || parsedAmount === undefined || Math.abs(parsedAmount - expectedAmount) > 0.01) {
      return res.status(422).json({
        success: false,
        verified: false,
        code: 'AMOUNT_MISMATCH',
        message: `Amount mismatch! Expected ৳${expectedAmount.toFixed(2)}, but actual transaction amount is ৳${(parsedAmount ?? 0).toFixed(2)}.`,
        data: {
          expectedAmount,
          actualAmount: parsedAmount ?? null,
          trxId: transaction.parsed?.trxId,
        },
      });
    }

    // 6. ALL 4 CHECKS MATCHED! -> Mark as verified (isChecked = true)
    const verifiedAt = new Date().toISOString();
    const updated = await updateTransactionVerification(transaction._id, true, verifiedAt, 'API Verification');

    const finalDoc: SMSMessage = {
      _id: String(updated._id),
      sender: updated.sender,
      massage: updated.massage || '',
      timestamp: updated.timestamp,
      receivedAt: updated.receivedAt,
      parsed: updated.parsed,
      isChecked: true,
      verifiedAt,
      verifiedBy: 'API Verification',
      sourceIp: updated.sourceIp,
    };

    console.log(`[Payment Verified Successfully] TrxID: ${finalDoc.parsed?.trxId} | Sender: ${finalDoc.sender} | Number: ${finalDoc.parsed?.mobileNumber} | Amount: ${finalDoc.parsed?.amount}`);

    // Broadcast update in real-time
    broadcastSmsEvent('status_update', finalDoc);

    return res.status(200).json({
      success: true,
      verified: true,
      code: 'VERIFIED_SUCCESS',
      message: `Payment successfully verified for TrxID: ${finalDoc.parsed?.trxId || 'N/A'} (Amount: BDT ${finalDoc.parsed?.amount ?? 0}). All 4 parameters matched.`,
      data: {
        _id: finalDoc._id,
        sender: finalDoc.sender,
        provider: finalDoc.parsed?.provider,
        amount: finalDoc.parsed?.amount,
        currency: finalDoc.parsed?.currency || 'BDT',
        trxId: finalDoc.parsed?.trxId,
        mobileNumber: finalDoc.parsed?.mobileNumber || finalDoc.parsed?.counterparty,
        type: finalDoc.parsed?.type,
        isChecked: true,
        verifiedAt,
        receivedAt: finalDoc.receivedAt,
      },
    });
  } catch (error: any) {
    console.error('[Verify Payment Error]:', error);
    return res.status(500).json({
      success: false,
      verified: false,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error while verifying payment',
      details: error?.message,
    });
  }
}

apiRouter.post('/verify-payment', handleVerifyPayment);
apiRouter.get('/verify-payment', handleVerifyPayment);
apiRouter.post('/verify', handleVerifyPayment);
apiRouter.get('/verify', handleVerifyPayment);

/**
 * PATCH /api/transactions/:id/check or /api/sms/:id/check
 * Manual toggle or update of isChecked status
 */
async function handleToggleCheck(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body = req.body || {};
    
    // If isChecked is explicitly passed, use it; otherwise toggle
    let newStatus = body.isChecked;
    const note = body.note || 'Manual Toggle (Dashboard)';

    const all = await querySmsMessages({ limit: 500 });
    const existing = all.items.find((m) => String(m._id) === String(id));

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    if (newStatus === undefined) {
      newStatus = !Boolean(existing.isChecked);
    }

    const verifiedAt = newStatus ? new Date().toISOString() : null;
    const verifiedBy = newStatus ? note : null;

    const updated = await updateTransactionVerification(id, newStatus, verifiedAt, verifiedBy);

    const resultDoc: SMSMessage = {
      _id: String(updated._id),
      sender: updated.sender,
      massage: updated.massage || '',
      timestamp: updated.timestamp,
      receivedAt: updated.receivedAt,
      parsed: updated.parsed,
      isChecked: newStatus,
      verifiedAt,
      verifiedBy,
      sourceIp: updated.sourceIp,
    };

    broadcastSmsEvent('status_update', resultDoc);

    return res.json({
      success: true,
      message: `Transaction marked as ${newStatus ? 'Verified (Checked)' : 'Unverified (Unchecked)'}`,
      data: resultDoc,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message });
  }
}

apiRouter.patch('/transactions/:id/check', handleToggleCheck);
apiRouter.patch('/sms/:id/check', handleToggleCheck);
apiRouter.post('/transactions/:id/verify', handleToggleCheck);

/**
 * GET /api/senders
 * Returns list of unique senders with message count
 */
apiRouter.get('/senders', async (_req: Request, res: Response) => {
  try {
    const all = await querySmsMessages({ limit: 500 });
    const countMap: Record<string, number> = {};
    for (const item of all.items) {
      const s = item.sender || 'Unknown';
      countMap[s] = (countMap[s] || 0) + 1;
    }

    const senders = Object.entries(countMap).map(([sender, count]) => ({
      sender,
      count,
    })).sort((a, b) => b.count - a.count);

    return res.json({
      success: true,
      senders,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message });
  }
});

/**
 * GET /api/stats
 * Aggregate dashboard metrics
 */
apiRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const all = await querySmsMessages({ limit: 500 });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();

    let totalCredit = 0;
    let totalDebit = 0;
    let todayCount = 0;
    let checkedCount = 0;
    let uncheckedCount = 0;
    const sendersSet = new Set<string>();
    const providerStats: Record<string, number> = {};

    for (const item of all.items) {
      if (item.sender) sendersSet.add(item.sender);
      const isToday = new Date(item.receivedAt).getTime() >= todayMs;
      if (isToday) todayCount++;

      const isChecked = Boolean(item.isChecked);
      if (isChecked) {
        checkedCount++;
      } else {
        uncheckedCount++;
      }

      const p = item.parsed?.provider || 'General';
      providerStats[p] = (providerStats[p] || 0) + 1;

      if (item.parsed?.amount) {
        if (item.parsed.isCredit === true) {
          totalCredit += item.parsed.amount;
        } else if (item.parsed.isCredit === false) {
          totalDebit += item.parsed.amount;
        }
      }
    }

    return res.json({
      success: true,
      stats: {
        totalCount: all.total,
        todayCount,
        totalCreditAmount: totalCredit,
        totalDebitAmount: totalDebit,
        checkedCount,
        uncheckedCount,
        uniqueSendersCount: sendersSet.size,
        providerStats,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message });
  }
});

/**
 * DELETE /api/sms/:id & /api/transactions/:id
 */
async function handleDelete(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const deleted = await deleteSmsMessage(id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    broadcastSmsEvent('delete_sms', { id });
    return res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message });
  }
}

apiRouter.delete('/sms/:id', handleDelete);
apiRouter.delete('/transactions/:id', handleDelete);

/**
 * POST /api/sms/test-sample
 */
apiRouter.post('/sms/test-sample', async (_req: Request, res: Response) => {
  try {
    const now = Date.now();
    const samples = [
      {
        sender: 'bKash',
        massage: `You have received Tk 1,500.00 from 01712345678. Ref Order#101. Fee Tk 0.00. Balance Tk 4,850.50. TrxID 9K8L7M6N5P at 26/08/2026 09:15`,
        timestamp: now,
        isChecked: false,
      },
      {
        sender: 'Nagad',
        massage: `Cash In Amount: Tk 2,500.00 Sender: 01898765432 TxnID: 71X89KZ1 Balance: Tk 7,350.00 Time: 26-08-2026 08:30:15`,
        timestamp: now - 1800000,
        isChecked: true,
        verifiedAt: new Date(now - 900000).toISOString(),
        verifiedBy: 'API (Webhook Order#98)',
      },
      {
        sender: 'Rocket',
        massage: `You have received Tk 800.00 from A/C: 01955667788 TxnId: 489201948 Balance: Tk 2,100.00`,
        timestamp: now - 3600000,
        isChecked: false,
      },
      {
        sender: 'bKash',
        massage: `You have received Tk 3,200.00 from 01677889900. Ref VIP-Sub. Fee Tk 0.00. Balance Tk 8,050.50. TrxID 9A2B3C4D5E at 26/08/2026 07:05`,
        timestamp: now - 7200000,
        isChecked: false,
      },
      {
        sender: 'bKash',
        massage: `Send Money Tk 500.00 to 01300112233 successful. Ref groceries. Fee Tk 5.00. Balance Tk 4,345.50. TrxID 8A7B6C5D4E at 25/08/2026 21:00`,
        timestamp: now - 10800000,
        isChecked: false,
      },
      {
        sender: 'Upay',
        massage: `You have received Tk 1,200.00 from 01755443322. TxnID: UP88776655. Fee Tk 0.00. Balance Tk 3,400.00.`,
        timestamp: now - 14400000,
        isChecked: false,
      },
      {
        sender: 'CityBank',
        massage: `Your A/C 1102938475 has been credited with BDT 12,000.00 on 26/08/2026. Ref: Salary deposit. Available Bal: BDT 45,200.00`,
        timestamp: now - 28800000,
        isChecked: true,
        verifiedAt: new Date(now - 25000000).toISOString(),
        verifiedBy: 'System Auto-Verify',
      },
    ];

    const insertedDocs: any[] = [];

    for (const sample of samples) {
      const receivedAt = new Date(sample.timestamp).toISOString();
      const parsed = parseSmsText(sample.sender, sample.massage);
      const doc = {
        sender: sample.sender.toLowerCase(),
        massage: sample.massage,
        timestamp: sample.timestamp,
        receivedAt,
        parsed,
        isChecked: Boolean(sample.isChecked),
        verifiedAt: sample.verifiedAt || null,
        verifiedBy: sample.verifiedBy || null,
        sourceIp: 'sample-simulator',
      };
      const { id } = await saveSmsMessage(doc);
      insertedDocs.push({ _id: id, ...doc });
    }

    broadcastSmsEvent('bulk_update', { count: insertedDocs.length });

    return res.json({
      success: true,
      message: `Successfully seeded ${insertedDocs.length} realistic Bangladeshi MFS transactions into database`,
      data: insertedDocs,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message });
  }
});
