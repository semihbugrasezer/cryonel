# CRYONEL Velocity — One‑Shot Strong Launch (Vite React SPA, Non‑Custodial, $0 AI)

> **Goal:** Deliver a more **reliable, faster, and auditable** experience than competitors by focusing on verifiability and deterministic execution.
> **Stack:** React + Vite + TypeScript • Tailwind + shadcn/ui • React Router • Zustand • TanStack Query • TanStack Table (virtualized) • Recharts • Node/Express • Redis (BullMQ) • PostgreSQL • prom-client • pino • native WebSocket • Ollama / WebGPU (local $0 AI)
> **Security:** Non‑custodial • **no withdrawal permission** • API keys **AES‑GCM (browser)** encrypted • TOTP 2FA • audit log
> **Version:** 2025-08-18

---

## 1) Product Backbone (Must‑Have)

- **Non‑custodial copy & arbitrage:** Only exchange API trading permissions; no withdrawal scope.
- **Deterministic engine:** Pure state machine; idempotent tasks; retryable jobs.
- **Latency‑aware router:** Exchange/account affinity, fee‑aware pathing, back‑pressure, circuit breaker.
- **Verifiable PnL:** Public, shareable, audit‑friendly links (SEO friendly); outlier‑filtered stats.
- **Zero‑cost AI assistant:** Local analyzers (Ollama/WebGPU) for summaries and anomaly hints.
- **Privacy by design:** Data minimization; encrypted secrets; strict role‑based access.

---

## 2) Value & KPIs (Launch)

- **Time‑to‑first‑trade:** < 5 minutes with CEX API keys.
- **Slippage & fees:** Router shows *before/after* fees; slippage guardrails.
- **Uptime SLO:** 99.9% engine jobs; auto‑healing workers.
- **Shareable performance:** Verified PnL pages that help organic growth.

---

## 3) Growth Engine (Pull in One Release)

- **Freemium + Paper:** Free paper trading and single strategy follow.
- **Verified performance badge:** Shareable public link (SEO‑ready).
- **Creator economy:** Strategy creators earn **20%** marketplace fee; ratings/reviews; outlier‑filtered metrics.
- **Referral:** **Single‑level** invite; capped reward **per referred user**, funnel is visible (view → paper → follow → subscription).
- **Community:** Telegram/Discord embeds; monthly **transparent PnL leagues** (anti‑gaming rules).

---

## 4) Architecture (Ready to Code)

### 4.1 Web (Vite + React + TS)
- Tailwind + shadcn/ui; clean design; dark mode.
- State: Zustand; Data: TanStack Query; Tables: TanStack Table (virtualized).
- Charts: Recharts; Router: React Router; WebSocket client for live ticks.
- AES‑GCM in browser for API secret encryption; TOTP 2FA; audit trail.

### 4.2 Backend (Node/Express)
- **Services:** Auth, Strategy, Router, Jobs, PnL, Referral, Billing.
- **Workers:** BullMQ with Redis; idempotent jobs; exponential backoff.
- **DB:** PostgreSQL (normalized core, JSONB for flexible payloads); migrations.
- **Observability:** prom‑client metrics; pino logs; alerting.

### 4.3 Engine
- **Deterministic launcher:** Single source of truth; replayable events.
- **Router:** Fee/latency aware; exchange/account stickiness; kill‑switch.
- **PnL verifier:** Snapshots + trade ledger → immutable PnL proofs.

### 4.4 Security
- Token‑scoped exchange permissions; key encryption client‑side; secret rotation.
- Rate limiting; IP allowlists (optional); signed webhooks.

---

## 5) Data Model (Sketch)

- **users(id, email, consent_marketing, kyc_status, …)**
- **exchanges(id, name, maker_fee, taker_fee, …)**
- **api_keys(user_id, exchange_id, key_enc, created_at, last_used_at, …)**
- **strategies(id, owner_id, visibility, fee_pct, …)**
- **follows(user_id, strategy_id, mode[paper/live], …)**
- **orders(id, user_id, exchange_id, side, qty, price, fees, …)**
- **trades(order_id, fill_qty, fill_price, fee_paid, …)**
- **pnl_snapshots(user_id/strategy_id, ts, realized, unrealized, …)**
- **referrals(inviter_id, invitee_id, status, first_trade_at, reward_usd, …)**
- **billing(invoice_id, user_id, amount_usd, tax, …)**

---

## 6) API (Sample)

- `POST /auth/login` (TOTP capable)  
- `POST /exchanges/:id/keys` (client‑encrypted)  
- `POST /strategies` / `GET /strategies/:id`  
- `POST /follow` / `DELETE /follow` (paper/live)  
- `POST /orders` (router = fees + latency aware)  
- `GET /pnl/:id/public` (shareable)  
- `POST /referral/use` (single‑level)  

---

## 7) Jobs & Scheduling

- **Queues:** `ingest`, `route`, `settle`, `pnl`, `email`.
- **Guarantees:** At‑least‑once; dedupe keys; idempotency.
- **Back‑pressure:** Dynamic concurrency; circuit breaker on exchange errors.

---

## 8) Frontend UX Notes

- Minimalist, high‑contrast, responsive.  
- **Dashboards:** Live balances, open orders, router preview (with fees).  
- **Public PnL page:** SEO meta, canonical URL, share button.  
- **Creator studio:** Strategy publish flow, pricing, revenue split preview.  
- **Referral widget:** Invite link, *per‑referee* capped reward, status.

---

## 9) Testing

- **Unit:** Core math, router fee math, PnL proofs.
- **Integration:** Paper→Live migration; API key encryption; 2FA.
- **Load:** k6 scripts for 1k concurrent; worker saturation drills.
- **Security:** SQLi, JWT tampering, replay, secret‑at‑rest checks.

---

## 10) Deployment

- **Containers:** Docker Compose dev; K8s optional later.
- **Secrets:** .env for dev only; production via secret manager.
- **Migrations:** Safe forward‑only; rollbacks via blue/green.

---

## 11) Analytics

- Event stream for funnels: view → paper → follow → live → first trade.
- Cohorts by strategy, exchange, region.
- Creator revenue dashboard; referral conversion.

---

## 12) Risks & Mitigations (Short)

- **Strategy quality drops:** “Signal Quality” label, minimum depth/liquidity checks.
- **Abusive strategies:** Creator verification, outlier filters, audit trails.
- **Regulatory/compliance:** Non‑custodial; **no performance fee**; data minimization; **global privacy & anti‑pyramid compliance** baked in.

---

## 13) Summary

Rather than “**more features**”, focus on **verifiability + deterministic execution + latency/fee‑aware routing + $0 AI**.  
Freemium and shareable **verified PnL** pages accelerate organic growth.  
The router and plan format are **ready to extend** into deeper DEX/bridging modules later.

---

## 14) Global Revenue Model & Compliance

CRYONEL is designed to be transparent and lawful in major markets.

### 14.1 Revenue Sources
- **Free Core:** Strategy following, paper trading, and basic reporting remain free.
- **Per‑Trade Flat Fee:** A flat service fee on real trades. Tiered by monthly volume, always pre‑disclosed.
- **Single‑Level Referral:** Reward only for **direct** referees, derived **solely from trading fees** generated by the invitee; no multi‑level payouts; clear caps.
- **Premium Modules:** Advanced risk controls, custom algorithm runtime, priority routing.
- **Marketplace Cut:** **20%** revenue share from creators.

### 14.2 Marketing & Data
- **Opt‑in Email Marketing:** Prior, specific, freely‑given, informed consent; easy unsubscribe; records retained.
- **Data Minimization & Purpose Limitation:** Use data strictly for declared purposes; no selling or third‑party list brokering; delete/erase on request where required.
- **Security:** Client‑side encryption for secrets; transport encryption; least‑privilege.

### 14.3 International Notes
- **Privacy:** GDPR/UK‑GDPR, CAN‑SPAM/CCPA and analogous regimes; heavy fines for violations.
- **Anti‑Pyramid:** Rewards must come from **real product/service usage** (i.e., trading fees), not from recruiting; keep referral to **one level** and capped (aligns with FTC guidance).
- **Crypto Licensing:** If/when offering token or broader crypto services, obtain proper licenses (e.g., EU MiCA regime; FinCEN/SEC in the U.S., etc.).
- **Legal Counsel:** Engage local counsel before launching in each target country. This document is informational, not legal advice.

---

## 15) Roadmap (90‑Day)

- **Phase 1:** Core engine, router, paper trading, public PnL pages, creator studio (MVP).
- **Phase 2:** Live trading with fee tiers, single‑level referral, premium algorithm runtime.
- **Phase 3:** Regional compliance hardening, analytics, and performance tuning.

