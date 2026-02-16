import { Transaction, FeatureVector, Rule, RuleEvaluationResult } from './types';
import { getFeatureVectorForTransaction } from './dataLoader';

function parseDate(dateString: string): Date {
  return new Date(dateString.replace(' ', 'T'));
}

function getHour(dateString: string): number {
  const date = parseDate(dateString);
  return date.getHours();
}

function getDayOfWeek(dateString: string): number {
  const date = parseDate(dateString);
  return date.getDay();
}

function evaluateRule001(
  transaction: Transaction,
  featureVector: FeatureVector
): { matches: boolean; reasons: string[] } {
  const threshold = 1000;
  const matches = transaction.amount > threshold;
  const reasons: string[] = [];
  
  if (matches) {
    reasons.push(`Transaction amount (${transaction.amount}) exceeds threshold (${threshold})`);
  } else {
    reasons.push(`Transaction amount (${transaction.amount}) is below threshold (${threshold})`);
  }
  
  return { matches, reasons };
}

function evaluateRule002(
  transaction: Transaction,
  featureVector: FeatureVector
): { matches: boolean; reasons: string[] } {
  const smallAmountThreshold = 50;
  const highFrequencyThreshold = 5;
  
  const isSmall = transaction.amount < smallAmountThreshold;
  const highFrequency = featureVector.transaction_count >= highFrequencyThreshold;
  const matches = isSmall && highFrequency;
  
  const reasons: string[] = [];
  reasons.push(`Transaction amount: ${transaction.amount} (${isSmall ? 'Small' : 'Not small'})`);
  reasons.push(`Transaction count: ${featureVector.transaction_count} (${highFrequency ? 'High frequency' : 'Normal'})`);
  
  if (matches) {
    reasons.push(`⚠️ Matches: Multiple small transactions detected`);
  } else {
    reasons.push(`✓ Does not match: ${!isSmall ? 'Amount too large' : 'Frequency too low'}`);
  }
  
  return { matches, reasons };
}

function evaluateRule003(
  transaction: Transaction,
  featureVector: FeatureVector
): { matches: boolean; reasons: string[] } {
  const commonTypes = ['online', 'contactless', 'chip'];
  const transactionType = transaction.transaction_type?.toLowerCase() || '';
  const isUnusual = !transactionType || !commonTypes.includes(transactionType);
  
  const reasons: string[] = [];
  reasons.push(`Transaction type: ${transaction.transaction_type || 'N/A'}`);
  reasons.push(`Common types: ${commonTypes.join(', ')}`);
  
  if (isUnusual) {
    reasons.push(`⚠️ Matches: ${!transactionType ? 'Missing transaction type' : 'Unusual transaction type detected'}`);
  } else {
    reasons.push(`✓ Does not match: Transaction type is common`);
  }
  
  return { matches: isUnusual, reasons };
}

function evaluateRule004(
  transaction: Transaction,
  featureVector: FeatureVector
): { matches: boolean; reasons: string[] } {
  const highRiskKeywords = ['casino', 'gambling', 'bet', 'crypto', 'bitcoin'];
  const merchantDesc = (transaction.merchant_description_condensed || '').toLowerCase();
  const isHighRisk = merchantDesc && highRiskKeywords.some(keyword => merchantDesc.includes(keyword));
  
  const reasons: string[] = [];
  reasons.push(`Merchant: ${transaction.merchant_description_condensed || 'N/A'}`);
  
  if (isHighRisk) {
    reasons.push(`⚠️ Matches: High-risk merchant detected`);
  } else {
    reasons.push(`✓ Does not match: Merchant appears safe`);
  }
  
  return { matches: isHighRisk, reasons };
}

function evaluateRule005(
  transaction: Transaction,
  featureVector: FeatureVector
): { matches: boolean; reasons: string[] } {
  const commonCountries = ['USA', 'CAN', 'GBR'];
  const significantAmount = 500;
  
  const merchantCountry = transaction.merchant_country || '';
  const isCrossBorder = !merchantCountry || !commonCountries.includes(merchantCountry);
  const isSignificant = transaction.amount >= significantAmount;
  const matches = isCrossBorder && isSignificant;
  
  const reasons: string[] = [];
  reasons.push(`Merchant country: ${merchantCountry || 'N/A'}`);
  reasons.push(`Transaction amount: ${transaction.amount}`);
  reasons.push(`Significant amount threshold: ${significantAmount}`);
  
  if (matches) {
    reasons.push(`⚠️ Matches: Cross-border transaction with significant amount`);
  } else {
    reasons.push(`✓ Does not match: ${!isCrossBorder ? 'Not cross-border' : 'Amount not significant'}`);
  }
  
  return { matches, reasons };
}

function evaluateRule006(
  transaction: Transaction,
  featureVector: FeatureVector
): { matches: boolean; reasons: string[] } {
  const hour = featureVector.hour_of_day;
  const isOutsideHours = hour < 9 || hour > 18;
  
  const reasons: string[] = [];
  reasons.push(`Transaction hour: ${hour}:00`);
  reasons.push(`Normal hours: 9:00 - 18:00`);
  
  if (isOutsideHours) {
    reasons.push(`⚠️ Matches: Transaction outside normal business hours`);
  } else {
    reasons.push(`✓ Does not match: Transaction within normal hours`);
  }
  
  return { matches: isOutsideHours, reasons };
}

function evaluateRule007(
  transaction: Transaction,
  featureVector: FeatureVector
): { matches: boolean; reasons: string[] } {
  const cashWithdrawalThreshold = 500;
  const transactionType = (transaction.transaction_type || '').toLowerCase();
  const isCashWithdrawal = transactionType.includes('cash') || 
                          transactionType.includes('atm') ||
                          (transaction.terminal_id && transaction.terminal_id > 0);
  const isLarge = transaction.amount >= cashWithdrawalThreshold;
  const matches = isCashWithdrawal && isLarge;
  
  const reasons: string[] = [];
  reasons.push(`Transaction type: ${transaction.transaction_type || 'N/A'}`);
  reasons.push(`Terminal ID: ${transaction.terminal_id || 0}`);
  reasons.push(`Amount: ${transaction.amount}`);
  reasons.push(`Cash withdrawal threshold: ${cashWithdrawalThreshold}`);
  
  if (matches) {
    reasons.push(`⚠️ Matches: Large cash withdrawal detected`);
  } else {
    reasons.push(`✓ Does not match: ${!isCashWithdrawal ? 'Not a cash withdrawal' : 'Amount below threshold'}`);
  }
  
  return { matches, reasons };
}

export function evaluateRule(
  rule: Rule,
  transaction: Transaction,
  featureVector: FeatureVector
): RuleEvaluationResult {
  let evaluation: { matches: boolean; reasons: string[] };
  
  switch (rule.rule_id) {
    case 'RULE_001':
      evaluation = evaluateRule001(transaction, featureVector);
      break;
    case 'RULE_002':
      evaluation = evaluateRule002(transaction, featureVector);
      break;
    case 'RULE_003':
      evaluation = evaluateRule003(transaction, featureVector);
      break;
    case 'RULE_004':
      evaluation = evaluateRule004(transaction, featureVector);
      break;
    case 'RULE_005':
      evaluation = evaluateRule005(transaction, featureVector);
      break;
    case 'RULE_006':
      evaluation = evaluateRule006(transaction, featureVector);
      break;
    case 'RULE_007':
      evaluation = evaluateRule007(transaction, featureVector);
      break;
    default:
      evaluation = { matches: false, reasons: ['Unknown rule'] };
  }
  
  const score = evaluation.matches 
    ? (rule.severity === 'Critical' ? 100 : rule.severity === 'High' ? 75 : rule.severity === 'Medium' ? 50 : 25) 
    : 0;
  
  return {
    rule,
    transaction,
    featureVector,
    matches: evaluation.matches,
    reasons: evaluation.reasons,
    score,
  };
}

export function evaluateAllRules(
  transaction: Transaction,
  rules: Rule[]
): RuleEvaluationResult[] {
  const featureVector = getFeatureVectorForTransaction(transaction.transaction_id);
  
  if (!featureVector) {
    return [];
  }
  
  return rules.map(rule => evaluateRule(rule, transaction, featureVector));
}

export function filterTransactionsByRule(
  transactions: Transaction[],
  rules: Rule[],
  selectedRuleId: string | null
): Transaction[] {
  if (!selectedRuleId) {
    return transactions;
  }
  
  const selectedRule = rules.find(r => r.rule_id === selectedRuleId);
  if (!selectedRule) {
    return transactions;
  }
  
  return transactions.filter(transaction => {
    const featureVector = getFeatureVectorForTransaction(transaction.transaction_id);
    if (!featureVector) return false;
    
    const result = evaluateRule(selectedRule, transaction, featureVector);
    return result.matches;
  });
}
