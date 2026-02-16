export interface Transaction {
  transaction_id: string;
  txn_date_time: string;
  sender_account_id: string;
  receiver_account_id: number;
  amount: number;
  currency: string;
  transaction_type: string | null;
  terminal_id: number;
  merchant_city: string | null;
  merchant_country: string | null;
  merchant_postcode: number | null;
  merchant_description_condensed: string | null;
}

export interface FeatureVector {
  transaction_id: string;
  sender_account_id: string;
  receiver_account_id: number;
  amount: number;
  currency: string;
  transaction_type: string;
  transaction_count: number;
  avg_transaction_amount: number;
  hour_of_day: number;
  day_of_week: number;
  merchant_avg_transaction_amount: number;
}

export interface Rule {
  rule_id: string;
  name: string;
  description: string;
  action: 'Block' | 'Alert' | 'Review' | 'Investigate';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface RuleEvaluationResult {
  rule: Rule;
  matches: boolean;
  reasons: string[];
  transaction: Transaction;
  featureVector: FeatureVector;
  score?: number;
}

export interface FilterState {
  searchTerm: string;
  selectedRule: string | null;
  severityFilter: string[];
  actionFilter: string[];
  amountRange: [number, number]; // [min, max] where max can be Number.MAX_SAFE_INTEGER for "no limit"
  dateRange: [string, string];
  transactionType: string[];
  currency: string[];
}
