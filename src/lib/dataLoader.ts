import { Transaction, FeatureVector, Rule } from './types';

let transactionsCache: Transaction[] | null = null;
let featureVectorsCache: FeatureVector[] | null = null;
let rulesCache: Rule[] | null = null;
let featureVectorMap: Map<string, FeatureVector> | null = null;

export async function loadTransactions(): Promise<Transaction[]> {
  if (!transactionsCache) {
    const data = await import('../../transactions.json');
    transactionsCache = (data.default as Transaction[]).map(t => ({
      ...t,
      merchant_postcode: t.merchant_postcode === null || isNaN(t.merchant_postcode as any) ? null : t.merchant_postcode,
    }));
  }
  return transactionsCache;
}

export async function loadFeatureVectors(): Promise<FeatureVector[]> {
  if (!featureVectorsCache) {
    const data = await import('../../feature_vectors.json');
    featureVectorsCache = data.default as FeatureVector[];
    featureVectorMap = new Map();
    featureVectorsCache.forEach(fv => {
      featureVectorMap!.set(fv.transaction_id, fv);
    });
  }
  return featureVectorsCache;
}

export async function loadRules(): Promise<Rule[]> {
  if (!rulesCache) {
    const data = await import('../../example_rules.json');
    rulesCache = data.default as Rule[];
  }
  return rulesCache;
}

export function getFeatureVectorForTransaction(transactionId: string): FeatureVector | undefined {
  return featureVectorMap?.get(transactionId);
}

export function getTransactionById(transactionId: string, transactions: Transaction[]): Transaction | undefined {
  return transactions.find(t => t.transaction_id === transactionId);
}
