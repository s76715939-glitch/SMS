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
  isCredit: boolean; // strictly true for money received / inflow
  refNote?: string | null;
}

export interface SMSMessage {
  _id: string;
  sender: string;
  massage: string; // Raw SMS content
  timestamp: string | number;
  receivedAt: string;
  parsed: ParsedData;
  
  // Verification and Status
  isChecked: boolean; // false = Pending/Unverified, true = Checked/Verified
  verifiedAt?: string | null;
  verifiedBy?: string | null; // e.g. "API", "Manual Admin", "Order #45"
  
  sourceIp?: string;
}

export interface SMSStats {
  totalCount: number;
  todayCount: number;
  totalReceivedAmount: number;
  checkedCount: number;
  uncheckedCount: number;
  uniqueSendersCount: number;
  providerStats: { [key: string]: number };
}

export interface SMSFilterParams {
  sender?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  provider?: string;
  type?: string;
  status?: 'all' | 'checked' | 'unchecked';
  minAmount?: number;
  maxAmount?: number;
}

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'superadmin';
  createdAt?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface PaymentVerifyRequest {
  trxId: string;
  sender: string;
  number: string;
  amount: number;
}

export type PaymentVerifyCode =
  | 'VERIFIED_SUCCESS'
  | 'ALREADY_VERIFIED'
  | 'TRANSACTION_NOT_FOUND'
  | 'AMOUNT_MISMATCH'
  | 'NUMBER_MISMATCH'
  | 'SENDER_MISMATCH'
  | 'PROVIDER_MISMATCH'
  | 'MISSING_REQUIRED_FIELDS'
  | 'INVALID_INPUT'
  | 'INTERNAL_ERROR';

export interface PaymentVerifyResponse {
  success: boolean;
  verified: boolean;
  code: PaymentVerifyCode;
  message: string;
  data?: any;
  searchCriteria?: {
    trxId?: string;
    sender?: string;
    number?: string;
    amount?: number;
  };
}


