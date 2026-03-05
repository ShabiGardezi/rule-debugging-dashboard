'use client';

import { useState, useMemo, useEffect, useRef, useTransition } from 'react';
import { Transaction, Rule, FeatureVector, RuleEvaluationResult, FilterState } from '@/lib/types';
import { loadTransactions, loadRules, loadFeatureVectors, getFeatureVectorForTransaction } from '@/lib/dataLoader';
import { evaluateAllRules, filterTransactionsByRule } from '@/lib/ruleEvaluator';
import RuleCard from './RuleCard';
import RuleInspector from './RuleInspector';
import TransactionTable from './TransactionTable';
import TransactionDetail from './TransactionDetail';
import FeatureVectorViewer from './FeatureVectorViewer';
import FilterPanel from './FilterPanel';
import { Info } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [featureVectors, setFeatureVectors] = useState<FeatureVector[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [isFiltering, startFiltering] = useTransition();

  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedRule: null,
    severityFilter: [],
    actionFilter: [],
    amountRange: [0, Infinity],
    dateRange: ['', ''],
    transactionType: [],
    currency: [],
  });

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
        setFeatureVectors(fvs);
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
        if ((index + 1) % 50000 === 0) {
          console.log(`Evaluated ${index + 1} / ${transactions.length} transactions`);
        }
        return result;
      } catch (error) {
        console.warn(`Failed to evaluate transaction ${transaction.transaction_id}:`, error);
        return [];
      }
    });
    
    console.log('Rule evaluation complete');
    return evaluations;
  }, [transactions, rules]);

  useEffect(() => {
    if (selectedRule && !filters.selectedRule) {
      setFilters(prev => ({ ...prev, selectedRule: selectedRule.rule_id }));
    }
  }, [selectedRule, filters.selectedRule]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    const ruleToFilter = selectedRule?.rule_id || filters.selectedRule;
    if (ruleToFilter) {
      filtered = filterTransactionsByRule(filtered, rules, ruleToFilter);
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
    const maxAmount = (filters.amountRange[1] === Infinity || filters.amountRange[1] === undefined || !isFinite(filters.amountRange[1])) 
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
        
        return evaluations.some(evalResult => 
          evalResult.matches && 
          filters.actionFilter.includes(evalResult.rule.action)
        );
      });
    }

    return filtered;
  }, [transactions, filters, rules, selectedRule, allEvaluations]);

  // Reset to page 1 when filters change
  const prevFiltersRef = useRef(filters);
  useEffect(() => {
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    // Reset to page 1 if current page is beyond available pages
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredTransactions.length, itemsPerPage]);

  // Track filter changes and reset to page 1
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

  const ruleMatchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    rules.forEach(rule => {
      counts[rule.rule_id] = allEvaluations.reduce((sum, evals) => {
        const match = evals.find(e => e.rule.rule_id === rule.rule_id && e.matches);
        return sum + (match ? 1 : 0);
      }, 0);
    });
    
    return counts;
  }, [allEvaluations, rules]);

  const selectedFeatureVector = selectedTransaction
    ? getFeatureVectorForTransaction(selectedTransaction.transaction_id)
    : null;

  const selectedTransactionEvaluations = selectedTransaction
    ? allEvaluations[transactions.findIndex(t => t.transaction_id === selectedTransaction.transaction_id)] || []
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rule Debugging Dashboard</h1>
              <p className="text-sm text-gray-600 mt-2">
                Inspect and debug fraud detection rules against transactions
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Back to Summary
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Rules */}
          <div className="lg:col-span-1 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Rules</h2>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
                  {rules.length}
                </span>
              </div>
              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                {rules.map((rule) => (
                  <RuleCard
                    key={rule.rule_id}
                    rule={rule}
                    isSelected={selectedRule?.rule_id === rule.rule_id}
                    onClick={() => setSelectedRule(rule)}
                    matchCount={ruleMatchCounts[rule.rule_id]}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Middle Column - Transactions */}
          <div className="lg:col-span-1 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Transactions</h2>
              <FilterPanel
                filters={filters}
                rules={rules}
                onFiltersChange={handleFiltersChange}
                transactionCount={transactions.length}
                filteredCount={filteredTransactions.length}
                transactions={transactions}
                isFiltering={isFiltering}
              />
              <div className="mt-4">
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
                    }}
                    selectedTransactionId={selectedTransaction?.transaction_id || null}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Inspector */}
          <div className="lg:col-span-1 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Rule Inspector</h2>
              {selectedRule ? (
                <div className="space-y-4">
                  <RuleInspector
                    rule={selectedRule}
                    transaction={selectedTransaction}
                    featureVector={selectedFeatureVector || null}
                  />
                  {selectedTransaction && (
                    <FeatureVectorViewer featureVector={selectedFeatureVector || null} />
                  )}
                </div>
              ) : (
                <div className="p-8 bg-white rounded-xl border-2 border-dashed border-gray-200 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-gray-100 rounded-full">
                      <Info className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Select a rule</p>
                      <p className="text-xs text-gray-500 mt-1">to inspect evaluation details</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
