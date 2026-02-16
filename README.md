# Rule Debugging Dashboard

A modern, interactive UI for debugging and understanding fraud detection rules against financial transactions.

## Overview

This dashboard provides a comprehensive interface to:
- **Visualize** all fraud detection rules with their severity and actions
- **Inspect** individual transactions and their attributes
- **Evaluate** how rules match against specific transactions
- **Debug** rule logic by stepping through evaluation results
- **Filter** and search through large datasets efficiently

## Features

### Core Functionality

1. **Rule Management**
   - View all 7 predefined fraud detection rules
   - See match counts for each rule
   - Color-coded severity indicators (Critical, High, Medium, Low)
   - Action badges (Block, Alert, Review, Investigate)

2. **Transaction Browser**
   - Browse through 500k+ transactions
   - Sortable columns (ID, Date, Amount, Type, etc.)
   - Pagination for performance
   - Visual indicators for rule matches

3. **Rule Inspector**
   - Step-through rule evaluation
   - Detailed reasoning for each rule match/non-match
   - Transaction and feature vector display
   - Real-time evaluation results

4. **Feature Vector Viewer**
   - Display computed features for transactions
   - Transaction count, averages, time-based features
   - Linked to transaction data

5. **Advanced Filtering**
   - Search by transaction ID, merchant, country
   - Filter by specific rules
   - Amount range filtering
   - Transaction type filtering
   - Severity and action-based filtering

6. **Transaction Detail Modal**
   - Comprehensive transaction view
   - All matching rules with detailed reasons
   - Non-matching rules overview
   - Complete transaction and merchant information

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useMemo, useTransition)

## Prerequisites

- **Node.js** 18 or higher
- **npm** or **yarn** package manager

## Installation & Setup

### Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including Next.js, React, TypeScript, and Tailwind CSS.

### Step 2: Run Development Server

```bash
npm run dev
```

The application will start on [http://localhost:3000](http://localhost:3000)

### Step 3: Open in Browser

Navigate to [http://localhost:3000](http://localhost:3000) in your web browser.

### Important Notes

**Initial Load Time**: The project uses large JSON files (500k+ transactions). The first build/run may take 30-60 seconds while Next.js processes the JSON files. This is normal and subsequent runs will be faster due to caching.

**If You Encounter Issues**:

1. **JSON Import Errors**: Ensure all three JSON files are in the root directory:
   - `transactions.json`
   - `feature_vectors.json`
   - `example_rules.json`

2. **Clear Cache**: If you encounter build issues, clear the Next.js cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Node Version**: Verify you're using Node.js 18+:
   ```bash
   node --version
   ```

## Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
take_home_assessment/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with navigation
│   │   ├── page.tsx            # Home page (summary dashboard)
│   │   ├── debug/
│   │   │   └── page.tsx        # Interactive rule debugging page
│   │   ├── rules/
│   │   │   └── page.tsx        # Rules overview page
│   │   ├── transactions/
│   │   │   └── page.tsx        # Transactions browser page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── Dashboard.tsx       # Main 3-column debugging dashboard
│   │   ├── DashboardSummary.tsx # Home page summary component
│   │   ├── RuleCard.tsx        # Rule display card
│   │   ├── RuleInspector.tsx   # Rule evaluation inspector
│   │   ├── RulesPage.tsx       # Rules listing page component
│   │   ├── TransactionTable.tsx # Transaction list table
│   │   ├── TransactionDetail.tsx # Transaction detail modal
│   │   ├── FeatureVectorViewer.tsx # Feature vector display
│   │   ├── FilterPanel.tsx     # Filter controls
│   │   └── Navigation.tsx     # Global navigation component
│   └── lib/
│       ├── types.ts            # TypeScript type definitions
│       ├── dataLoader.ts       # JSON data loading utilities
│       └── ruleEvaluator.ts    # Rule evaluation engine
├── transactions.json           # Transaction data (500k+ records)
├── feature_vectors.json        # Feature vector data
├── example_rules.json          # Rule definitions
├── package.json                # Project dependencies
├── tsconfig.json               # TypeScript configuration
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── postcss.config.js           # PostCSS configuration
```

## Usage Guide

### Home Page (`/`)
- Overview dashboard with summary statistics
- Top rules by match count
- Recent transactions
- Quick navigation to other pages

### Rules Page (`/rules`)
- View all 7 fraud detection rules
- See match counts for each rule
- Filter and search rules
- Click on rules to see details

### Transactions Page (`/transactions`)
- Browse all transactions with pagination
- Advanced filtering (search, amount, type, severity, action)
- Sort by any column
- Click transactions to view details

### Debug Page (`/debug`)
- **Three-column layout for rule debugging**:
  - **Left**: Rules list - Click to select a rule
  - **Middle**: Transactions table - Click to select a transaction
  - **Right**: Rule Inspector - Shows evaluation results
- Real-time rule evaluation
- Step-through rule logic
- Feature vector visualization

### Using Filters

1. **Search**: Type in the search box to filter by transaction ID, merchant name, or country
2. **Rule Filter**: Select a specific rule to see only matching transactions
3. **Expand Filters**: Click "Expand" for advanced options:
   - Amount range (min/max)
   - Transaction types (online, contactless, chip_and_pin, etc.)
   - Severity levels (Critical, High, Medium, Low)
   - Action types (Block, Alert, Review, Investigate)

### Debugging a Rule

1. Navigate to `/debug` page
2. Select a rule from the left panel
3. Select a transaction from the middle panel
4. View evaluation results in the right panel (Rule Inspector)
5. See detailed reasons why the rule matches or doesn't match
6. Review feature vector data used in evaluation

## Rule Evaluation Logic

The dashboard implements evaluation logic for all 7 rules:

1. **RULE_001**: High Value Transaction Alert
   - Threshold: $1,000
   - Flags transactions exceeding the threshold

2. **RULE_002**: Multiple Small Transactions
   - Amount threshold: < $50
   - Frequency threshold: ≥ 5 transactions
   - Detects potential structuring behavior

3. **RULE_003**: Unusual Transaction Type
   - Compares against common types (online, contactless, chip)
   - Flags unusual transaction patterns

4. **RULE_004**: High-Risk Merchant
   - Keyword-based detection (casino, gambling, bet, crypto, bitcoin)
   - Flags transactions to suspicious merchants

5. **RULE_005**: Cross-Border Transaction Anomaly
   - Amount threshold: ≥ $500
   - Checks if merchant country differs from common countries
   - Detects potential account compromise

6. **RULE_006**: Transaction Outside Normal Hours
   - Normal hours: 9 AM - 6 PM
   - Flags transactions outside business hours

7. **RULE_007**: Large Cash Withdrawal
   - Amount threshold: ≥ $500
   - Detects cash/ATM transactions
   - High-risk transaction type

## Performance Optimizations

- **Memoization**: Rule evaluations are memoized to prevent recalculation
- **Pagination**: Transactions are paginated (20 per page) for better performance
- **Lazy Loading**: Data is loaded once and cached using dynamic imports
- **Efficient Filtering**: Filters use optimized array methods
- **React Transitions**: Non-blocking UI updates during filtering operations

## Design Decisions

1. **Three-Column Layout** (Debug Page):
   - Clear separation: Rules | Transactions | Inspector
   - Enables side-by-side comparison
   - Intuitive workflow for debugging

2. **Color Coding**:
   - Severity: Red (Critical) → Orange (High) → Yellow (Medium) → Green (Low)
   - Visual indicators for matches vs non-matches
   - Consistent color scheme throughout

3. **Modal for Details**:
   - Transaction detail modal provides focused view
   - Doesn't disrupt main workflow
   - Easy to close and return

4. **Real-time Evaluation**:
   - Rules evaluated on-the-fly
   - Results update immediately when selections change
   - No need to refresh or reload

5. **Instant Filter Feedback**:
   - UI updates immediately when filters change
   - Loading indicators during heavy computations
   - Non-blocking user experience

## Troubleshooting

### Build Errors
- Ensure Node.js version is 18+
- Clear `.next` folder and rebuild
- Verify all JSON files are in root directory

### Runtime Errors
- Check browser console for specific error messages
- Verify all dependencies are installed (`npm install`)
- Clear browser cache and reload

### Performance Issues
- Initial load may take 30-60 seconds (normal for large datasets)
- Use filters to narrow down results
- Pagination helps with large result sets

## License

This is a take-home assessment project.

---

**Built for fraud detection rule debugging**
