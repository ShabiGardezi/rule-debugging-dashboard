'use client';

import { Transaction, RuleEvaluationResult } from '@/lib/types';
import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

interface TransactionTableProps {
  transactions: Transaction[];
  evaluations: RuleEvaluationResult[][];
  onSelectTransaction: (transaction: Transaction) => void;
  selectedTransactionId: string | null;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function TransactionTable({
  transactions,
  evaluations,
  onSelectTransaction,
  selectedTransactionId,
  currentPage,
  itemsPerPage,
  onPageChange,
}: TransactionTableProps) {
  const [sortField, setSortField] = useState<keyof Transaction | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getMatchCount = (transactionId: string): number => {
    const transaction = paginatedTransactions.find(t => t.transaction_id === transactionId);
    if (!transaction) return 0;
    
    const index = transactions.findIndex(t => t.transaction_id === transactionId);
    if (index === -1) return 0;
    
    const transactionEvaluations = evaluations[index];
    if (!transactionEvaluations || !Array.isArray(transactionEvaluations)) return 0;
    
    return transactionEvaluations.filter(e => e && e.matches === true).length;
  };

  const SortIcon = ({ field }: { field: keyof Transaction }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline" />
    ) : (
      <ChevronDown className="w-4 h-4 inline" />
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString.replace(' ', 'T'));
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th
                className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wide cursor-pointer hover:bg-gray-200 transition-colors min-w-[180px]"
                onClick={() => handleSort('transaction_id')}
              >
                <div className="flex items-center gap-2">
                  Transaction ID
                  <SortIcon field="transaction_id" />
                </div>
              </th>
              <th
                className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wide cursor-pointer hover:bg-gray-200 transition-colors min-w-[160px]"
                onClick={() => handleSort('txn_date_time')}
              >
                <div className="flex items-center gap-2">
                  Date & Time
                  <SortIcon field="txn_date_time" />
                </div>
              </th>
              <th
                className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wide cursor-pointer hover:bg-gray-200 transition-colors min-w-[140px]"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center gap-2">
                  Amount
                  <SortIcon field="amount" />
                </div>
              </th>
              <th
                className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wide cursor-pointer hover:bg-gray-200 transition-colors min-w-[120px]"
                onClick={() => handleSort('transaction_type')}
              >
                <div className="flex items-center gap-2">
                  Type
                  <SortIcon field="transaction_type" />
                </div>
              </th>
              <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wide min-w-[140px]">
                Merchant
              </th>
              <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wide min-w-[160px]">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedTransactions.map((transaction) => {
              const matchCount = getMatchCount(transaction.transaction_id);
              const isSelected = transaction.transaction_id === selectedTransactionId;
              
              return (
                <tr
                  key={transaction.transaction_id}
                  onClick={() => onSelectTransaction(transaction)}
                  className={clsx(
                    'cursor-pointer transition-all duration-200',
                    isSelected 
                      ? 'bg-blue-50 border-l-4 border-blue-500 shadow-sm' 
                      : 'hover:bg-gray-50 hover:shadow-sm'
                  )}
                >
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-mono font-semibold text-gray-900">
                        {transaction.transaction_id}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(transaction.txn_date_time)}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-base font-bold text-gray-900">
                      {formatAmount(transaction.amount, transaction.currency)}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
                      {transaction.transaction_type || 'N/A'}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col max-w-[200px]">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {transaction.merchant_description_condensed || 'N/A'}
                      </span>
                      {transaction.merchant_country && (
                        <span className="text-xs text-gray-500 mt-0.5">
                          {transaction.merchant_country}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {matchCount > 0 ? (
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-red-50 text-red-700 border-2 border-red-200">
                        <AlertCircle className="w-4 h-4" />
                        {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-green-50 text-green-700 border-2 border-green-200">
                        <CheckCircle2 className="w-4 h-4" />
                        Safe
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="text-sm text-gray-600">
          Showing <span className="font-bold text-gray-900">{startIndex + 1}</span> to{' '}
          <span className="font-bold text-gray-900">{Math.min(endIndex, transactions.length)}</span> of{' '}
          <span className="font-bold text-gray-900">{transactions.length.toLocaleString()}</span> transactions
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
          >
            Previous
          </button>
          <div className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 border-2 border-gray-200 rounded-lg">
            Page <span className="font-bold text-gray-900">{currentPage}</span> of <span className="font-bold text-gray-900">{totalPages}</span>
          </div>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
