'use client';

import { FilterState, Rule, Transaction } from '@/lib/types';
import { Search, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import clsx from 'clsx';

interface FilterPanelProps {
  filters: FilterState;
  rules: Rule[];
  onFiltersChange: (filters: FilterState) => void;
  transactionCount: number;
  filteredCount: number;
  transactions?: Transaction[]; // Add transactions to get actual types
  isFiltering?: boolean; // Loading state for filtering
}

export default function FilterPanel({
  filters,
  rules,
  onFiltersChange,
  transactionCount,
  filteredCount,
  transactions = [],
  isFiltering = false,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const displayTypes = useMemo(() => {
    if (transactions.length > 0) {
      const uniqueTypes = Array.from(
        new Set(
          transactions
            .map(t => t.transaction_type)
            .filter((type): type is string => type !== null && type !== undefined)
        )
      ).sort();
      return uniqueTypes.length > 0 ? uniqueTypes : ['online', 'contactless', 'chip_and_pin'];
    }
    return ['online', 'contactless', 'chip_and_pin', 'cash', 'refund'];
  }, [transactions]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Search className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {filteredCount.toLocaleString()} of {transactionCount.toLocaleString()} transactions
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, merchant, or country..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Rule Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Rule
          </label>
          <select
            value={filters.selectedRule || ''}
            onChange={(e) => updateFilter('selectedRule', e.target.value || null)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
          >
            <option value="">All Rules</option>
            {rules.map((rule) => (
              <option key={rule.rule_id} value={rule.rule_id}>
                {rule.name}
              </option>
            ))}
          </select>
        </div>

      {isExpanded && (
        <div className="pt-4 border-t border-gray-200 space-y-4">
          {/* Severity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2.5">
              Severity
            </label>
            <div className="flex flex-wrap gap-2">
              {['Critical', 'High', 'Medium', 'Low'].map((severity) => {
                const isChecked = filters.severityFilter.includes(severity);
                return (
                  <label
                    key={severity}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all',
                      isChecked
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const newFilter = e.target.checked
                          ? [...filters.severityFilter, severity]
                          : filters.severityFilter.filter(s => s !== severity);
                        updateFilter('severityFilter', newFilter);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">{severity}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2.5">
              Action
            </label>
            <div className="flex flex-wrap gap-2">
              {['Block', 'Alert', 'Review', 'Investigate'].map((action) => {
                const isChecked = filters.actionFilter.includes(action);
                return (
                  <label
                    key={action}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all',
                      isChecked
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const newFilter = e.target.checked
                          ? [...filters.actionFilter, action]
                          : filters.actionFilter.filter(a => a !== action);
                        updateFilter('actionFilter', newFilter);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">{action}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2.5">
              Amount Range
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.amountRange[0] > 0 ? filters.amountRange[0] : ''}
                  onChange={(e) => {
                    const min = Number(e.target.value) || 0;
                    const max = (filters.amountRange[1] === Infinity || filters.amountRange[1] === Number.MAX_SAFE_INTEGER || !isFinite(filters.amountRange[1])) 
                      ? Number.MAX_SAFE_INTEGER 
                      : filters.amountRange[1];
                    updateFilter('amountRange', [min, max]);
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Max"
                  value={(filters.amountRange[1] === Infinity || filters.amountRange[1] === Number.MAX_SAFE_INTEGER || !isFinite(filters.amountRange[1])) ? '' : filters.amountRange[1]}
                  onChange={(e) => {
                    const max = e.target.value === '' ? Number.MAX_SAFE_INTEGER : (Number(e.target.value) || Number.MAX_SAFE_INTEGER);
                    updateFilter('amountRange', [filters.amountRange[0] || 0, max]);
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2.5">
              Transaction Type
            </label>
            <div className="flex flex-wrap gap-2">
              {displayTypes.map((type) => {
                const isChecked = filters.transactionType.includes(type);
                return (
                  <label
                    key={type}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all',
                      isChecked
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const newFilter = e.target.checked
                          ? [...filters.transactionType, type]
                          : filters.transactionType.filter(t => t !== type);
                        updateFilter('transactionType', newFilter);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium capitalize">{type}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {(filters.searchTerm || filters.selectedRule || filters.severityFilter.length > 0 || filters.actionFilter.length > 0 || filters.amountRange[0] > 0 || (filters.amountRange[1] !== Infinity && filters.amountRange[1] !== Number.MAX_SAFE_INTEGER && isFinite(filters.amountRange[1])) || filters.transactionType.length > 0) && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() =>               onFiltersChange({
                searchTerm: '',
                selectedRule: null,
                severityFilter: [],
                actionFilter: [],
                amountRange: [0, Number.MAX_SAFE_INTEGER],
                dateRange: ['', ''],
                transactionType: [],
                currency: [],
              })}
              className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
