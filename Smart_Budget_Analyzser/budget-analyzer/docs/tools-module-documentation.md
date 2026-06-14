# Tools Module — SRS Documentation
## Financial Tools & Calculators

**Application:** SecretsApp (React Native / Expo)
**Module:** Tools Tab (`app/(tabs)/tools.tsx`)
**Version:** 1.0
**Last Updated:** May 2026

---

## 1. Module Overview

The **Tools Module** is a dedicated tab in the SecretsApp mobile application that provides users with a suite of six fully offline, formula-based financial calculators — plus one live-rate currency converter. The module is designed to help Pakistani users make informed financial decisions covering loan planning, investment projections, tax compliance, budgeting, and savings goals.

### 1.1 Purpose

The Tools tab serves as an integrated financial toolkit within the app, eliminating the need for users to switch to external apps or websites for common financial calculations. All calculators operate locally on the device — no account, login, or internet connection is required (except the Currency Converter, which uses a live exchange-rate API).

### 1.2 Architecture & Navigation

- **Entry Point:** `app/(tabs)/tools.tsx` — `ToolsScreen` component
- **Navigation Pattern:** Each calculator opens as a **full-screen modal** (slide-up animation) from the Tools hub. The user returns to the hub via the back button in the modal header.
- **Calculator Files:** Located in `app/calculators/`
- **Shared Service:** Exchange-rate API service at `app/services/exchangeRateService.ts`

```
ToolsScreen (hub)
├── Currency Converter    → app/calculators/currency-converter.tsx
├── Loan / EMI Calculator → app/calculators/loan-calculator.tsx
├── Investment Calculator → app/calculators/investment-calculator.tsx
├── Budget Planner        → app/calculators/budget-planner.tsx
├── Tax Calculator        → app/calculators/tax-calculator.tsx
└── Savings Goal          → app/calculators/savings-goal.tsx
```

### 1.3 Tool Hub UI

The hub screen (`ToolsScreen`) displays all available calculators as a scrollable card list. Each card shows:
- A gradient icon badge
- Tool title and short description
- A tag badge (e.g., "Live Rates", "Formula Based", "FBR 2025-26")
- A chevron indicating it is tappable

If any tools are marked unavailable (coming soon), they are rendered in a separate dimmed grid below the available tools list.

---

## 2. Calculator Modules

---

### 2.1 Currency Converter

| Property       | Details                                         |
|----------------|-------------------------------------------------|
| **File**       | `app/calculators/currency-converter.tsx`        |
| **Tag**        | Live Rates                                      |
| **API**        | ExchangeRate-API v6 (`exchangerate-api.com`)    |
| **API Key**    | Configured in `exchangeRateService.ts`          |
| **Offline**    | Yes — uses cached rates via `AsyncStorage`      |

#### 2.1.1 Description

A bi-directional currency converter that allows users to convert between Pakistani Rupee (PKR) and 9 other major world currencies in real time. Rates are fetched from ExchangeRate-API, cached locally for offline use, and displayed with a cache-age indicator.

#### 2.1.2 Supported Currencies

| Code | Currency              |
|------|-----------------------|
| PKR  | Pakistani Rupee       |
| USD  | US Dollar             |
| EUR  | Euro                  |
| GBP  | British Pound         |
| SAR  | Saudi Riyal           |
| AED  | UAE Dirham            |
| CAD  | Canadian Dollar       |
| AUD  | Australian Dollar     |
| CNY  | Chinese Yuan          |
| JPY  | Japanese Yen          |

#### 2.1.3 Features

- **Bi-directional input:** Editing either the "from" or "to" field automatically calculates and fills the other field in real time.
- **Swap button:** Instantly swaps the source and target currencies with an animated rotation.
- **Currency picker:** Modal-based searchable list to select any supported currency.
- **Quick amount buttons:** Pre-set common amounts (PKR: 100, 500, 1K, 5K, 10K, 50K | USD: 1, 5, 10, 50, 100, 500) for fast one-tap entry.
- **Live rate indicator:** Shows current exchange rate, when it was last fetched, and whether the value is from live or cached data.
- **Rate direction indicator:** Visual up/down/neutral arrow showing whether the rate has moved since last check.
- **Conversion history:** Stores up to the last 10 conversions in `AsyncStorage` with timestamp, currencies, amount, and result; displayed in a collapsible history panel.
- **Offline support:** If the network is unavailable, the last cached rate is used and a "From cache" indicator is shown with the cache age.
- **Manual refresh:** Refresh button to force a new rate fetch from the API.

#### 2.1.4 Data Flow

```
User Input Amount
      │
      ▼
exchangeRateService.convert(amount, from, to)
      │
      ├─── Cache hit (< 1 hour old) ──► Return cached rate
      │
      └─── Cache miss ──► Fetch from API ──► Cache in AsyncStorage ──► Return rate
```

---

### 2.2 Loan / EMI Calculator

| Property   | Details                                       |
|------------|-----------------------------------------------|
| **File**   | `app/calculators/loan-calculator.tsx`         |
| **Tag**    | Formula Based                                 |
| **API**    | None — fully offline                          |

#### 2.2.1 Description

Calculates the monthly EMI (Equated Monthly Instalment) for any loan, along with total interest payable, total repayment amount, and a complete month-by-month amortization schedule.

#### 2.2.2 Inputs

| Input Field        | Description                            | Default  |
|--------------------|----------------------------------------|----------|
| Loan Amount (PKR)  | Principal loan amount                  | 500,000  |
| Annual Interest (%)| Yearly interest rate                   | 12%      |
| Loan Tenure        | Duration in years or months (toggle)   | 5 Years  |
| Processing Fee (%) | One-time upfront bank fee              | 1%       |

#### 2.2.3 Calculation Formula

**EMI Formula (Reducing Balance):**
```
EMI = P × r × (1 + r)ⁿ / ((1 + r)ⁿ − 1)

Where:
  P = Principal loan amount
  r = Monthly interest rate = Annual Rate / 12 / 100
  n = Total number of monthly instalments
```

If interest rate is 0%, EMI = P / n (simple division).

**Total Interest** = (EMI × n) − P  
**Total Payment** = EMI × n  
**Processing Fee** = P × (Fee% / 100)

#### 2.2.4 Outputs & UI

- **EMI Card** — Monthly instalment amount (highlighted)
- **Result Cards** — Total Interest, Total Payment, Processing Fee
- **Pie Chart** — SVG donut chart showing Principal vs Interest percentage split
- **Amortization Schedule** (collapsible) — Month-by-month table showing:
  - Month number
  - EMI paid
  - Interest component
  - Principal component
  - Remaining balance
  *(Displayed for up to 60 months to maintain performance)*

---

### 2.3 Investment Calculator

| Property   | Details                                          |
|------------|--------------------------------------------------|
| **File**   | `app/calculators/investment-calculator.tsx`      |
| **Tag**    | Formula Based                                    |
| **API**    | None — fully offline                             |

#### 2.3.1 Description

Projects the future value of an investment using compound interest. Supports two investment modes: a one-time **Lump Sum** deposit, or a recurring **Monthly SIP** (Systematic Investment Plan). Users can select compounding frequency and visualize year-by-year growth as a bar chart.

#### 2.3.2 Inputs

| Input Field            | Description                                    | Default  |
|------------------------|------------------------------------------------|----------|
| Investment Amount (PKR)| Principal (lump sum) or monthly SIP amount     | —        |
| Annual Return Rate (%) | Expected yearly return percentage              | 12%      |
| Investment Period (Yrs)| Number of years to invest                      | 10       |
| Compounding Frequency  | Monthly / Quarterly / Yearly (toggle)          | Monthly  |

#### 2.3.3 Calculation Formulas

**Lump Sum Future Value:**
```
FV = P × (1 + r/n)^(n×t)

Where:
  P = Principal
  r = Annual rate (decimal)
  n = Compounding frequency per year (12 / 4 / 1)
  t = Time in years
```

**Monthly SIP Future Value (annuity due):**
```
FV = PMT × ((1 + r_m)^months − 1) / r_m × (1 + r_m)

Where:
  PMT     = Monthly investment amount
  r_m     = Monthly rate = Annual Rate / 12 / 100
  months  = t × 12
```

#### 2.3.4 Outputs & UI

- **Stat Cards** — Future Value, Total Invested, Total Returns, Return %
- **Bar Chart** — SVG bar chart showing portfolio value at the end of each year across the investment period
- **Breakdown Row** — Shows total invested vs total returns with percentage gain

---

### 2.4 Budget Planner

| Property   | Details                                        |
|------------|------------------------------------------------|
| **File**   | `app/calculators/budget-planner.tsx`           |
| **Tag**    | Formula Based                                  |
| **API**    | None — fully offline                           |

#### 2.4.1 Description

An interactive monthly budget planner based on the popular **50/30/20 Rule** of personal finance. The user enters their monthly income and the tool automatically allocates it across Needs, Wants, and Savings. Ratios are customizable. An optional actual-spending comparison shows over/under budget status per category.

#### 2.4.2 The 50/30/20 Rule

| Category | Default % | Purpose                                                 |
|----------|-----------|---------------------------------------------------------|
| Needs    | 50%       | Rent, utilities, groceries, transport, bills            |
| Wants    | 30%       | Dining, entertainment, shopping, hobbies                |
| Savings  | 20%       | Emergency fund, investments, debt repayment             |

The ratios are user-adjustable sliders/inputs and must sum to 100%.

#### 2.4.3 Inputs

| Input Field         | Description                                   |
|---------------------|-----------------------------------------------|
| Monthly Income (PKR)| Total take-home pay after tax                 |
| Needs %             | Percentage allocated to essential expenses    |
| Wants %             | Percentage allocated to discretionary spending|
| Savings %           | Percentage allocated to savings/investments   |
| Actual Spending     | Optional: actual monthly spend per category   |

#### 2.4.4 Outputs & UI

- **Donut Chart** — SVG donut chart showing the three budget segments (Needs/Wants/Savings) proportionally
- **Allocation Cards** — Recommended PKR amount for each of the three categories
- **Category Breakdown** — Suggested sub-categories under each bucket (e.g., Rent, Food, Transport under Needs) with their suggested allocation
- **Actual vs Budget Comparison** — If actual spending is provided, a progress bar per category shows how much of the budget has been used, with over-budget warnings highlighted in red

---

### 2.5 Tax Calculator

| Property   | Details                                          |
|------------|--------------------------------------------------|
| **File**   | `app/calculators/tax-calculator.tsx`             |
| **Tag**    | FBR 2025-26                                      |
| **API**    | None — fully offline                             |
| **Source** | FBR Finance Act 2025 / PwC Tax Summaries         |

#### 2.5.1 Description

A Pakistan Federal Board of Revenue (FBR) income tax calculator reflecting the latest **Finance Act 2025 (FY 2025-26)** tax slabs. Supports both **Salaried** and **Business / AOP (Association of Persons)** income types, filer vs. non-filer status, allowable deductions (Zakat, charitable donations), and a year-over-year tax comparison showing how much the user saves under the new Finance Act 2025 versus FY 2024-25.

#### 2.5.2 Income Type Toggle

| Mode         | Applies To                                      |
|--------------|-------------------------------------------------|
| Salaried     | Individuals whose primary income is from salary |
| Business/AOP | Freelancers, business owners, shop owners, AOPs |

#### 2.5.3 Tax Slabs — Salaried Individuals (FY 2025-26)

| Taxable Annual Income (PKR) | Fixed Tax (PKR) | Rate on Excess |
|-----------------------------|-----------------|----------------|
| 0 – 600,000                 | 0               | 0%             |
| 600,001 – 1,200,000         | 0               | 1%             |
| 1,200,001 – 2,200,000       | 6,000           | 11%            |
| 2,200,001 – 3,200,000       | 116,000         | 23%            |
| 3,200,001 – 4,100,000       | 346,000         | 30%            |
| Above 4,100,000             | 616,000         | 35%            |

*Surcharge: 9% of income tax if taxable income exceeds Rs. 10 million.*

#### 2.5.4 Tax Slabs — Business / Non-Salaried / AOP (FY 2025-26)

| Taxable Annual Income (PKR) | Fixed Tax (PKR) | Rate on Excess |
|-----------------------------|-----------------|----------------|
| 0 – 600,000                 | 0               | 0%             |
| 600,001 – 1,200,000         | 0               | 15%            |
| 1,200,001 – 2,400,000       | 90,000          | 20%            |
| 2,400,001 – 3,600,000       | 330,000         | 30%            |
| 3,600,001 – 6,000,000       | 690,000         | 35%            |
| Above 6,000,000             | 1,530,000       | 40% (AOP cap)  |

*Surcharge: 10% of income tax if taxable income exceeds Rs. 10 million.*

#### 2.5.5 Inputs

| Input Field              | Description                                         |
|--------------------------|-----------------------------------------------------|
| Annual Gross Income (PKR)| Total yearly income before deductions               |
| Income Type              | Salaried Person / Business & AOP (toggle)           |
| FBR Filer Status         | Active Filer / Non-Filer (toggle)                   |
| Zakat Paid (PKR)         | Zakat amount paid (deducted from taxable income)    |
| Charitable Donations (PKR)| Eligible charitable donations (deductible)         |

#### 2.5.6 Tax Computation Logic

```
1. Taxable Income = Gross Income − Zakat − Donations
2. Base Tax       = computeTax(Taxable Income, applicable slabs)
   (iterates through slabs; Tax = Fixed + Rate × (Income − SlabMin))
3. High-Income Surcharge = Base Tax × 9% (salaried) or 10% (business)
                          (only if Taxable Income > Rs. 10,000,000)
4. Non-Filer Surcharge   = Base Tax × 25%
                          (only if filer status = Non-Filer)
5. Total Tax    = Base Tax + Applicable Surcharges
6. Effective Rate = (Total Tax / Gross Income) × 100
```

#### 2.5.7 Outputs & UI

- **Total Annual Tax** — Large highlighted display with effective tax rate badge (colour-coded: green < 5%, amber 5–15%, red > 15%)
- **Breakdown Table** — Line-by-line: Gross Income → Deductions → Taxable Income → Base Tax → Surcharge (if any) → Total Tax Payable
- **Net Income Cards** — Monthly Tax, Net Annual Income, Net Monthly Take-Home
- **Year-over-Year Comparison Card** — Side-by-side FY 2024-25 vs FY 2025-26 tax amounts with tax saving / extra amount highlighted in green/red
- **Filer vs Non-Filer Comparison** — Shows annual tax for active filer vs non-filer, with the saving amount displayed in the centre
- **Tax Slabs Table** (collapsible) — Full slab table for the selected income type with the user's applicable slab highlighted in pink

---

### 2.6 Savings Goal Calculator

| Property   | Details                                          |
|------------|--------------------------------------------------|
| **File**   | `app/calculators/savings-goal.tsx`               |
| **Tag**    | Formula Based                                    |
| **API**    | None — fully offline                             |

#### 2.6.1 Description

Helps users plan a path to a specific savings target. Operates in two modes:  
- **How Long?** — Given a monthly contribution and interest rate, calculates how many months/years it will take to reach the goal.  
- **How Much Monthly?** — Given a target deadline (number of months), calculates the exact monthly saving required.

Includes milestone tracking at 25%, 50%, 75%, and 100% completion, a progress bar for current savings status, a yearly growth chart, and a timeline visualization.

#### 2.6.2 Inputs

| Input Field            | Description                                             |
|------------------------|---------------------------------------------------------|
| Savings Goal (PKR)     | Target amount the user wants to accumulate              |
| Current Savings (PKR)  | Amount already saved towards the goal                   |
| Annual Interest Rate (%| Expected annual return/interest on savings              |
| Monthly Contribution   | (Mode: How Long?) Fixed monthly savings amount          |
| Target Months          | (Mode: How Much?) Number of months to reach the goal    |

#### 2.6.3 Calculation Formulas

**Mode 1 — How Long (iterative compound approach):**
```
Each month:  Balance = Balance × (1 + r) + Monthly Contribution
  Where r = Annual Rate / 100 / 12

Repeat until Balance ≥ Goal (capped at 1,200 months)
Total Contributions = Monthly × Months
Interest Earned     = Final Balance − Initial Savings − Total Contributions
```

**Mode 2 — How Much Monthly (annuity formula):**
```
FV of current savings = Current × (1 + r)^n
FV Factor (annuity due) = ((1 + r)^n − 1) / r × (1 + r)
Monthly Needed = (Goal − FV of current) / FV Factor

Where:
  r = Annual Rate / 100 / 12
  n = Target Months
```

If interest rate = 0: `Monthly Needed = (Goal − Current) / Target Months`

#### 2.6.4 Outputs & UI

- **Time to Goal** (Mode 1) — Total months broken into years + remaining months
- **Monthly Required** (Mode 2) — Exact PKR monthly savings needed
- **Summary Stats** — Total Contributions, Interest Earned, Final Amount
- **Current Progress Bar** — Shows how much of the goal is already achieved (Current Savings / Goal %)
- **Milestone Timeline Chart** — SVG timeline with 4 milestone markers at 25%, 50%, 75%, and 100% of the goal, showing which month each milestone is reached
- **Yearly Growth Data** — Bar chart showing accumulated savings at the end of each year
- **Milestone Cards** — Cards for each milestone showing label, month reached, and amount accumulated at that point

---

## 3. Technical Specifications

### 3.1 Technology Stack

| Layer             | Technology                              |
|-------------------|-----------------------------------------|
| Framework         | React Native (Expo SDK)                 |
| Language          | TypeScript                              |
| Navigation        | Expo Router (file-based)                |
| State Management  | React `useState`, `useCallback` hooks   |
| Local Storage     | `@react-native-async-storage/async-storage` |
| Charts            | `react-native-svg` (custom SVG components) |
| Icons             | `@expo/vector-icons` (Ionicons, MaterialCommunityIcons) |
| Gradients         | `expo-linear-gradient`                  |
| Exchange Rate API | ExchangeRate-API v6                     |

### 3.2 Chart Types Used

| Calculator         | Chart Type      | Library           |
|--------------------|-----------------|-------------------|
| Loan / EMI         | Pie Chart (SVG) | react-native-svg  |
| Investment         | Bar Chart (SVG) | react-native-svg  |
| Budget Planner     | Donut Chart (SVG)| react-native-svg |
| Tax Calculator     | None (tables)   | —                 |
| Savings Goal       | Timeline + Bar  | react-native-svg  |

### 3.3 Data Persistence

| Data                    | Storage Mechanism    | Key                   |
|-------------------------|----------------------|-----------------------|
| Exchange rates cache    | AsyncStorage         | (managed by service)  |
| Conversion history      | AsyncStorage         | `conversion_history`  |
| Calculator inputs/results| React state (in-memory, not persisted) | — |

### 3.4 Offline Behaviour

| Calculator         | Offline Support |
|--------------------|-----------------|
| Currency Converter | Partial (cached rates; shows cache age) |
| Loan / EMI         | Full (formula-based) |
| Investment         | Full (formula-based) |
| Budget Planner     | Full (formula-based) |
| Tax Calculator     | Full (formula-based) |
| Savings Goal       | Full (formula-based) |

---

## 4. User Interface Design Principles

- **Consistent card-based layout:** Every calculator uses white rounded cards (`borderRadius: 20`, `elevation: 3`) with a coloured gradient hero banner at the top.
- **Colour coding per calculator:**

  | Calculator         | Primary Gradient           |
  |--------------------|----------------------------|
  | Currency Converter | Blue (`#4f8cff → #6a82fb`) |
  | Loan / EMI         | Green (`#00b894 → #00cec9`)|
  | Investment         | Purple (`#a29bfe → #6c5ce7`)|
  | Budget Planner     | Orange (`#fdcb6e → #e17055`)|
  | Tax Calculator     | Pink (`#fd79a8 → #e84393`) |
  | Savings Goal       | Teal (`#55efc4 → #00b894`) |

- **Input validation:** All numeric inputs strip non-numeric characters on change. Results are only shown after the "Calculate" button is pressed, preventing display of invalid intermediate states.
- **Formatted numbers:** All PKR amounts are formatted with `toLocaleString('en-PK')` and prefixed with the Rupee symbol (₨).
- **Progressive disclosure:** Large outputs such as amortization schedules and tax slab tables are collapsible (toggle show/hide) to keep the screen clean.
- **Responsive toggle controls:** Mode switches (e.g., Salaried/Business, Filer/Non-Filer, Lump Sum/SIP) use segmented button-style toggles with active state highlights.

---

## 5. Functional Requirements Summary

| FR ID  | Requirement                                                                 |
|--------|-----------------------------------------------------------------------------|
| FR-T01 | The system shall display a list of all available financial tools/calculators on the Tools tab. |
| FR-T02 | Each calculator shall open in a full-screen modal with a back button.       |
| FR-T03 | The Currency Converter shall fetch live exchange rates from ExchangeRate-API. |
| FR-T04 | The Currency Converter shall cache rates locally and work offline using cached data. |
| FR-T05 | The Currency Converter shall support bi-directional input between at least 10 currencies. |
| FR-T06 | The Currency Converter shall maintain a history of the last 10 conversions.  |
| FR-T07 | The Loan Calculator shall compute EMI using the reducing-balance formula.    |
| FR-T08 | The Loan Calculator shall generate a month-by-month amortization schedule.  |
| FR-T09 | The Investment Calculator shall support both Lump Sum and Monthly SIP modes. |
| FR-T10 | The Investment Calculator shall support monthly, quarterly, and yearly compounding. |
| FR-T11 | The Budget Planner shall apply the 50/30/20 rule with user-adjustable ratios.|
| FR-T12 | The Budget Planner shall allow comparison of actual vs. budgeted spending.  |
| FR-T13 | The Tax Calculator shall apply Pakistan FBR tax slabs for FY 2025-26.       |
| FR-T14 | The Tax Calculator shall support both Salaried and Business/AOP income types.|
| FR-T15 | The Tax Calculator shall apply Zakat and charitable donation deductions.    |
| FR-T16 | The Tax Calculator shall compare FY 2024-25 and FY 2025-26 tax to show relief.|
| FR-T17 | The Tax Calculator shall apply a 9%/10% surcharge for incomes above Rs. 10 million.|
| FR-T18 | The Savings Goal calculator shall support "How Long?" and "How Much Monthly?" modes. |
| FR-T19 | The Savings Goal calculator shall display milestone markers at 25/50/75/100% of the goal. |
| FR-T20 | All formula-based calculators shall function fully without any internet connection. |

---

## 6. Non-Functional Requirements

| NFR ID  | Requirement                                                                 |
|---------|-----------------------------------------------------------------------------|
| NFR-T01 | All calculations shall produce results within 100ms on a mid-range Android device. |
| NFR-T02 | Exchange rate cache shall expire after 1 hour, triggering a fresh API fetch. |
| NFR-T03 | The UI shall be responsive on screen widths from 360dp to 428dp (standard mobile range). |
| NFR-T04 | Tax slab data shall be maintained and updatable per annual FBR Finance Act. |
| NFR-T05 | No user financial data shall be transmitted to any server (all calculations are client-side). |

---

## 7. Known Constraints & Limitations

- The **Currency Converter** requires an active internet connection for fresh rates; if offline and no cache exists, conversion is unavailable.
- The **Amortization Schedule** displays a maximum of 60 monthly rows to maintain scrolling performance; loans longer than 5 years will have partial schedule display.
- The **Tax Calculator** does not cover: corporate tax, withholding tax on specific transactions, tax credits (other than Zakat/donations), or super-tax on high-income entities.
- The **Business/AOP** tax slabs for FY 2025-26 apply standard FBR progressive rates; minimum turnover tax (1% of gross turnover) is not computed in this module.
- All PKR amounts are integers (rounded); fractional paisa values are not displayed.

---

*End of Tools Module Documentation*
