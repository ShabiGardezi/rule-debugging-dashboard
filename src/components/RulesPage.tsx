'use client';

import { useState, useMemo, useEffect } from 'react';
import { Rule, Transaction } from '@/lib/types';
import { loadTransactions, loadRules, loadFeatureVectors } from '@/lib/dataLoader';
import { evaluateAllRules } from '@/lib/ruleEvaluator';
import RuleCard from './RuleCard';
import { Search, Filter, X } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

export default function RulesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [featureVectorsLoaded, setFeatureVectorsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [actionFilter, setActionFilter] = useState<string[]>([]);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Load all data including feature vectors (needed for rule evaluation)
        const [txns, rls, fvs] = await Promise.all([
          loadTransactions(),
          loadRules(),
          loadFeatureVectors(), // Feature vectors are required for rule evaluation
        ]);
        setTransactions(txns);
        setRules(rls);
        setFeatureVectorsLoaded(true); // Mark feature vectors as loaded
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Calculate match counts (sample transactions for performance)
  const ruleMatchCounts = useMemo(() => {
    // Don't calculate until feature vectors are loaded
    if (transactions.length === 0 || rules.length === 0 || !featureVectorsLoaded) return {};
    
    // For performance, sample transactions (evaluating all 500k+ would be too slow)
    const sampleSize = Math.min(20000, transactions.length);
    const sample = transactions.slice(0, sampleSize);
    
    try {
      const allEvaluations = sample.map(transaction => {
        try {
          const evals = evaluateAllRules(transaction, rules);
          return evals; // This returns array of RuleEvaluationResult
        } catch (error) {
          // If evaluation fails (e.g., missing feature vector), return empty array
          return [];
        }
      });
      
      const counts: Record<string, number> = {};
      rules.forEach(rule => {
        counts[rule.rule_id] = allEvaluations.reduce((sum, evals) => {
          // evals is an array of RuleEvaluationResult
          const match = evals.find(e => e.rule.rule_id === rule.rule_id && e.matches);
          return sum + (match ? 1 : 0);
        }, 0);
      });
      
      // Scale up the counts to estimate total (if sampling)
      if (sampleSize < transactions.length) {
        const scaleFactor = transactions.length / sampleSize;
        Object.keys(counts).forEach(ruleId => {
          counts[ruleId] = Math.round(counts[ruleId] * scaleFactor);
        });
      }
      
      return counts;
    } catch (error) {
      console.error('Error calculating match counts:', error);
      return {};
    }
  }, [transactions, rules, featureVectorsLoaded]);

  // Filter rules
  const filteredRules = useMemo(() => {
    let filtered = rules;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(rule =>
        rule.name.toLowerCase().includes(searchLower) ||
        rule.description.toLowerCase().includes(searchLower) ||
        rule.rule_id.toLowerCase().includes(searchLower)
      );
    }

    if (severityFilter.length > 0) {
      filtered = filtered.filter(rule => severityFilter.includes(rule.severity));
    }

    if (actionFilter.length > 0) {
      filtered = filtered.filter(rule => actionFilter.includes(rule.action));
    }

    return filtered;
  }, [rules, searchTerm, severityFilter, actionFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rules...</p>
        </div>
      </div>
    );
  }

  const hasActiveFilters = searchTerm || severityFilter.length > 0 || actionFilter.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fraud Detection Rules</h1>
              <p className="text-sm text-gray-600 mt-2">
                Browse and inspect all {rules.length} fraud detection rules
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
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Rules</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, description, or rule ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSeverityFilter([]);
                      setActionFilter([]);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </button>
                </div>
              )}
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Severity:</span>
                {['Critical', 'High', 'Medium', 'Low'].map((severity) => (
                  <button
                    key={severity}
                    onClick={() => {
                      setSeverityFilter(prev =>
                        prev.includes(severity)
                          ? prev.filter(s => s !== severity)
                          : [...prev, severity]
                      );
                    }}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                      severityFilter.includes(severity)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    {severity}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <span className="text-sm font-medium text-gray-700">Action:</span>
                {['Block', 'Alert', 'Review', 'Investigate'].map((action) => (
                  <button
                    key={action}
                    onClick={() => {
                      setActionFilter(prev =>
                        prev.includes(action)
                          ? prev.filter(a => a !== action)
                          : [...prev, action]
                      );
                    }}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                      actionFilter.includes(action)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {filteredRules.length} {filteredRules.length === 1 ? 'Rule' : 'Rules'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {hasActiveFilters && `Filtered from ${rules.length} total rules`}
            </p>
          </div>
        </div>

        {/* Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRules.map((rule) => (
            <RuleCard
              key={rule.rule_id}
              rule={rule}
              isSelected={selectedRule?.rule_id === rule.rule_id}
              onClick={() => setSelectedRule(rule)}
              matchCount={ruleMatchCounts[rule.rule_id]}
            />
          ))}
        </div>

        {filteredRules.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500 text-lg">No rules found matching your filters</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSeverityFilter([]);
                setActionFilter([]);
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
