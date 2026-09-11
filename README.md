# 🕊️ Babi-Savings — Shared Couples Finance & Budgeting Platform

> An advanced, mobile-first web application designed specifically for couples to manage joint finances, category budgets, recurring subscriptions, and shared savings goals using Google Sheets API v4 as a headless database, deployed on Vercel.

---

## 🌟 Key Architecture & Highlights

- **Framework**: Next.js 15 (App Router, React 19, TypeScript).
- **Headless Database**: Google Sheets API v4 via `googleapis` with server-side proxy isolation.
- **Dual-Backend Provider**: Seamlessly boots with Google Sheets or fallback store, automatically creating required tabs and headers.
- **Formula Injection Defense**: Strips and escapes dangerous formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`) before persisting to Google Sheets.
- **Receipt Attachments**: Direct proxy to Google Drive API with automatic share permissions and thumbnail generation.
- **PWA & Offline Capability**: Service worker caching and IndexedDB offline transaction queue that auto-syncs when reconnecting.
- **Security**: `HttpOnly`, `SameSite=Strict`, `Secure` JWT session cookies, authorized Google SSO restriction, and 15-minute PIN unlock security gate.
- **Couple Collaboration**: Dedicated partner profile customization, large expense approval badges (>= $200), savings deposits, and automatic IOU balance calculation for non-50/50 splits.

---

## 📊 Complete Google Sheets Database Schema

Create a new Google Spreadsheet and share it with your Service Account Email with **Editor** permissions. Babi-Savings automatically verifies and seeds the header rows across these 6 tabs:

### 1. Tab: `Users`
| Header | Type | Description |
|---|---|---|
| `id` | string | Unique user identifier |
| `partnerKey` | string | `partner_a` or `partner_b` |
| `name` | string | Display name |
| `email` | string | Email address |
| `themeAccent` | string | Hex color |
| `nickname` | string | Custom nickname |
| `avatarUrl` | string | Profile photo URL |
| `createdAt` | ISO string | Timestamp |

### 2. Tab: `Transactions`
| Header | Type | Description |
|---|---|---|
| `id` | string | Unique transaction ID |
| `date` | YYYY-MM-DD | Expense / deposit date |
| `amount` | number | Amount spent or saved |
| `category` | string | Category tag |
| `description` | string | Expense / deposit description |
| `paidBy` | string | `partner_a` or `partner_b` |
| `splitRatio` | string | `50/50`, `60/40`, `70/30`, `100/0`, `0/100`, `custom` |
| `partnerASplitPercentage` | number | Partner A percentage (0-100) |
| `isRecurring` | boolean | Recurring flag |
| `needsApproval` | boolean | True if >= $200 |
| `approvedByPartner` | boolean | Partner acknowledgment flag |
| `receiptUrl` | string | Google Drive view URL |
| `notes` | string | Partner comment thread / notes |
| `type` | string | `expense` or `savings` |
| `goalId` | string | Target savings goal ID |
| `createdAt` | ISO string | Creation timestamp |

### 3. Tab: `Budgets`
| Header | Type | Description |
|---|---|---|
| `id` | string | Unique budget ID |
| `category` | string | Category name |
| `icon` | string | Lucide icon name |
| `monthlyLimit` | number | Monthly cap |
| `spentAmount` | number | MTD spent |
| `rolloverEnabled` | boolean | Rollover toggle |
| `rolloverAccumulated` | number | Rolled over surplus |
| `alertThreshold` | number | Alert fraction (0.9 = 90%) |
| `monthYear` | YYYY-MM | Target month |

### 4. Tab: `Goals`
| Header | Type | Description |
|---|---|---|
| `id` | string | Unique goal ID |
| `title` | string | Goal title |
| `emoji` | string | Display emoji |
| `targetAmount` | number | Total target |
| `currentAmount` | number | Current accumulated |
| `targetDate` | YYYY-MM-DD | Target completion date |
| `category` | string | Category tag |
| `priority` | string | `high`, `medium`, `low` |
| `partnerAContribution` | number | Partner A total contribution |
| `partnerBContribution` | number | Partner B total contribution |
| `roundupEnabled` | boolean | Spare change sweep toggle |
| `roundupUnit` | number | `1` or `5` (round to nearest $1 or $5) |
| `status` | string | `active`, `achieved`, `paused` |
| `createdAt` | ISO string | Timestamp |

### 5. Tab: `Recurring`
| Header | Type | Description |
|---|---|---|
| `id` | string | Unique subscription ID |
| `title` | string | Service or lease name |
| `amount` | number | Current monthly charge |
| `frequency` | string | `monthly`, `weekly`, `yearly` |
| `billingDay` | number | Day of month (1-31) |
| `category` | string | Category tag |
| `paidBy` | string | `partner_a` or `partner_b` |
| `lastBilledDate` | YYYY-MM-DD | Last transaction date |
| `previousAmount` | number | Previous charge (for inflation alert) |
| `lastActiveDate` | YYYY-MM-DD | Date last used (for unused warning) |
| `status` | string | `active`, `flagged`, `cancelled` |
| `notes` | string | Notes / terms |

### 6. Tab: `Settlements`
| Header | Type | Description |
|---|---|---|
| `id` | string | Unique settlement ID |
| `date` | YYYY-MM-DD | Settlement date |
| `fromPartner` | string | Debtor partner |
| `toPartner` | string | Creditor partner |
| `amount` | number | Amount transferred |
| `status` | string | `settled`, `pending` |
| `note` | string | Settlement note |

---

## 🛠️ Step-by-Step Setup & Deployment Guide

### Step 1: Google Cloud Service Account Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named `babi-savings`.
3. Enable both **Google Sheets API** and **Google Drive API** in *APIs & Services > Library*.
4. Navigate to *IAM & Admin > Service Accounts*, click **Create Service Account**:
   - Service account name: `babi-savings-service`
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

# 3. Fill in your credentials in .env.local
# 4. Start local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your desktop or mobile device.

---

### Step 3: Deploying to Vercel
1. Push your repository to GitHub (`main` branch).
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New > Project**.
3. Import your Babi-Savings repository.
4. Under **Environment Variables**, configure:
   - `JWT_SECRET`: Any random 64-character string
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: `babi-savings-service@your-project.iam.gserviceaccount.com`
   - `GOOGLE_PRIVATE_KEY`: Complete private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
   - `GOOGLE_SHEET_ID`: Your Google Spreadsheet ID
   - `GOOGLE_DRIVE_RECEIPTS_FOLDER_ID`: Your Google Drive Folder ID
   - `GOOGLE_CLIENT_ID`: Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret
   - `PARTNER_A_EMAIL`: Partner A's authorized Google email
   - `PARTNER_B_EMAIL`: Partner B's authorized Google email
5. Click **Deploy**. Vercel will build the serverless edge routes and deploy your mobile-ready couples application in ~60 seconds!


