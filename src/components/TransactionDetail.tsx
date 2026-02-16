'use client';

import { Transaction, RuleEvaluationResult } from '@/lib/types';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

interface TransactionDetailProps {
  transaction: Transaction;
  evaluations: RuleEvaluationResult[];
  onClose: () => void;
}

export default function TransactionDetail({ transaction, evaluations, onClose }: TransactionDetailProps) {
  const matchingRules = evaluations.filter(e => e.matches);
  const nonMatchingRules = evaluations.filter(e => !e.matches);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Transaction Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Transaction Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Transaction Information</h3>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">ID:</span> {transaction.transaction_id}</div>
                <div><span className="font-medium">Date:</span> {transaction.txn_date_time}</div>
                <div><span className="font-medium">Amount:</span> {transaction.amount} {transaction.currency}</div>
                <div><span className="font-medium">Type:</span> {transaction.transaction_type || 'N/A'}</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Merchant Information</h3>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">Merchant:</span> {transaction.merchant_description_condensed || 'N/A'}</div>
                <div><span className="font-medium">City:</span> {transaction.merchant_city || 'N/A'}</div>
                <div><span className="font-medium">Country:</span> {transaction.merchant_country || 'N/A'}</div>
                <div><span className="font-medium">Terminal ID:</span> {transaction.terminal_id || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Matching Rules */}
          {matchingRules.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Matching Rules ({matchingRules.length})
              </h3>
              <div className="space-y-3">
                {matchingRules.map((evaluation) => (
                  <div
                    key={evaluation.rule.rule_id}
                    className="p-4 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{evaluation.rule.name}</h4>
                      <span className={clsx(
                        'px-2 py-1 rounded text-xs font-medium',
                        evaluation.rule.severity === 'Critical' && 'bg-red-600 text-white',
                        evaluation.rule.severity === 'High' && 'bg-orange-600 text-white',
                        evaluation.rule.severity === 'Medium' && 'bg-yellow-600 text-white',
                        evaluation.rule.severity === 'Low' && 'bg-green-600 text-white',
                      )}>
                        {evaluation.rule.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{evaluation.rule.description}</p>
                    <div className="space-y-1">
                      {evaluation.reasons.map((reason, idx) => (
                        <div key={idx} className="text-xs text-red-800 bg-red-100 p-2 rounded">
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Non-Matching Rules */}
          {nonMatchingRules.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                Non-Matching Rules ({nonMatchingRules.length})
              </h3>
              <div className="space-y-2">
                {nonMatchingRules.map((evaluation) => (
                  <div
                    key={evaluation.rule.rule_id}
                    className="p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{evaluation.rule.name}</h4>
                      <span className="text-xs text-gray-500">{evaluation.rule.severity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
