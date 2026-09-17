# Apex Business Management System - Frontend Web Application

A modern, fast, and responsive web application designed for private single-business inventory management, point-of-sale invoicing, purchase tracking, expense accounting, and multi-step Profit & Loss reporting.

Built using **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **TanStack React Query**.

---

## 🌟 Key Features

1. **Executive Dashboard**:
   - Live KPI cards: Total Revenue, Gross Profit, Total Stock Valuation, Low Stock Alerts.
   - Interactive 30-day Revenue vs Expenses vs Profit area chart.
   - Real-time system health metrics and recent transactions.

2. **Product Catalog (`/products`)**:
   - Real-time search, category/brand filters, and stock level warnings.
   - Add/Edit product modal with dynamic custom attributes builder (color, specs, expiry, size).
   - Opening stock auto-initialization and archive/restore lifecycle.

3. **Inventory & Movement Ledger (`/inventory`)**:
   - Stock valuation at purchase cost vs potential retail selling value.
   - Manual **Stock In** (receiving inventory with supplier/batch notes).
   - Manual **Stock Out** (damaged, expired, internal use, lost).
   - **Physical Count Adjustments** to synchronize shelf inventory with system records.
   - Comprehensive immutable stock movement ledger.

4. **Sales & POS Invoicing (`/sales`)**:
   - Fast Point of Sale (POS) checkout interface with instant product search and quantity controls.
   - Walk-in customer or registered customer selector with inline customer creation.
   - Line items with real-time tax, percentage/fixed discounts, and change calculations.
   - Printable formatted tax invoices (`window.print()`) with business branding.
   - Customer sales returns processing with automated inventory restock options.

5. **Purchases & Procurement (`/purchases`)**:
   - Supplier purchase order recording with multi-product line builder.
   - Automated inventory restock upon order confirmation.
   - Supplier accounts payable tracking and payment status tracking.

6. **Customer & Supplier CRM (`/customers` & `/suppliers`)**:
   - Contact directory with phone, email, and address.
   - Running ledger statements displaying debit, credit, and outstanding balance.

7. **Operational Expenses (`/expenses`)**:
   - Expense vouchers recording with payment methods and category allocation.
   - Category breakdown charts and distribution analytics.

8. **Financial Reports (`/reports` & `/reports/monthly`)**:
   - Certified Multi-Step **Income Statement (Profit & Loss)**:
     $$\text{Gross Sales} - \text{Returns} = \text{Net Sales}$$
     $$\text{Net Sales} - \text{COGS} = \text{Gross Profit}$$
     $$\text{Gross Profit} - \text{Operating Expenses} = \text{Net Operating Profit}$$
   - Top-performing products and categories breakdown.
   - Direct CSV export for sales and inventory datasets.
   - Dedicated monthly report with 30-day trajectory line chart.

9. **Dynamic Branding & Theme Engine (`/settings`)**:
   - 100% white-label ready: Primary, secondary, sidebar, and accent colors are configured via CSS variables and loaded from `BusinessSettings` in MongoDB.
   - Live color pickers and one-click "Reset to Default Theme".
   - Currency symbol/code, timezone, low-stock thresholds, negative stock prevention, and invoice prefixes.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS, CSS Variables for runtime dynamic re-theming
- **State & Data Fetching**: TanStack React Query v5, Axios
- **Visualization**: Recharts (Interactive Area, Line, and Pie charts)
- **Icons**: Lucide React

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- pnpm (recommended) or npm

### 2. Environment Configuration
Create a `.env.local` file in the `Front-End` folder:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
pnpm build
pnpm start
```

---

## 🔐 Default Credentials

When seeded via the backend (`pnpm seed:admin` in `back-End`):
- **Email**: `admin@apexenterprise.com`
- **Password**: `Admin@123456`
