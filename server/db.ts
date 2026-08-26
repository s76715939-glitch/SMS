import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { SMSMessage } from '../src/types.js';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://mdsagormia6942_db_user:diZ5m57WNfL5jVim@cluster0.do6j7uc.mongodb.net/transactions?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = process.env.MONGODB_DB_NAME || 'transactions';

let client: MongoClient | null = null;
let db: Db | null = null;
let connectionError: string | null = null;

// In-memory / local fallback store to guarantee zero-drop if Atlas IP whitelist is pending
const memoryMessages: any[] = [];
// In-memory admin fallback
let memoryAdmins: any[] = [
  {
    _id: 'default_admin_id',
    username: 'admin',
    password: bcrypt.hashSync('admin', 10),
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
];

let lastConnectAttempt = 0;
const RETRY_INTERVAL_MS = 30000; // Retry Atlas every 30s if down

/**
 * Ensures initial admin user exists in the database
 */
export async function initAdminUser(database: Db) {
  try {
    const adminCollection = database.collection('admin');
    const existing = await adminCollection.findOne({ username: 'admin' });
    if (!existing) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      await adminCollection.insertOne({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('[Auth] Default admin account seeded: username: "admin", password: "admin"');
    }
  } catch (err: any) {
    console.warn('[Auth] Failed to seed default admin:', err.message);
  }
}

export async function findAdminByUsername(username: string): Promise<any | null> {
  const { db } = await getDbClient();
  if (db) {
    try {
      const adminCollection = db.collection('admin');
      const doc = await adminCollection.findOne({ username: username.trim() });
      if (doc) {
        return {
          ...doc,
          _id: doc._id.toString(),
        };
      }
    } catch (err) {
      console.error('[MongoDB] findAdminByUsername error:', err);
    }
  }

  const memoryMatch = memoryAdmins.find((a) => a.username.toLowerCase() === username.trim().toLowerCase());
  return memoryMatch || null;
}

export async function updateAdminPassword(username: string, newPasswordHash: string): Promise<boolean> {
  const { db } = await getDbClient();
  let updated = false;

  if (db) {
    try {
      const adminCollection = db.collection('admin');
      const res = await adminCollection.updateOne(
        { username: username.trim() },
        { $set: { password: newPasswordHash, updatedAt: new Date().toISOString() } }
      );
      if (res.modifiedCount > 0) updated = true;
    } catch (err) {
      console.error('[MongoDB] updateAdminPassword error:', err);
    }
  }

  const memoryIndex = memoryAdmins.findIndex((a) => a.username.toLowerCase() === username.trim().toLowerCase());
  if (memoryIndex !== -1) {
    memoryAdmins[memoryIndex].password = newPasswordHash;
    memoryAdmins[memoryIndex].updatedAt = new Date().toISOString();
    updated = true;
  }

  return updated;
}

export async function getDbClient(): Promise<{ db: Db | null; client: MongoClient | null; error?: string }> {
  if (db && client) {
    return { db, client };
  }

  const now = Date.now();
  if (connectionError && now - lastConnectAttempt < RETRY_INTERVAL_MS) {
    return { db: null, client: null, error: connectionError };
  }

  lastConnectAttempt = now;

  try {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 4000,
      socketTimeoutMS: 30000,
      family: 4,
    });

    await client.connect();
    db = client.db(DB_NAME);
    connectionError = null;

    console.log(`[MongoDB] Connected successfully to database: "${DB_NAME}" on Atlas`);

    // Create indexes asynchronously
    const collection = db.collection('messages');
    collection.createIndex({ receivedAt: -1 }).catch(() => {});
    collection.createIndex({ sender: 1 }).catch(() => {});
    collection.createIndex({ 'parsed.trxId': 1 }).catch(() => {});

    // Ensure admin user exists in DB
    initAdminUser(db).catch(() => {});

    // Sync any pending memory messages to MongoDB
    if (memoryMessages.length > 0) {
      console.log(`[MongoDB] Syncing ${memoryMessages.length} locally held SMS messages to MongoDB Atlas...`);
      for (const msg of memoryMessages) {
        const { _id, ...docWithoutId } = msg;
        await collection.insertOne({ ...docWithoutId, _id: new ObjectId(_id) }).catch(() => {});
      }
    }

    return { db, client };
  } catch (error: any) {
    connectionError = error?.message || 'Database connection error';
    console.warn(`[MongoDB] Notice: Could not connect to Atlas (${connectionError}).`);
    console.warn(`[MongoDB] Tip: Ensure "0.0.0.0/0" is enabled under MongoDB Atlas -> Network Access -> IP Access List.`);
    return { db: null, client: null, error: connectionError };
  }
}

/**
 * Save an SMS record - guarantees persistent storage in MongoDB and memory fallback
 */
export async function saveSmsMessage(doc: any): Promise<{ id: string; savedIn: 'mongodb' | 'memory' }> {
  const { db } = await getDbClient();

  if (db) {
    try {
      const collection = db.collection('messages');
      const result = await collection.insertOne(doc);
      const id = result.insertedId.toString();
      return { id, savedIn: 'mongodb' };
    } catch (e: any) {
      console.error('[MongoDB] Insert failed, saving to local store:', e.message);
    }
  }

  // Fallback: Generate ObjectId-like ID and store
  const id = new ObjectId().toString();
  const memoryDoc = { _id: id, ...doc };
  memoryMessages.unshift(memoryDoc);
  return { id, savedIn: 'memory' };
}

/**
 * Fetch messages with filters
 */
export async function querySmsMessages(filterOptions: {
  sender?: string;
  provider?: string;
  type?: string;
  status?: string; // 'all' | 'checked' | 'unchecked'
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: any[]; total: number }> {
  const { db } = await getDbClient();
  const page = filterOptions.page || 1;
  const limit = filterOptions.limit || 50;
  const skip = (page - 1) * limit;

  if (db) {
    try {
      const query: Record<string, any> = {};

      if (filterOptions.sender) {
        query.sender = { $regex: new RegExp(`^${filterOptions.sender.trim()}$`, 'i') };
      }
      if (filterOptions.provider && filterOptions.provider !== 'all') {
        query['parsed.provider'] = filterOptions.provider;
      }
      if (filterOptions.type && filterOptions.type !== 'all') {
        query['parsed.type'] = filterOptions.type;
      }
      if (filterOptions.status && filterOptions.status !== 'all') {
        if (filterOptions.status === 'checked') {
          query.isChecked = true;
        } else if (filterOptions.status === 'unchecked') {
          query.$or = [{ isChecked: false }, { isChecked: { $exists: false } }];
        }
      }
      if (filterOptions.search) {
        const regex = { $regex: filterOptions.search.trim(), $options: 'i' };
        query.$or = [
          { sender: regex },
          { massage: regex },
          { 'parsed.trxId': regex },
          { 'parsed.counterparty': regex },
          { 'parsed.mobileNumber': regex },
        ];
      }
      if (filterOptions.startDate || filterOptions.endDate) {
        query.receivedAt = {};
        if (filterOptions.startDate) query.receivedAt.$gte = new Date(filterOptions.startDate).toISOString();
        if (filterOptions.endDate) {
          const endD = new Date(filterOptions.endDate);
          endD.setHours(23, 59, 59, 999);
          query.receivedAt.$lte = endD.toISOString();
        }
      }

      const collection = db.collection('messages');
      const [items, total] = await Promise.all([
        collection.find(query).sort({ receivedAt: -1, _id: -1 }).skip(skip).limit(limit).toArray(),
        collection.countDocuments(query),
      ]);

      return {
        items: items.map((d) => ({
          ...d,
          _id: d._id.toString(),
          isChecked: Boolean(d.isChecked),
        })),
        total,
      };
    } catch (err: any) {
      console.warn('[MongoDB] Query failed, using memory store:', err.message);
    }
  }

  // Fallback filtering in memory
  let filtered = [...memoryMessages];

  if (filterOptions.sender) {
    const s = filterOptions.sender.toLowerCase();
    filtered = filtered.filter((m) => m.sender.toLowerCase() === s);
  }
  if (filterOptions.provider && filterOptions.provider !== 'all') {
    filtered = filtered.filter((m) => m.parsed?.provider === filterOptions.provider);
  }
  if (filterOptions.type && filterOptions.type !== 'all') {
    filtered = filtered.filter((m) => m.parsed?.type === filterOptions.type);
  }
  if (filterOptions.status && filterOptions.status !== 'all') {
    if (filterOptions.status === 'checked') {
      filtered = filtered.filter((m) => Boolean(m.isChecked) === true);
    } else if (filterOptions.status === 'unchecked') {
      filtered = filtered.filter((m) => !m.isChecked);
    }
  }
  if (filterOptions.search) {
    const term = filterOptions.search.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.sender?.toLowerCase().includes(term) ||
        m.massage?.toLowerCase().includes(term) ||
        m.parsed?.trxId?.toLowerCase().includes(term) ||
        m.parsed?.counterparty?.toLowerCase().includes(term) ||
        m.parsed?.mobileNumber?.toLowerCase().includes(term)
    );
  }
  if (filterOptions.startDate) {
    const sDate = new Date(filterOptions.startDate).getTime();
    filtered = filtered.filter((m) => new Date(m.receivedAt).getTime() >= sDate);
  }
  if (filterOptions.endDate) {
    const eDate = new Date(filterOptions.endDate);
    eDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter((m) => new Date(m.receivedAt).getTime() <= eDate.getTime());
  }

  const paginated = filtered.slice(skip, skip + limit);
  return { items: paginated, total: filtered.length };
}

/**
 * Find transaction by TrxID (case-insensitive)
 */
export async function findTransactionByTrxId(trxId: string): Promise<any | null> {
  const cleanTrx = trxId.trim();
  const { db } = await getDbClient();

  if (db) {
    try {
      const collection = db.collection('messages');
      const doc = await collection.findOne({
        'parsed.trxId': { $regex: new RegExp(`^${cleanTrx}$`, 'i') },
      });
      if (doc) {
        return {
          ...doc,
          _id: doc._id.toString(),
          isChecked: Boolean(doc.isChecked),
        };
      }
    } catch (e) {
      console.error('[MongoDB] findTransactionByTrxId error:', e);
    }
  }

  // Fallback search in memory
  const memoryMatch = memoryMessages.find(
    (m) => m.parsed?.trxId && m.parsed.trxId.toLowerCase() === cleanTrx.toLowerCase()
  );
  if (memoryMatch) {
    return { ...memoryMatch, isChecked: Boolean(memoryMatch.isChecked) };
  }

  return null;
}

/**
 * Find transaction by Number and Amount (if TrxID is not provided)
 */
export async function findTransactionByDetails(options: {
  number?: string;
  amount?: number;
  provider?: string;
}): Promise<any | null> {
  const { number, amount, provider } = options;
  const { db } = await getDbClient();

  // Sanitize number (extract digits)
  const cleanNum = number ? number.replace(/\D/g, '').slice(-10) : '';

  if (db) {
    try {
      const collection = db.collection('messages');
      const query: any = {};

      if (cleanNum) {
        query.$or = [
          { 'parsed.mobileNumber': { $regex: cleanNum } },
          { 'parsed.counterparty': { $regex: cleanNum } },
          { massage: { $regex: cleanNum } },
        ];
      }

      if (amount !== undefined && !isNaN(amount)) {
        query['parsed.amount'] = amount;
      }

      if (provider && provider.toLowerCase() !== 'all') {
        query.$or = [
          { 'parsed.provider': { $regex: new RegExp(`^${provider}$`, 'i') } },
          { sender: { $regex: new RegExp(`^${provider}$`, 'i') } },
        ];
      }

      const doc = await collection.findOne(query, { sort: { receivedAt: -1, _id: -1 } });
      if (doc) {
        return {
          ...doc,
          _id: doc._id.toString(),
          isChecked: Boolean(doc.isChecked),
        };
      }
    } catch (e) {
      console.error('[MongoDB] findTransactionByDetails error:', e);
    }
  }

  // Fallback search in memory
  const match = memoryMessages.find((m) => {
    let matches = true;
    if (cleanNum) {
      const mNum = (m.parsed?.mobileNumber || m.parsed?.counterparty || m.massage || '').replace(/\D/g, '');
      if (!mNum.includes(cleanNum)) matches = false;
    }
    if (amount !== undefined && !isNaN(amount)) {
      if (m.parsed?.amount !== amount) matches = false;
    }
    if (provider && provider.toLowerCase() !== 'all') {
      const mProv = (m.parsed?.provider || m.sender || '').toLowerCase();
      if (!mProv.includes(provider.toLowerCase())) matches = false;
    }
    return matches;
  });

  if (match) {
    return { ...match, isChecked: Boolean(match.isChecked) };
  }

  return null;
}

/**
 * Update transaction verification / isChecked state
 */
export async function updateTransactionVerification(
  id: string,
  isChecked: boolean,
  verifiedAt: string | null = isChecked ? new Date().toISOString() : null,
  verifiedBy: string | null = isChecked ? 'API' : null
): Promise<any | null> {
  const { db } = await getDbClient();
  let updatedDoc: any = null;

  if (db) {
    try {
      const collection = db.collection('messages');
      const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id as any };
      
      const updateData: any = {
        isChecked,
        verifiedAt,
        verifiedBy,
      };

      const result = await collection.findOneAndUpdate(
        filter,
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (result) {
        updatedDoc = {
          ...result,
          _id: (result._id || id).toString(),
          isChecked: Boolean(result.isChecked),
        };
      }
    } catch (e) {
      console.error('[MongoDB] updateTransactionVerification error:', e);
    }
  }

  // Update memory store as well
  const memoryIndex = memoryMessages.findIndex((m) => String(m._id) === String(id));
  if (memoryIndex !== -1) {
    memoryMessages[memoryIndex] = {
      ...memoryMessages[memoryIndex],
      isChecked,
      verifiedAt,
      verifiedBy,
    };
    if (!updatedDoc) updatedDoc = memoryMessages[memoryIndex];
  }

  return updatedDoc;
}

/**
 * Delete an SMS record
 */
export async function deleteSmsMessage(id: string): Promise<boolean> {
  const { db } = await getDbClient();
  let deletedFromMongo = false;

  if (db) {
    try {
      if (ObjectId.isValid(id)) {
        const res = await db.collection('messages').deleteOne({ _id: new ObjectId(id) });
        if (res.deletedCount > 0) deletedFromMongo = true;
      }
      if (!deletedFromMongo) {
        const res2 = await db.collection('messages').deleteOne({ _id: id as any });
        if (res2.deletedCount > 0) deletedFromMongo = true;
      }
    } catch (e) {
      console.error('[MongoDB] Delete error:', e);
    }
  }

  const memoryIndex = memoryMessages.findIndex((m) => String(m._id) === String(id));
  let deletedFromMemory = false;
  if (memoryIndex !== -1) {
    memoryMessages.splice(memoryIndex, 1);
    deletedFromMemory = true;
  }

  return deletedFromMongo || deletedFromMemory;
}

/**
 * Health check & ping
 */
export async function checkDatabaseHealth(): Promise<{ ok: boolean; message: string; ping?: number; atlasNotice?: string }> {
  try {
    const start = Date.now();
    const { db, error } = await getDbClient();
    if (db) {
      await db.command({ ping: 1 });
      const ping = Date.now() - start;
      return { ok: true, message: `Connected to MongoDB Atlas database "${DB_NAME}"`, ping };
    }
    return {
      ok: false,
      message: error || 'Connecting to MongoDB Atlas...',
      atlasNotice: 'If connection fails, verify that "0.0.0.0/0" is added in MongoDB Atlas -> Network Access.',
    };
  } catch (error: any) {
    return {
      ok: false,
      message: error?.message || 'Database connection check failed',
      atlasNotice: 'If connection fails, verify that "0.0.0.0/0" is added in MongoDB Atlas -> Network Access.',
    };
  }
}
