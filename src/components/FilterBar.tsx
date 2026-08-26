import React, { useState } from 'react';
import { Calendar, RotateCcw, Search, X } from 'lucide-react';
import { SMSFilterParams } from '../types';

interface FilterBarProps {
  filters: SMSFilterParams;
  onFilterChange: (filters: SMSFilterParams) => void;
  sendersList: { sender: string; count: number }[];
  onReset: () => void;
  totalFiltered: number;
}

export function FilterBar({
  filters,
  onFilterChange,
  sendersList,
  onReset,
  totalFiltered,
}: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ ...filters, search: searchInput });
  };

  const handleSenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onFilterChange({ ...filters, sender: val === 'all' ? '' : val });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as 'all' | 'checked' | 'unchecked';
    onFilterChange({ ...filters, status: val });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', val: string) => {
    onFilterChange({ ...filters, [field]: val });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onFilterChange({ ...filters, type: val === 'all' ? '' : val });
  };

  const hasActiveFilters = Boolean(
    filters.sender ||
      filters.search ||
      filters.startDate ||
      filters.endDate ||
      filters.type ||
      (filters.status && filters.status !== 'all') ||
      (filters.provider && filters.provider !== 'all')
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by TrxID, Mobile (017...), Sender or SMS text..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-24 text-xs font-medium text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                onFilterChange({ ...filters, search: '' });
              }}
              className="absolute right-20 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95 shadow-xs"
          >
            Search
          </button>
        </form>

        {/* Dropdowns & Pickers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter (isChecked) */}
          <div className="relative min-w-[130px] flex-1 sm:flex-none">
            <select
              value={filters.status || 'all'}
              onChange={handleStatusChange}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-bold text-slate-700 transition hover:border-slate-300 focus:border-emerald-500 focus:outline-none shadow-xs"
            >
              <option value="all">All Status</option>
              <option value="unchecked">⏳ Pending Verification</option>
              <option value="checked">✅ Verified (Checked)</option>
            </select>
          </div>

          {/* Sender Filter */}
          <div className="relative min-w-[130px] flex-1 sm:flex-none">
            <select
              value={filters.sender || 'all'}
              onChange={handleSenderChange}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 focus:border-emerald-500 focus:outline-none shadow-xs"
            >
              <option value="all">All Senders</option>
              {sendersList.map((s) => (
                <option key={s.sender} value={s.sender}>
                  {s.sender} ({s.count})
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Type Filter */}
          <div className="relative min-w-[125px] flex-1 sm:flex-none">
            <select
              value={filters.type || 'all'}
              onChange={handleTypeChange}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 focus:border-emerald-500 focus:outline-none shadow-xs"
            >
              <option value="all">All Types</option>
              <option value="Received Money">Received Money</option>
              <option value="Cash In">Cash In</option>
              <option value="Send Money">Send Money</option>
              <option value="Cash Out">Cash Out</option>
              <option value="Payment">Payment</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>

          {/* Date Range Picker */}
          <div className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="date"
              title="Start Date"
              value={filters.startDate || ''}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none"
            />
            <span className="text-slate-400 text-xs font-medium">to</span>
            <input
              type="date"
              title="End Date"
              value={filters.endDate || ''}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none"
            />
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchInput('');
                onReset();
              }}
              className="inline-flex items-center space-x-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 active:scale-95 shadow-xs"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Status summary */}
      <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-500 gap-2">
        <div className="font-medium">
          Showing <span className="font-bold text-slate-900">{totalFiltered}</span> matching transactions
          {hasActiveFilters && <span className="ml-1 text-emerald-700 font-bold">(Filters active)</span>}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.status && filters.status !== 'all' && (
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
              filters.status === 'checked'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              Status: {filters.status === 'checked' ? 'Verified' : 'Pending'}
            </span>
          )}
          {filters.sender && (
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
              Sender: {filters.sender}
            </span>
          )}
          {filters.type && (
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
              Type: {filters.type}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

