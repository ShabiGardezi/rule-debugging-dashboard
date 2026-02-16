'use client';

import { useState, useMemo, useEffect } from 'react';
import { Transaction, Rule, FeatureVector, RuleEvaluationResult, FilterState } from '@/lib/types';
import { loadTransactions, loadRules, loadFeatureVectors, getFeatureVectorForTransaction } from '@/lib/dataLoader';
import { evaluateAllRules } from '@/lib/ruleEvaluator';
import RuleCard from './RuleCard';
import { ArrowRight, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import Link from 'next/link';

export default function DashboardSummary() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [featureVectors, setFeatureVectors] = useState<FeatureVector[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data on mount
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

  // Show top 5 rules by match count
  const topRules = useMemo(() => {
    const allEvaluations = transactions.slice(0, 1000).map(transaction => 
      evaluateAllRules(transaction, rules)
    );
    
    const ruleMatchCounts: Record<string, number> = {};
    rules.forEach(rule => {
      ruleMatchCounts[rule.rule_id] = allEvaluations.reduce((sum, evals) => {
        return sum + (evals.find(e => e.rule.rule_id === rule.rule_id && e.matches) ? 1 : 0);
      }, 0);
    });

    return rules
      .map(rule => ({ rule, matches: ruleMatchCounts[rule.rule_id] || 0 }))
      .sort((a, b) => b.matches - a.matches)
      .slice(0, 5);
  }, [transactions, rules]);

  // Show recent transactions (last 10)
  const recentTransactions = useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.txn_date_time.replace(' ', 'T')).getTime() - new Date(a.txn_date_time.replace(' ', 'T')).getTime())
      .slice(0, 10);
  }, [transactions]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const highValueCount = transactions.filter(t => t.amount > 1000).length;
    const matchingTransactions = transactions.slice(0, 1000).reduce((count, t) => {
      const evals = evaluateAllRules(t, rules);
      return count + (evals.some(e => e.matches) ? 1 : 0);
    }, 0);

    return {
      totalTransactions: transactions.length,
      totalAmount,
      highValueCount,
      matchingTransactions,
      averageAmount: totalAmount / transactions.length,
    };
  }, [transactions, rules]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="text-3xl font-bold text-gray-900">Rule Debugging Dashboard</h1>
          <p className="text-sm text-gray-600 mt-2">
            Overview and quick access to fraud detection rules and transactions
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalTransactions.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${(stats.totalAmount / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Value (>$1K)</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.highValueCount.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rule Matches</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.matchingTransactions.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Rules Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Top Rules by Matches</h2>
                  <p className="text-sm text-gray-600 mt-1">Most frequently triggered rules</p>
                </div>
                <Link
                  href="/rules"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {topRules.map(({ rule, matches }) => (
                <RuleCard
                  key={rule.rule_id}
                  rule={rule}
                  isSelected={false}
                  onClick={() => {}}
                  matchCount={matches}
                />
              ))}
            </div>
          </div>

          {/* Recent Transactions Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
                  <p className="text-sm text-gray-600 mt-1">Latest transaction activity</p>
                </div>
                <Link
                  href="/transactions"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {recentTransactions.map((transaction) => {
                  const date = new Date(transaction.txn_date_time.replace(' ', 'T'));
                  return (
                    <div
                      key={transaction.transaction_id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono font-medium text-gray-900 truncate">
                          {transaction.transaction_id}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {date.toLocaleDateString()} • {transaction.merchant_description_condensed || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-semibold text-gray-900">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: transaction.currency || 'USD',
                            minimumFractionDigits: 2,
                          }).format(transaction.amount)}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700 mt-1">
                          {transaction.transaction_type || 'N/A'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/rules"
              className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">View All Rules</p>
                <p className="text-sm text-gray-600">Browse and inspect all {rules.length} rules</p>
              </div>
            </Link>

            <Link
              href="/transactions"
              className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">View All Transactions</p>
                <p className="text-sm text-gray-600">Browse {transactions.length.toLocaleString()} transactions</p>
              </div>
            </Link>

            <Link
              href="/debug"
              className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Debug Rules</p>
                <p className="text-sm text-gray-600">Interactive rule debugging tool</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
