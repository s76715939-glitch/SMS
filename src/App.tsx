import React, { useCallback, useEffect, useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Plus,
  Zap,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { TransactionTable } from './components/TransactionTable';
import { StatsCards } from './components/StatsCards';
import { FilterBar } from './components/FilterBar';
import { PaymentVerifyTester } from './components/PaymentVerifyTester';
import { AnalyticsView } from './components/AnalyticsView';
import { ApiDocsView } from './components/ApiDocsView';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { TestSenderModal } from './components/TestSenderModal';
import { WebhookGuideModal } from './components/WebhookGuideModal';
import { WebhookBanner } from './components/WebhookBanner';
import { LoginModal } from './components/LoginModal';
import { SMSFilterParams, SMSMessage, SMSStats } from './types';

export default function App() {
  const [auth, setAuth] = useState<{
    token: string | null;
    user: any | null;
    isAuthenticated: boolean;
  }>({
    token: localStorage.getItem('mfs_auth_token'),
    user: localStorage.getItem('mfs_auth_user') ? JSON.parse(localStorage.getItem('mfs_auth_user')!) : null,
    isAuthenticated: Boolean(localStorage.getItem('mfs_auth_token')),
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('transactions');
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [stats, setStats] = useState<SMSStats | null>(null);
  const [sendersList, setSendersList] = useState<{ sender: string; count: number }[]>([]);
  const [dbStatus, setDbStatus] = useState<{ ok: boolean; message: string; ping?: number } | null>(null);
  const [isSseConnected, setIsSseConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Filters
  const [filters, setFilters] = useState<SMSFilterParams>({
    sender: '',
    search: '',
    startDate: '',
    endDate: '',
    provider: 'all',
    type: 'all',
    status: 'all',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // Sandbox prefill state
  const [sandboxInitialTrx, setSandboxInitialTrx] = useState<string>('');
  const [sandboxInitialAmount, setSandboxInitialAmount] = useState<number | undefined>(undefined);

  // Modals
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<SMSMessage | null>(null);
  const [notification, setNotification] = useState<{ title: string; body: string } | null>(null);

  // Fetch Stats & Senders
  const fetchMetadata = useCallback(async () => {
    try {
      const [statsRes, sendersRes, healthRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/senders'),
        fetch('/api/health'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.stats);
      }

      if (sendersRes.ok) {
        const sendersData = await sendersRes.json();
        if (sendersData.success) setSendersList(sendersData.senders || []);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setDbStatus(healthData.database);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Fetch Messages with active filters & tab context
  const fetchMessages = useCallback(
    async (showLoading = false) => {
      if (showLoading) setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (filters.sender) queryParams.set('sender', filters.sender);
        if (filters.search) queryParams.set('search', filters.search);
        if (filters.startDate) queryParams.set('startDate', filters.startDate);
        if (filters.endDate) queryParams.set('endDate', filters.endDate);
        if (filters.provider && filters.provider !== 'all') queryParams.set('provider', filters.provider);
        if (filters.type && filters.type !== 'all') queryParams.set('type', filters.type);

        // Handle Tab specific filtering
        if (activeTab === 'pending') {
          queryParams.set('status', 'unchecked');
        } else if (activeTab === 'verified') {
          queryParams.set('status', 'checked');
        } else if (filters.status && filters.status !== 'all') {
          queryParams.set('status', filters.status);
        }

        queryParams.set('page', String(pagination.page));
        queryParams.set('limit', String(pagination.limit));

        const res = await fetch(`/api/sms?${queryParams.toString()}`);
        const result = await res.json();

        if (result.success) {
          setMessages(result.data || []);
          if (result.pagination) {
            setPagination((prev) => ({
              ...prev,
              total: result.pagination.total,
              totalPages: result.pagination.totalPages,
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching SMS messages:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, activeTab, pagination.page, pagination.limit]
  );

  // Setup Real-time SSE Connection
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const setupSSE = () => {
      eventSource = new EventSource('/api/events');

      eventSource.addEventListener('connected', () => {
        setIsSseConnected(true);
      });

      eventSource.addEventListener('new_sms', (event) => {
        try {
          const newDoc: SMSMessage = JSON.parse(event.data);

          // Prepend to messages
          setMessages((prev) => [newDoc, ...prev.filter((m) => m._id !== newDoc._id)]);

          // Trigger instant toast notification in English
          setNotification({
            title: `New Transaction Received (${newDoc.parsed?.provider || newDoc.sender})`,
            body: `৳${newDoc.parsed?.amount || 0} - TrxID: ${newDoc.parsed?.trxId || 'N/A'}`,
          });
          setTimeout(() => setNotification(null), 5000);

          fetchMetadata();
        } catch (e) {
          console.error('SSE new_sms parse error:', e);
        }
      });

      eventSource.addEventListener('status_update', (event) => {
        try {
          const updatedDoc: SMSMessage = JSON.parse(event.data);
          setMessages((prev) =>
            prev.map((m) => (m._id === updatedDoc._id ? { ...m, ...updatedDoc } : m))
          );
          if (selectedTransaction?._id === updatedDoc._id) {
            setSelectedTransaction(updatedDoc);
          }
          fetchMetadata();
        } catch (e) {
          console.error('SSE status_update error:', e);
        }
      });

      eventSource.addEventListener('delete_sms', (event) => {
        try {
          const { id } = JSON.parse(event.data);
          setMessages((prev) => prev.filter((m) => m._id !== id));
          if (selectedTransaction?._id === id) {
            setSelectedTransaction(null);
          }
          fetchMetadata();
        } catch (e) {
          console.error('SSE delete_sms error:', e);
        }
      });

      eventSource.addEventListener('bulk_update', () => {
        fetchMessages(false);
        fetchMetadata();
      });

      eventSource.onerror = () => {
        setIsSseConnected(false);
      };
    };

    setupSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [fetchMessages, fetchMetadata, selectedTransaction?._id]);

  // Initial load & when filters or activeTab change
  useEffect(() => {
    fetchMessages(true);
    fetchMetadata();
  }, [fetchMessages, fetchMetadata]);

  // Handle Toggle Check Status
  const handleToggleCheck = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) =>
        m._id === id
          ? {
              ...m,
              isChecked: newStatus,
              verifiedAt: newStatus ? new Date().toISOString() : undefined,
              verifiedBy: newStatus ? 'Dashboard Manual' : undefined,
            }
          : m
      )
    );

    if (selectedTransaction && selectedTransaction._id === id) {
      setSelectedTransaction((prev) =>
        prev
          ? {
              ...prev,
              isChecked: newStatus,
              verifiedAt: newStatus ? new Date().toISOString() : undefined,
              verifiedBy: newStatus ? 'Dashboard Manual' : undefined,
            }
          : null
      );
    }

    try {
      const res = await fetch(`/api/transactions/${id}/check`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isChecked: newStatus, verifiedBy: 'Dashboard Manual Toggle' }),
      });

      if (res.ok) {
        fetchMetadata();
        setNotification({
          title: newStatus ? 'Verified (isChecked: true)' : 'Marked Pending (isChecked: false)',
          body: `Transaction status was successfully updated in database.`,
        });
        setTimeout(() => setNotification(null), 3000);
      } else {
        fetchMessages(false);
      }
    } catch (err) {
      console.error('Failed to toggle verification:', err);
      fetchMessages(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m._id !== id));
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotification({
          title: 'Transaction Deleted',
          body: 'Record successfully deleted from database.',
        });
        setTimeout(() => setNotification(null), 3000);
        fetchMetadata();
      } else {
        fetchMessages(false);
      }
    } catch (err) {
      console.error('Failed to delete SMS:', err);
      fetchMessages(false);
    }
  };

  // Handle Seed Sample Transactions
  const handleSeedSample = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/sms/test-sample', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchMessages(true);
        await fetchMetadata();
        setNotification({
          title: 'Sample Data Loaded',
          body: 'Real-world bKash, Nagad, and Rocket transactions added to database.',
        });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error('Failed to seed sample SMS:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      sender: '',
      search: '',
      startDate: '',
      endDate: '',
      provider: 'all',
      type: 'all',
      status: 'all',
    });
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleQuickVerifyFromTable = (trxId: string, amount?: number) => {
    setSandboxInitialTrx(trxId);
    setSandboxInitialAmount(amount);
    setActiveTab('sandbox');
  };

  const handleLogout = () => {
    localStorage.removeItem('mfs_auth_token');
    localStorage.removeItem('mfs_auth_user');
    setAuth({ token: null, user: null, isAuthenticated: false });
  };

  if (!auth.isAuthenticated) {
    return (
      <LoginModal
        onLoginSuccess={(token, user) => {
          setAuth({ token, user, isAuthenticated: true });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 flex max-w-sm items-start space-x-3 rounded-2xl border border-emerald-200 bg-white p-4 text-slate-900 shadow-xl transition animate-in slide-in-from-bottom-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0 mt-0.5">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-slate-900 text-sm tracking-tight">{notification.title}</p>
            <p className="mt-0.5 text-slate-600 font-medium text-[11px] leading-relaxed">{notification.body}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700 transition">
            ✕
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        isConnected={isSseConnected}
        dbStatus={dbStatus}
        onRefresh={() => {
          fetchMessages(true);
          fetchMetadata();
        }}
        isLoading={isLoading}
        onOpenTestModal={() => setIsTestModalOpen(true)}
        onOpenWebhookGuide={() => setIsGuideModalOpen(true)}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        onLogout={handleLogout}
      />

      {/* Main Container: Sidebar + Content */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row">
        {/* Left Management Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          stats={stats}
          onOpenTestModal={() => setIsTestModalOpen(true)}
          onRefresh={() => {
            fetchMessages(true);
            fetchMetadata();
          }}
          isLoading={isLoading}
        />

        {/* Right Main Dynamic View Area */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
          {/* Tab 1: All Transactions / Pending / Verified (Table Views) */}
          {(activeTab === 'transactions' || activeTab === 'pending' || activeTab === 'verified') && (
            <div className="space-y-6">
              {/* Webhook & Simulator Banner */}
              <WebhookBanner onSeedSample={handleSeedSample} isSeeding={isSeeding} />

              {/* Stats KPI Cards */}
              <StatsCards
                stats={stats}
                selectedProvider={filters.provider || 'all'}
                onSelectProvider={(p) => setFilters((prev) => ({ ...prev, provider: p }))}
              />

              {/* Filter Bar */}
              <FilterBar
                filters={filters}
                onFilterChange={(newFilters) => {
                  setFilters(newFilters);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                sendersList={sendersList}
                onReset={handleResetFilters}
                totalFiltered={pagination.total}
              />

              {/* Transactions Table */}
              <TransactionTable
                transactions={messages}
                isLoading={isLoading}
                onToggleCheck={handleToggleCheck}
                onDelete={handleDelete}
                onViewDetails={(tx) => setSelectedTransaction(tx)}
                onQuickVerify={handleQuickVerifyFromTable}
              />

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border border-slate-200 bg-white px-4 py-3 rounded-2xl shadow-xs">
                  <div className="text-xs text-slate-500 font-medium">
                    Page <span className="font-bold text-slate-900">{pagination.page}</span> of{' '}
                    <span className="font-bold text-slate-900">{pagination.totalPages}</span> (
                    <span className="text-emerald-700 font-bold">{pagination.total}</span> total records)
                  </div>
                  <div className="flex space-x-2">
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                      className="inline-flex items-center space-x-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 shadow-xs"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span>Previous</span>
                    </button>
                    <button
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                      className="inline-flex items-center space-x-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 shadow-xs"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Payment Verification Sandbox */}
          {activeTab === 'sandbox' && (
            <PaymentVerifyTester
              recentTransactions={messages}
              initialTrxId={sandboxInitialTrx}
              initialAmount={sandboxInitialAmount}
              onVerificationComplete={() => {
                fetchMessages(false);
                fetchMetadata();
              }}
            />
          )}

          {/* Tab 3: Analytics View */}
          {activeTab === 'analytics' && (
            <AnalyticsView stats={stats} transactions={messages} />
          )}

          {/* Tab 4: Webhook Guide View */}
          {activeTab === 'webhook' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h2 className="text-base font-bold text-slate-900">Android SMS Forwarder Setup</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Forward SMS notifications from your Android phone in real-time using the webhook URL below.
                </p>
              </div>
              <ApiDocsView />
            </div>
          )}

          {/* Tab 5: API Docs View */}
          {activeTab === 'apidocs' && <ApiDocsView />}
        </main>
      </div>

      {/* Modals */}
      <TestSenderModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onSuccess={() => {
          fetchMessages(false);
          fetchMetadata();
        }}
      />

      <WebhookGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onToggleCheck={handleToggleCheck}
        onDelete={handleDelete}
      />
    </div>
  );
}
