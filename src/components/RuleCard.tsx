'use client';

import { Rule } from '@/lib/types';
import { AlertTriangle, Shield, Eye, Search } from 'lucide-react';
import clsx from 'clsx';

interface RuleCardProps {
  rule: Rule;
  isSelected: boolean;
  onClick: () => void;
  matchCount?: number;
}

const actionIcons = {
  Block: Shield,
  Alert: AlertTriangle,
  Review: Eye,
  Investigate: Search,
};

const severityColors = {
  Critical: 'bg-severity-critical text-white',
  High: 'bg-severity-high text-white',
  Medium: 'bg-severity-medium text-white',
  Low: 'bg-severity-low text-white',
};

const actionColors = {
  Block: 'border-action-block',
  Alert: 'border-action-alert',
  Review: 'border-action-review',
  Investigate: 'border-action-investigate',
};

export default function RuleCard({ rule, isSelected, onClick, matchCount }: RuleCardProps) {
  const ActionIcon = actionIcons[rule.action];
  
  return (
    <div
      onClick={onClick}
      className={clsx(
        'p-5 rounded-xl border-2 cursor-pointer transition-all bg-white',
        isSelected 
          ? 'border-blue-500 shadow-lg shadow-blue-100' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md',
        actionColors[rule.action]
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={clsx(
          'p-2 rounded-lg',
          isSelected ? 'bg-blue-50' : 'bg-gray-50'
        )}>
          <ActionIcon className={clsx(
            'w-5 h-5',
            isSelected ? 'text-blue-600' : 'text-gray-600'
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={clsx(
            'font-bold text-base mb-1.5',
            isSelected ? 'text-gray-900' : 'text-gray-800'
          )}>
            {rule.name}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
            {rule.description}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex gap-2">
          <span className={clsx(
            'px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide',
            severityColors[rule.severity]
          )}>
            {rule.severity}
          </span>
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
            {rule.action}
          </span>
        </div>
        {matchCount !== undefined ? (
          <span className={clsx(
            'text-sm font-semibold',
            matchCount > 0 ? 'text-red-600' : 'text-gray-500'
          )}>
            {matchCount.toLocaleString()} {matchCount === 1 ? 'match' : 'matches'}
          </span>
        ) : (
          <span className="text-xs text-gray-400 italic">Calculating...</span>
        )}
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-50">
        <span className="text-xs font-mono text-gray-400">
          {rule.rule_id}
        </span>
      </div>
    </div>
  );
}
