# 🚀 **CRYONEL — Unified Crypto Automation Platform**

### _(CEX↔DEX Arbitrage BaaS + Copy Trading) • Claude Code + MCP (Context7) Ready • Optimized for Contabo Germany Debian 12 • Florida LLC Oriented_

> This single document defines the production‑ready architecture of CRYONEL, merging two high‑revenue crypto automation products:
>
> 1. **CEX↔DEX Arbitrage Bot-as-a-Service (BaaS)**
> 2. **Copy Trading Platform** (Master–Follower)
>
> It covers full backend/frontend stack, low‑latency deployment plan for **Contabo Germany VPS running Debian 12**, UI/UX specifications, database schema, queue design, security protocols, billing, monitoring, and integration with Claude Code MCP (Context7).
> Written for engineers/founders aiming for fast launch without compromising on compliance, security, or performance.

---

## 📌 TL;DR

- **Business Model:** SaaS BaaS + Copy Trading marketplace
  - Users connect **their own CEX API keys** and **their own wallets** — **no client funds held**
  - Withdrawal rights **disabled** at API key level
- **Engines:**
  - **Arbitrage Engine:** Market-neutral, Binance/Bybit ↔ Solana DEX (Jupiter/Raydium), optional EU-based CEX↔CEX (Kraken/Bitstamp/Coinbase)
  - **Copy Trading Engine:** Master sends normalized trade signals → Followers execute with position sizing, slippage control, and drawdown limits
- **Stack:** Node.js (TypeScript), ccxt, Jupiter API, Redis (BullMQ), PostgreSQL, Next.js, Tailwind, Docker, PM2, Nginx, Stripe
- **Hosting:** Contabo VPS, Germany (Frankfurt/Nürnberg), Debian 12, Nginx reverse proxy, Docker Compose orchestration
- **Compliance posture:** No custody, no advice, full encryption, GDPR-compliant storage (Germany data residency)
- **Revenue:** Subscription (200–500 USD/month) + optional profit share (%10–20 via Stripe)
- **Monitoring:** Prometheus + Grafana, OpenTelemetry traces for trading latency, health checks for RPC/CEX endpoints

---

## 🧭 Vision

CRYONEL aims to be the **most trusted, zero‑custody automation platform** for crypto traders seeking:

- Consistent market‑neutral returns (Arbitrage)
- Passive income from proven strategies (Copy Trading)
- Full transparency and control over funds

---

## 🏗 Architecture

### 1. VPS & Network Topology

- **Main VPS:** Contabo Germany, Debian 12, 8 vCPU / 16 GB RAM / NVMe SSD
- **Control Plane (Germany):**
  - Web (Next.js)
  - API (Express/Node.js)
  - Redis (queue + cache)
  - PostgreSQL (encrypted data)
  - Nginx reverse proxy (TLS, HTTP/2, HSTS)
- **Workers:**
  - `arb-worker-eu`: For Kraken/Bitstamp/Coinbase ↔ Solana EU RPC
  - `arb-worker-asia` (optional external VPS): For Binance/Bybit with lower latency to Asia POPs
  - Copy trading master/follower workers
- **Network Security:**
  - Redis/PostgreSQL bound to `127.0.0.1` only
  - WireGuard/Tailscale tunnel for remote workers
  - Cloudflare Zero Trust for admin panel access

### 2. Low Latency Optimizations

- Prefer EU-based exchanges for main worker
- Use QuickNode/Helius **EU RPC endpoints** with auto-rotation
- Benchmark and select lowest‑ping endpoint per exchange pair
- Enable **parallel order submission** and **batch signing** in workers

### 3. Technology Stack

- **Backend:** Node.js (TS), Express, ccxt, Jupiter API, BullMQ, AES‑256‑GCM encryption
- **Frontend:** Next.js 14, TailwindCSS, shadcn/ui components, responsive mobile-first design
- **Database:** PostgreSQL 15 (pgcrypto for encryption at column-level)
- **Cache/Queue:** Redis 7
- **Deployment:** Docker Compose, PM2 for worker restarts
- **Monitoring:** Prometheus + Grafana, Loki for logs

---

## 🎨 UI/UX Specification

### Design Principles

- Minimalist, trader-focused UI with **dark/light mode**
- Responsive layout for desktop, tablet, mobile
- shadcn/ui components with Tailwind theme overrides

### Pages & Components

1. **Landing Page**

   - Hero section: tagline, CTA to sign up
   - Feature list (Arbitrage, Copy Trading, No Custody)
   - Pricing tiers (200–500 USD/month)
   - Testimonials & screenshots of live PnL

2. **Dashboard**

   - PnL graph (real-time WebSocket updates)
   - Active trades table with spread % and execution latency
   - API key status indicator
   - Start/Stop bot controls

3. **API Management**

   - Add/Edit CEX API key (withdrawal disabled)
   - Add/Edit Solana wallet private key (AES-256 encrypted)
   - Test connection button

4. **Trade History**

   - Filter by date, market, strategy
   - Export to CSV
   - Profit breakdown by strategy

5. **Copy Trading**

   - Master list with stats (ROI, drawdown, followers)
   - Follow/Unfollow buttons
   - Risk slider for trade sizing

6. **Settings**
   - Subscription management (Stripe integration)
   - Webhook/Email alerts
   - 2FA setup

---

## 🔒 Security Model

- **Encryption:** AES-256-GCM for API keys; environment master key stored outside code repo
- **API Policy:** Only `read` and `trade` permissions, **no withdrawals**
- **Database:** Encrypted columns for sensitive data
- **Network:** UFW firewall, only 80/443 open, SSH on non-standard port, fail2ban
- **Backups:** Daily Postgres + Redis snapshot to encrypted S3 bucket in EU region
- **User Auth:** JWT + refresh tokens, 2FA via TOTP

---

## 📊 Business Model

- Subscription Tiers:
  - Standard: 200 USD/month (basic arbitrage, limited pairs)
  - Pro: 500 USD/month (priority execution, more pairs, custom worker region)
- Optional profit share: %10–20 via Stripe billing
- Marketing: Telegram/Discord crypto communities, influencer partnerships, demo trading videos

---

## 📡 Claude Code MCP Integration (Context7)

- MCP server for `fs`, `fetch`, `semgrep` for security scanning
- Context7 for real-time architectural updates & config validation
- Claude Code agents for:
  - Code generation & refactoring
  - API schema validation
  - Docker Compose deployment automation

---

## ✅ Deployment on Contabo Germany Debian 12

1. Provision VPS with Debian 12
2. Install Docker, Docker Compose, Node.js 20, PM2
3. Configure Nginx reverse proxy with Let’s Encrypt TLS
4. Deploy stack via `docker-compose up -d`
5. Set up Prometheus + Grafana for metrics
6. WireGuard for remote worker connectivity

---

## 📂 Example Docker Compose

```yaml
version: "3.9"
services:
  api:
    build: ./apps/api
    env_file: .env
    ports: ["8080:8080"]
    depends_on: [db, redis]
  web:
    build: ./apps/web
    env_file: .env
    ports: ["3000:3000"]
    depends_on: [api]
  arb-eu:
    build: ./apps/workers/arb
    env_file: .env
    environment:
      - REGION=eu
      - CEX_PREFERENCE=EU_FIRST
  copy-master:
    build: ./apps/workers/copy-master
    env_file: .env
  copy-follower:
    build: ./apps/workers/copy-follower
    env_file: .env
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: cryonel
    ports: ["5432:5432"]
  redis:
    image: redis:7
    ports: ["6379:6379"]
```

---

## 📈 Future Extensions

- Additional chains (Ethereum, BSC) for cross-chain arbitrage
- AI-driven signal generation for copy trading
- Multi-language support for EU/Asia markets

---

## 📈 Future Extensions

- Additional chains (Ethereum, BSC) for cross-chain arbitrage
- AI-driven signal generation for copy trading
- Multi-language support for EU/Asia markets

## 📈 Future Extensions (Detailed)

### 1. Additional Chains (Ethereum, BSC) for Cross-Chain Arbitrage

**Technical Scope:**

- Integrate EVM-compatible chains using `ethers.js` (JavaScript) and/or `web3.py` (Python microservices for latency-critical operations).
- Enable CEX ↔ DEX arbitrage on Uniswap/Sushiswap (Ethereum) and PancakeSwap (BSC).
- Implement cross-chain swaps via Wormhole or LI.FI API.
- Add smart contract scanners for rug/honeypot detection on each chain.
- Set up multi-chain RPC load balancing with regional endpoints (Infura, Alchemy, Ankr).

**Infrastructure Changes:**

- Create a separate `arb-worker-evm` Docker service.
- Configure a dedicated Redis channel for EVM event streaming.
- Implement RPC key rotation and backup endpoints for redundancy.

**Business Value:**

- Expands market coverage with more daily arbitrage opportunities.
- Attracts new users holding ETH/BSC assets.
- Provides competitive differentiation in marketing campaigns.

---

### 2. AI-Driven Signal Generation for Copy Trading

**Technical Scope:**

- Train LSTM or transformer-based AI models using:
  - Historical OHLCV and order book depth data.
  - On-chain DEX liquidity and trade pattern data.
  - CEX funding rates and sentiment analysis from Twitter/Reddit.
- Deploy a real-time inference microservice using Python (FastAPI).
- Broadcast AI-generated trading signals via Redis pub/sub to copy-trading worker nodes.

**Infrastructure Changes:**

- Use a GPU-optimized VPS (e.g., Hetzner GPU instance or Lambda Labs cloud GPU).
- Build a model retraining pipeline (weekly/monthly retraining schedule).

**Business Value:**

- Automates detection of profitable entry/exit points.
- Increases marketing appeal with “AI-powered trading” branding.
- Allows for premium subscription tiers with AI-exclusive features.

---

### 3. Multi-Language Support for EU/Asia Markets

**Technical Scope:**

- Implement i18n framework using `next-i18next` for UI translations.
- Prepare language packs for EN, DE, ES, FR, TR, ZH.
- Add currency localization for financial reports (EUR, USD, JPY).
- Adapt date/time formatting based on user locale.

**Infrastructure Changes:**

- Use CDN edge caching (Cloudflare Workers) for static language resources.
- Manage translations through Crowdin or Lokalise.

**Business Value:**

- Increases total addressable market in non-English-speaking regions.
- Improves onboarding and retention for retail investors.
- Facilitates partnerships with regional influencers and affiliates.

## Professional, Responsive UI Policy (No Icons, Library-First)

### 1) Policy

- No icons or emojis in UI (no icon packs, no emoji placeholders).
- Prefer robust UI libraries over custom CSS:
  - Layout/Styling: Tailwind CSS
  - Primitives/Accessibility: shadcn/ui (Radix under the hood)
  - Tables/Lists: TanStack Table + virtualization
  - Charts: lightweight client lib or custom canvas; lazy load only
  - Animations: Anime.js (transform/opacity only; respects reduced motion)
- Professional look: information-dense, consistent spacing, strong contrast, minimal chrome.
- Fully responsive: mobile-first; adaptive navigation; ergonomic touch targets.

### 2) Responsive Layout Patterns

- Breakpoints:
  - sm <640, md ≥768, lg ≥1024, xl ≥1280
- Navigation:
  - Desktop: persistent sidebar (text labels only)
  - Mobile/Tablet: hidden sidebar; “Menu” button opens shadcn/ui Sheet (drawer)
- Content:
  - Cards and grids auto-flow per breakpoint
  - Sticky filter/toolbars on md+

### 3) Topbar (No Icons) + Mobile Drawer

```tsx
// apps/web/src/components/layout/Topbar.tsx
"use client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { useState } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/signals", label: "Signals" },
  { href: "/api-keys", label: "API Keys" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export function Topbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-surf-0/80 backdrop-blur border-b border-border-hair">
      <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center gap-3 px-4">
        <div className="font-semibold tracking-wide">CRYONEL</div>
        <div className="ml-auto hidden items-center gap-4 md:flex">
          <input
            className="bg-surf-1 rounded px-3 py-1 text-sm placeholder:text-text-low w-64"
            placeholder="Search…"
            aria-label="Search"
          />
          <Link
            href="/settings"
            className="text-sm underline-offset-4 hover:underline"
          >
            Account
          </Link>
        </div>
        <div className="md:hidden ml-auto">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="rounded bg-surf-1 px-3 py-1 text-sm">
              Menu
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <nav className="flex flex-col gap-3 mt-6">
                {nav.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="px-2 py-2 rounded hover:bg-surf-1"
                  >
                    {n.label}
                  </Link>
                ))}
                <input
                  className="mt-4 bg-surf-1 rounded px-3 py-2 text-sm placeholder:text-text-low"
                  placeholder="Search…"
                  aria-label="Search"
                />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
```

### 4) Sidebar (Text Labels Only)

```tsx
// apps/web/src/components/layout/Sidebar.tsx
"use client";
import Link from "next/link";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/signals", label: "Signals" },
  { href: "/api-keys", label: "API Keys" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  return (
    <aside className="hidden md:block w-60 shrink-0 bg-surf-0 border-r border-border-hair">
      <nav className="py-3">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="flex items-center gap-3 px-3 py-2 hover:bg-surf-1"
          >
            <span className="font-medium">{it.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

### 5) App Shell (Responsive)

```tsx
// apps/web/src/components/layout/AppShell.tsx
"use client";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-0 text-text-hi">
      <Topbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6">
          <div className="grid gap-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
```

### 6) Professional Data Views (Library-First)

- Tables: TanStack Table with virtualization; responsive columns; row density toggle (compact/comfortable).
- Forms: shadcn/ui Input, Select, Checkbox, Switch with consistent spacing and labels.
- Dialogs/Sheets: shadcn/ui for create/edit flows; full-screen on mobile; centered modal on desktop.
- Feedback: shadcn/ui Toast for non-blocking notifications; AlertDialog for dangerous actions.

Example: responsive KPI row + cards

```tsx
// apps/web/src/app/dashboard/page.tsx
import { AppShell } from "@/components/layout/AppShell";

function KPICard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-border-hair bg-surf-0 p-4 shadow-sm">
      <div className="text-text-low text-sm">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint && <div className="text-text-low text-xs mt-1">{hint}</div>}
    </div>
  );
}

export default async function DashboardPage() {
  return (
    <AppShell>
      <section aria-label="Key performance indicators">
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 xl:grid-cols-6">
          <KPICard label="PnL (30d)" value="$12,430" hint="vs prev 30d" />
          <KPICard label="Win Rate" value="63.1%" />
          <KPICard label="Spread Capture" value="0.42%" />
          <KPICard label="Latency p95" value="280ms" />
          <KPICard label="Trades (24h)" value="1,284" />
          <KPICard label="Errors (24h)" value="3" />
        </div>
      </section>
      <section
        aria-label="Charts"
        className="grid gap-4 grid-cols-1 xl:grid-cols-2"
      >
        <div className="rounded-md border border-border-hair bg-surf-0 p-4 shadow-sm">
          <h3 className="font-medium mb-2">Equity Curve</h3>
          <div className="h-64 bg-surf-1 rounded" />
        </div>
        <div className="rounded-md border border-border-hair bg-surf-0 p-4 shadow-sm">
          <h3 className="font-medium mb-2">Latency Distribution</h3>
          <div className="h-64 bg-surf-1 rounded" />
        </div>
      </section>
    </AppShell>
  );
}
```

### 7) Accessibility & Input Targets

- Minimum touch targets 44×44px on mobile.
- Visible focus rings; Tab sequence matches reading order.
- Labels tied to inputs; aria-\* for menus, dialogs, toasts.
- Color contrast ≥4.5:1; no essential info conveyed by color alone.

### 8) Performance & Motion

- Only transform/opacity animations (Anime.js) and only client-side.
- Guard with prefers-reduced-motion; skip in low-power scenarios.
- Lazy-load heavy widgets; avoid SSR for charts; virtualize long lists.

### 9) Testing & QA (UI)

- Viewport tests: 360×640, 768×1024, 1440×900, 1920×1080.
- Keyboard-only walkthroughs for critical flows.
- Lighthouse a11y score ≥95 on app pages.
