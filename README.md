# AasaMedChem Inventory & Order Management System (MERN Stack)

A premium, full-stack enterprise dashboard migrated to the **MERN Stack** (MongoDB, Express, React, Node.js). Designed for lab managers, admins, and sellers to seamlessly catalog products, perform high-precision unit conversions, calculate quotation pricing, and track inventory stock adjustments.

---

## 1. Project Overview & Features

### Core Capabilities
*   **Dual Dashboard Experience**: 
    *   **Admin Panel**: CRUD catalog manager, real-time KPI stats (valuation, inventory alerts), and incoming quotation review (approvals and rejections with automated stock checks).
    *   **Seller/User Portal**: Interactive catalog browsing, filtering, search, and a high-precision quotation builder (cart) supporting flexible unit orders.
*   **High-Precision Unit Conversion Engine**: Seamlessly converts quantities and rates across weight (`g`, `kg`), volume (`mL`, `L`), and count (`items`) dimensions dynamically.
*   **MongoDB Decimal128 Precision**: High-precision decimal numbers are handled on the backend using mongoose `Decimal128` types and formatted to decimal strings in REST API responses to ensure zero floating-point rounding errors.
*   **Role-Based Access Control (RBAC)**: Secure cookie-based JWT session authentication verified in Express middleware.

---

## 2. Tech Stack & Directory Structure

### Technology Stack
*   **Frontend**: React (Vite), TypeScript, React Router v7, CSS Modules (Slate, Indigo, and Emerald color palette)
*   **Backend**: Node.js, Express, TypeScript, tsx (watcher)
*   **Database**: MongoDB (connected using Mongoose)
*   **Authentication**: Cookie-based JWT sessions (httpOnly, sameSite cookies)

### Directory Structure
```text
projectaasam/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Shared layout elements (Navigation sidebar)
│   │   ├── lib/            # Conversion helpers (conversions.ts)
│   │   ├── pages/          # Catalog and Order management views
│   │   ├── App.tsx         # Routing structure and private route guards
│   │   └── main.tsx        # Application entry point
│   ├── index.html          # HTML Shell
│   └── package.json        # Frontend scripts and configurations
│
├── server/                 # Express backend server
│   ├── src/
│   │   ├── lib/            # Shared conversion calculations (conversions.ts)
│   │   ├── middleware/     # Auth token verification and error handler
│   │   ├── models/         # Mongoose User, Product, Order schemas
│   │   ├── routes/         # Express Auth, Product, and Order controllers
│   │   ├── seed.ts         # Database population script
│   │   └── index.ts        # Express server startup file
│   ├── .env                # Local backend environment keys
│   └── package.json        # Backend dependencies and scripts
│
└── package.json            # Root workspace scripts
```

---

## 3. Storage & Conversion Strategy

### Mongoose Schemas (Decimal128)
High-precision fields like product price, stock quantities, ordered quantity, and item subtotals are stored as `mongoose.Schema.Types.Decimal128` fields. When JSON serialized, the route controllers output these fields as clean numeric strings (e.g. `"1200.00000000"`) rather than the native MongoDB Decimal wrapper to match client mathematical precision expectations.

### Unit Conversion Engine
Each product is saved with a configured `baseUnit` and `basePrice` (price per base unit) in the database.
*   **Weight**: `g` (grams) and `kg` (kilograms). Factor: `1 kg = 1000 g`
*   **Volume**: `mL` (milliliters) and `L` (liters). Factor: `1 L = 1000 mL`
*   **Count**: `items` (count). No conversions apply.

---

## 4. Setup & Running Locally

### Prerequisites
*   Node.js (v18.x or v20.x recommended)
*   MongoDB running locally on standard port `mongodb://localhost:27017`

### Installation & Launch
1.  Install dependencies for both folders from the root:
    ```bash
    npm run install:all
    ```

2.  Seed the local MongoDB database with mock data and demo user credentials:
    ```bash
    npm run seed
    ```

3.  Launch the applications:
    *   Start the Express backend (runs on port `5000`):
        ```bash
        npm run dev:server
        ```
    *   In a separate terminal, start the React client (runs on port `5173`):
        ```bash
        npm run dev:client
        ```

4.  Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 5. Test Credentials & Walkthrough

### Test Login Credentials
*   **Admin Dashboard**:
    *   **Email**: `admin@aasamedchem.com`
    *   **Password**: `admin123`
*   **Seller Portal**:
    *   **Email**: `seller@aasamedchem.com`
    *   **Password**: `seller123`

### Quotation & Order Flow Walkthrough
1.  **Authenticate**: Visit the login screen and click **Demo Seller** (or enter details manually) to sign in.
2.  **Add to Quotation**: Search for *"Aspirin"* (base unit `kg`) or *"Sodium Chloride"* (base unit `g`) in the catalog, and click **Add to Quotation**.
3.  **Convert Units**: Open the quotation cart, select `g` for Aspirin, and type `500`. Notice that the rate is automatically computed as `1.2000 INR/g`, and the subtotal shows `600.00 INR`. The base quantity is displayed as `0.5000 kg`.
4.  **Submit Order**: Click **Place Quotation / Order**.
5.  **Review as Admin**: Logout, log back in as **Admin User**. Click **Order Manager** to see the pending order, showing complete converted base quantity audits.
6.  **Approve & Deduct**: Click **Approve**. The status transitions to `APPROVED`, and the inventory stock levels for Aspirin are reduced by exactly `0.5 kg` in the database. Check the **Catalog Manager** to confirm that the new stock levels are reflected.
