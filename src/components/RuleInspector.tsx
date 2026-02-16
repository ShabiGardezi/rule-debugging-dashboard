'use client';

import { Rule, Transaction, FeatureVector, RuleEvaluationResult } from '@/lib/types';
import { evaluateRule } from '@/lib/ruleEvaluator';
import { CheckCircle2, XCircle, Info } from 'lucide-react';
import clsx from 'clsx';

function getRuleLogic(ruleId: string): string[] {
  const logicMap: Record<string, string[]> = {
    'RULE_001': [
      'Checks if transaction amount exceeds $1,000 threshold',
      'Flags high-value transactions that may need review',
      'Action: Alert - Notifies security team'
    ],
    'RULE_002': [
      'Identifies multiple small transactions (under $50) in short period',
      'Requires transaction count of 5 or more to trigger',
      'Action: Review - May indicate structuring or testing behavior'
    ],
    'RULE_003': [
      'Compares transaction type against user\'s historical patterns',
      'Flags unusual transaction types (e.g., first-time ATM use)',
      'Action: Investigate - Requires pattern analysis'
    ],
    'RULE_004': [
      'Checks merchant against high-risk merchant database',
      'Looks for keywords: casino, gambling, bet, crypto, bitcoin',
      'Action: Block - Immediately blocks transaction'
    ],
    'RULE_005': [
      'Detects cross-border transactions with significant amounts',
      'Requires amount ≥ $500 and merchant country different from user\'s typical countries',
      'Action: Alert - May indicate account compromise'
    ],
    'RULE_006': [
      'Identifies transactions outside normal business hours (9 AM - 6 PM)',
      'Uses transaction hour from feature vector',
      'Action: Review - May indicate unusual user behavior'
    ],
    'RULE_007': [
      'Flags large cash withdrawals from ATMs',
      'Requires amount ≥ $500 and transaction type includes "cash" or "atm"',
      'Action: Alert - High-risk transaction type'
    ],
  };
  return logicMap[ruleId] || ['Rule evaluation logic'];
}

interface RuleInspectorProps {
  rule: Rule;
  transaction: Transaction | null;
  featureVector: FeatureVector | null;
}

export default function RuleInspector({ rule, transaction, featureVector }: RuleInspectorProps) {
  if (!transaction || !featureVector) {
    return (
      <div className="space-y-4">
        {/* Rule Overview */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
          <div className="flex items-start gap-4 mb-4">
            <div className={clsx(
              'p-3 rounded-lg',
              rule.severity === 'Critical' && 'bg-red-50',
              rule.severity === 'High' && 'bg-orange-50',
              rule.severity === 'Medium' && 'bg-yellow-50',
              rule.severity === 'Low' && 'bg-green-50'
            )}>
              <Info className={clsx(
                'w-6 h-6',
                rule.severity === 'Critical' && 'text-red-600',
                rule.severity === 'High' && 'text-orange-600',
                rule.severity === 'Medium' && 'text-yellow-600',
                rule.severity === 'Low' && 'text-green-600'
              )} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{rule.name}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{rule.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <span className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide',
              rule.severity === 'Critical' && 'bg-red-100 text-red-700',
              rule.severity === 'High' && 'bg-orange-100 text-orange-700',
              rule.severity === 'Medium' && 'bg-yellow-100 text-yellow-700',
              rule.severity === 'Low' && 'bg-green-100 text-green-700'
            )}>
              {rule.severity}
            </span>
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">
              {rule.action}
            </span>
            <span className="ml-auto text-xs font-mono text-gray-400">
              {rule.rule_id}
            </span>
          </div>
        </div>

        {/* Rule Logic Explanation */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            How This Rule Works
          </h4>
          <div className="space-y-2 text-sm text-gray-700">
            {getRuleLogic(rule.rule_id).map((logic, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>{logic}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Instruction */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <Info className="w-5 h-5 text-gray-400" />
            <p className="text-sm font-medium text-gray-600">Select a transaction below</p>
            <p className="text-xs text-gray-500">to see how this rule evaluates against it</p>
          </div>
        </div>
      </div>
    );
  }

  const evaluation = evaluateRule(rule, transaction, featureVector);

  return (
    <div className="space-y-4">
      <div className={clsx(
        'p-4 rounded-lg border-2',
        evaluation.matches 
          ? 'bg-red-50 border-red-300' 
          : 'bg-green-50 border-green-300'
      )}>
        <div className="flex items-center gap-2 mb-2">
          {evaluation.matches ? (
            <XCircle className="w-6 h-6 text-red-600" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          )}
          <h3 className="font-semibold text-lg">
            {evaluation.matches ? 'Rule Matches' : 'Rule Does Not Match'}
          </h3>
        </div>
        <p className="text-sm text-gray-700">
          {rule.description}
        </p>
      </div>

      {/* Evaluation details */}

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Evaluation Details
        </h4>
        <div className="space-y-2">
          {evaluation.reasons.map((reason, index) => (
            <div
              key={index}
              className={clsx(
                'p-2 rounded text-sm',
                reason.includes('⚠️') 
                  ? 'bg-red-50 text-red-800 border-l-4 border-red-500' 
                  : reason.includes('✓')
                  ? 'bg-green-50 text-green-800 border-l-4 border-green-500'
                  : 'bg-gray-50 text-gray-700'
              )}
            >
              {reason}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold mb-2 text-sm">Transaction Details</h4>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">ID:</span> {transaction.transaction_id}</div>
            <div><span className="font-medium">Amount:</span> {transaction.amount} {transaction.currency}</div>
            <div><span className="font-medium">Type:</span> {transaction.transaction_type || 'N/A'}</div>
            <div><span className="font-medium">Date:</span> {transaction.txn_date_time}</div>
            <div><span className="font-medium">Merchant:</span> {transaction.merchant_description_condensed || 'N/A'}</div>
            <div><span className="font-medium">Country:</span> {transaction.merchant_country || 'N/A'}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold mb-2 text-sm">Feature Vector</h4>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">Count:</span> {featureVector.transaction_count}</div>
            <div><span className="font-medium">Avg Amount:</span> {featureVector.avg_transaction_amount.toFixed(2)}</div>
            <div><span className="font-medium">Hour:</span> {featureVector.hour_of_day}:00</div>
            <div><span className="font-medium">Day:</span> {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][featureVector.day_of_week]}</div>
            <div><span className="font-medium">Merchant Avg:</span> {featureVector.merchant_avg_transaction_amount.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
