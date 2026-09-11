# 🕊️ DuoNest — Shared Couples Finance & Budgeting Platform

> An advanced, mobile-first web application designed specifically for couples to manage joint finances, category budgets, recurring subscriptions, and shared savings goals using Google Sheets API v4 as a headless database, deployed on Vercel.

---

## 🌟 Key Architecture & Highlights

- **Framework**: Next.js 15 (App Router, React 19, TypeScript).
- **Headless Database**: Google Sheets API v4 via `googleapis` with server-side proxy isolation.
- **Dual-Backend Provider**: Seamlessly boots in local/demo mode with seeded realistic data when Google credentials are not set, and automatically connects to live Google Sheets once credentials are provided in `.env.local` or Vercel.
- **Formula Injection Defense**: Strips and escapes dangerous formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`) before persisting to Google Sheets.
- **Receipt Attachments**: Direct proxy to Google Drive API with automatic share permissions and thumbnail generation.
- **PWA & Offline Capability**: Service worker caching and IndexedDB offline transaction queue that auto-syncs when reconnecting.
- **Security**: `HttpOnly`, `SameSite=Strict`, `Secure` JWT session cookies, `bcryptjs` credential hashing, and 15-minute PIN unlock security gate.
- **Couple Collaboration**: Partner A ("Alex") vs Partner B ("Sam") active profile switching, large expense approval badges (> $200), shared transaction comment threads, and automatic IOU balance calculation for non-50/50 splits.

---

## 📊 Complete Google Sheets Database Schema

Create a new Google Spreadsheet and share it with your Service Account Email with **Editor** permissions. DuoNest automatically verifies and seeds the header rows across these 6 tabs:

### 1. Tab: `Users`
| Header | Type | Description | Sample Data |
|---|---|---|---|
| `id` | string | Unique user identifier | `user_a` |
| `partnerKey` | string | `partner_a` or `partner_b` | `partner_a` |
| `name` | string | Display name | `Alex Vance` |
| `email` | string | Email address | `alex@duonest.local` |
| `passwordHash` | string | bcrypt password hash | `$2a$10$...` |
| `pinHash` | string | bcrypt PIN hash | `$2a$10$...` |
| `themeAccent` | string | Hex color | `#6366f1` |
| `createdAt` | ISO string | Timestamp | `2026-01-01T00:00:00.000Z` |

### 2. Tab: `Transactions`
| Header | Type | Description | Sample Data |
|---|---|---|---|
| `id` | string | Unique transaction ID | `tx_1710000000` |
| `date` | YYYY-MM-DD | Expense date | `2026-09-12` |
| `amount` | number | Amount spent | `142.50` |
| `category` | string | Category tag | `Groceries` |
| `description` | string | Expense description | `Trader Joe's weekly haul` |
| `paidBy` | string | `partner_a` or `partner_b` | `partner_a` |
| `splitRatio` | string | `50/50`, `60/40`, `70/30`, `100/0`, `0/100` | `50/50` |
| `partnerASplitPercentage` | number | Partner A percentage (0-100) | `50` |
| `isRecurring` | boolean | Recurring flag | `false` |
| `needsApproval` | boolean | True if >= $200 | `false` |
| `approvedByPartner` | boolean | Partner acknowledgment flag | `true` |
| `receiptUrl` | string | Google Drive view URL | `https://drive.google.com/file/d/.../view` |
| `notes` | string | Partner comment thread / notes | `Restocked pantry staples` |
| `createdAt` | ISO string | Creation timestamp | `2026-09-12T10:00:00.000Z` |

### 3. Tab: `Budgets`
| Header | Type | Description | Sample Data |
|---|---|---|---|
| `id` | string | Unique budget ID | `bg_1` |
| `category` | string | Category name | `Groceries` |
| `icon` | string | Lucide icon name | `Utensils` |
| `monthlyLimit` | number | Monthly cap | `650` |
| `spentAmount` | number | MTD spent | `382.50` |
| `rolloverEnabled` | boolean | Rollover toggle | `true` |
| `rolloverAccumulated` | number | Rolled over surplus | `45.00` |
| `alertThreshold` | number | Alert fraction (0.9 = 90%) | `0.9` |
| `monthYear` | YYYY-MM | Target month | `2026-09` |

### 4. Tab: `Goals`
| Header | Type | Description | Sample Data |
|---|---|---|---|
| `id` | string | Unique goal ID | `goal_1` |
| `title` | string | Goal title | `Emergency Safety Cushion` |
| `emoji` | string | Display emoji | `🛡️` |
| `targetAmount` | number | Total target | `12000` |
| `currentAmount` | number | Current accumulated | `8400` |
| `targetDate` | YYYY-MM-DD | Target completion date | `2026-12-31` |
| `category` | string | Category tag | `Emergency` |
| `priority` | string | `high`, `medium`, `low` | `high` |
| `partnerAContribution` | number | Alex's total contribution | `4500` |
| `partnerBContribution` | number | Sam's total contribution | `3900` |
| `roundupEnabled` | boolean | Spare change sweep toggle | `true` |
| `roundupUnit` | number | `1` or `5` (round to nearest $1 or $5) | `1` |
| `status` | string | `active`, `achieved`, `paused` | `active` |
| `createdAt` | ISO string | Timestamp | `2026-01-01T00:00:00.000Z` |

### 5. Tab: `Recurring`
| Header | Type | Description | Sample Data |
|---|---|---|---|
| `id` | string | Unique subscription ID | `rec_1` |
| `title` | string | Service or lease name | `Netflix Premium 4K` |
| `amount` | number | Current monthly charge | `22.99` |
| `frequency` | string | `monthly`, `weekly`, `yearly` | `monthly` |
| `billingDay` | number | Day of month (1-31) | `14` |
| `category` | string | Category tag | `Entertainment` |
| `paidBy` | string | `partner_a` or `partner_b` | `partner_b` |
| `lastBilledDate` | YYYY-MM-DD | Last transaction date | `2026-08-14` |
| `previousAmount` | number | Previous charge (for inflation alert) | `19.99` |
| `lastActiveDate` | YYYY-MM-DD | Date last used (for unused warning) | `2026-07-01` |
| `status` | string | `active`, `flagged`, `cancelled` | `flagged` |
| `notes` | string | Notes / terms | `Raised by $3.00 last month` |

### 6. Tab: `Settlements`
| Header | Type | Description | Sample Data |
|---|---|---|---|
| `id` | string | Unique settlement ID | `stl_1` |
| `date` | YYYY-MM-DD | Settlement date | `2026-08-28` |
| `fromPartner` | string | Debtor partner | `partner_b` |
| `toPartner` | string | Creditor partner | `partner_a` |
| `amount` | number | Amount transferred | `150.00` |
| `status` | string | `settled`, `pending` | `settled` |
| `note` | string | Settlement note | `Settled concert tickets` |

---

## 🛠️ Step-by-Step Setup & Deployment Guide

### Step 1: Google Cloud Service Account Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named `duonest-finance`.
3. Enable both **Google Sheets API** and **Google Drive API** in *APIs & Services > Library*.
4. Navigate to *IAM & Admin > Service Accounts*, click **Create Service Account**:
   - Service account name: `duonest-service`
   - Role: Not strictly required at project level. Click Done.
5. Click on the created service account, go to the **Keys** tab, click **Add Key > Create new key > JSON**.
6. Download the key JSON file. You will need `client_email` and `private_key`.
7. Create a Google Spreadsheet, copy its Spreadsheet ID from the URL (`https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`), and click **Share** to grant `Editor` permissions to your `client_email`.
8. Create a folder in Google Drive for receipts, copy its Folder ID from the URL (`https://drive.google.com/drive/folders/<FOLDER_ID>`), and share it with your `client_email` as `Editor`.

---

### Step 2: Local Development Run
```bash
# 1. Clone or navigate into the workspace
cd "savings  web"

# 2. Copy the environment template
cp .env.example .env.local

# 3. Fill in your credentials in .env.local (or leave blank to use the built-in demo store)
# 4. Start local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your desktop or mobile device.

---

### Step 3: Deploying to Vercel
1. Push your repository to GitHub or GitLab.
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New > Project**.
3. Import your DuoNest repository.
4. Under **Environment Variables**, configure:
   - `JWT_SECRET`: Any random 64-character string
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: `duonest-service@your-project.iam.gserviceaccount.com`
   - `GOOGLE_PRIVATE_KEY`: Complete private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
   - `GOOGLE_SHEET_ID`: Your Google Spreadsheet ID
   - `GOOGLE_DRIVE_RECEIPTS_FOLDER_ID`: Your Google Drive Folder ID
5. Click **Deploy**. Vercel will build the serverless edge routes and deploy your mobile-ready couples application in ~60 seconds!

---

### Step 4: Google Single Sign-On (SSO) Setup (Optional)
To enable one-tap Google login for the couple:
1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), go to **Credentials > Create Credentials > OAuth client ID**.
2. Application type: **Web application**.
3. Under **Authorized redirect URIs**, add:
   - For local testing: `http://localhost:3000/api/auth/sso/callback`
   - For production Vercel: `https://your-duonest-project.vercel.app/api/auth/sso/callback`
4. Copy the generated `Client ID` and `Client Secret` into your Vercel Environment Variables:
   - `GOOGLE_CLIENT_ID`: `...apps.googleusercontent.com`
   - `GOOGLE_CLIENT_SECRET`: `...`
   - `PARTNER_A_EMAIL`: `alex@example.com`
   - `PARTNER_B_EMAIL`: `sam@example.com`
5. Partners can now click the Google icon in the top header to log in instantly with their Google accounts!

