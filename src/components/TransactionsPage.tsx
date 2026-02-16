'use client';

import { useState, useMemo, useEffect, useRef, useTransition } from 'react';
import { Transaction, Rule, RuleEvaluationResult } from '@/lib/types';
import { loadTransactions, loadRules, loadFeatureVectors } from '@/lib/dataLoader';
import { evaluateAllRules, filterTransactionsByRule } from '@/lib/ruleEvaluator';
import TransactionTable from './TransactionTable';
import TransactionDetail from './TransactionDetail';
import FilterPanel from './FilterPanel';
import { FilterState } from '@/lib/types';
import Link from 'next/link';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [isFiltering, startFiltering] = useTransition();

  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedRule: null,
    severityFilter: [],
    actionFilter: [],
    amountRange: [0, Number.MAX_SAFE_INTEGER],
    dateRange: ['', ''],
    transactionType: [],
    currency: [],
  });

  // Optimized filter update that doesn't block UI
  const handleFiltersChange = (newFilters: FilterState) => {
    startFiltering(() => {
      setFilters(newFilters);
    });
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [txns, rls, fvs] = await Promise.all([
          loadTransactions(),
          loadRules(),
          loadFeatureVectors(),
        ]);
        setTransactions(txns);
        setRules(rls);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const allEvaluations = useMemo(() => {
    if (transactions.length === 0 || rules.length === 0) return [];
    
    console.log(`Evaluating rules for ${transactions.length} transactions...`);
    
    const evaluations = transactions.map((transaction, index) => {
      try {
        const result = evaluateAllRules(transaction, rules);
        if ((index + 1) % 10000 === 0) {
          console.log(`Evaluated ${index + 1} / ${transactions.length} transactions`);
        }
        return result;
      } catch (error) {
        return [];
      }
    });
    
    console.log('Rule evaluation complete');
    return evaluations;
  }, [transactions, rules]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Rule filter
    if (filters.selectedRule) {
      filtered = filterTransactionsByRule(filtered, rules, filters.selectedRule);
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.transaction_id.toLowerCase().includes(searchLower) ||
        (t.merchant_description_condensed?.toLowerCase() || '').includes(searchLower) ||
        (t.merchant_country?.toLowerCase() || '').includes(searchLower)
      );
    }

    const minAmount = filters.amountRange[0] || 0;
    const maxAmount = (filters.amountRange[1] === Infinity || filters.amountRange[1] === Number.MAX_SAFE_INTEGER || !isFinite(filters.amountRange[1])) 
      ? Number.MAX_SAFE_INTEGER 
      : filters.amountRange[1];
    
    if (minAmount > 0 || maxAmount < Number.MAX_SAFE_INTEGER) {
      filtered = filtered.filter(t => {
        if (minAmount > 0 && t.amount < minAmount) return false;
        if (maxAmount < Number.MAX_SAFE_INTEGER && t.amount > maxAmount) return false;
        return true;
      });
    }

    if (filters.transactionType.length > 0) {
      filtered = filtered.filter(t => t.transaction_type && filters.transactionType.includes(t.transaction_type));
    }

    if (filters.severityFilter.length > 0) {
      filtered = filtered.filter(transaction => {
        const index = transactions.findIndex(t => t.transaction_id === transaction.transaction_id);
        const evaluations = allEvaluations[index] || [];
        
        return evaluations.some(evalResult => 
          evalResult.matches && 
          filters.severityFilter.includes(evalResult.rule.severity)
        );
      });
    }

    if (filters.actionFilter.length > 0) {
      filtered = filtered.filter(transaction => {
        const index = transactions.findIndex(t => t.transaction_id === transaction.transaction_id);
        const evaluations = allEvaluations[index] || [];
        
        // Check if transaction matches any rule with selected action
        return evaluations.some(evalResult => 
          evalResult.matches && 
          filters.actionFilter.includes(evalResult.rule.action)
        );
      });
    }

    return filtered;
  }, [transactions, filters, rules, allEvaluations]);

  useEffect(() => {
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredTransactions.length, itemsPerPage]);

  const prevFiltersRef = useRef(filters);
  useEffect(() => {
    const filtersChanged = 
        prevFiltersRef.current.searchTerm !== filters.searchTerm ||
        prevFiltersRef.current.selectedRule !== filters.selectedRule ||
        prevFiltersRef.current.amountRange[0] !== filters.amountRange[0] ||
        prevFiltersRef.current.amountRange[1] !== filters.amountRange[1] ||
        JSON.stringify(prevFiltersRef.current.transactionType) !== JSON.stringify(filters.transactionType) ||
        JSON.stringify(prevFiltersRef.current.severityFilter) !== JSON.stringify(filters.severityFilter) ||
        JSON.stringify(prevFiltersRef.current.actionFilter) !== JSON.stringify(filters.actionFilter);
    
    if (filtersChanged && currentPage !== 1) {
      setCurrentPage(1);
    }
    
    prevFiltersRef.current = filters;
  }, [filters, currentPage]);

  const filteredEvaluations = useMemo(() => {
    return filteredTransactions.map(transaction => {
      const index = transactions.findIndex(t => t.transaction_id === transaction.transaction_id);
      return allEvaluations[index] || [];
    });
  }, [filteredTransactions, transactions, allEvaluations]);

  const selectedTransactionEvaluations = selectedTransaction
    ? allEvaluations[transactions.findIndex(t => t.transaction_id === selectedTransaction.transaction_id)] || []
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
              <p className="text-sm text-gray-600 mt-2">
                Browse and analyze {transactions.length.toLocaleString()} transactions
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {/* Filters */}
          <FilterPanel
            filters={filters}
            rules={rules}
            onFiltersChange={handleFiltersChange}
            transactionCount={transactions.length}
            filteredCount={filteredTransactions.length}
            transactions={transactions}
            isFiltering={isFiltering}
          />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {filteredTransactions.length.toLocaleString()} Transactions
          </h2>
          <p className="text-sm text-gray-600">
            {(filters.selectedRule || filters.searchTerm || filters.amountRange[0] > 0 || (filters.amountRange[1] !== Infinity && filters.amountRange[1] !== Number.MAX_SAFE_INTEGER && isFinite(filters.amountRange[1])) || filters.transactionType.length > 0)
              ? 'Filtered results'
              : 'All transactions'}
          </p>
        </div>

        {/* Transactions Table */}
        {isFiltering ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Filtering transactions...</p>
                <p className="text-xs text-gray-500 mt-1">Please wait while we apply your filters</p>
              </div>
            </div>
          </div>
        ) : (
          <TransactionTable
            transactions={filteredTransactions}
            evaluations={filteredEvaluations}
            onSelectTransaction={(transaction) => {
              setSelectedTransaction(transaction);
              setShowTransactionDetail(true);
            }}
            selectedTransactionId={selectedTransaction?.transaction_id || null}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Transaction Detail Modal */}
      {showTransactionDetail && selectedTransaction && (
        <TransactionDetail
          transaction={selectedTransaction}
          evaluations={selectedTransactionEvaluations}
          onClose={() => {
            setShowTransactionDetail(false);
            setSelectedTransaction(null);
          }}
        />
      )}
    </div>
  );
}
