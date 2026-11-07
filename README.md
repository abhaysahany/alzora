# ELZORA Smart Contract Architecture

A production-grade, secure, UUPS upgradeable Binary Matrix and 8-Stream MLM Smart Contract System built on **Solidity 0.8.28**, **OpenZeppelin v5.6.1**, and **Hardhat 3**.

---

## Technical Overview

### 1. Packages & One-Time Activation
- **$50 USDT (One-Time Activation)**: Users register into the binary placement tree with an active Left or Right position.
- **Instant Wallet Transfers**: All commissions and distributed pools are sent directly and instantly to the user's connected Web3 wallet upon generation or admin batch distribution (no internal withdrawal lock).

---

### 2. The 8 Income Streams

1. **Direct Income (20% = $10)**: Transferred instantly to the sponsor's wallet upon new registration.
2. **20-Level Affiliate Income (14% = $7)**:
   - Levels 1–10: **$0.40** per level.
   - Levels 11–20: **$0.30** per level.
   - Transferred instantly to eligible uplines; missed uplines divert to treasury.
3. **Club Rank Matrix (24% = $12)**:
   - 8 cascading ranks (Starter → Legend) progressing through personal downline team members.
   - Starter: 2 team members -> $10 Net Profit + $14 auto-upgrade to Leader.
   - Leader: 4 team members -> $26 Net Profit + $30 auto-upgrade to Achiever, etc.
4. **Binary Matching Income (20% = $10)**:
   - **1:1 Pair Matching** at **$2 per pair**.
   - Prerequisite: 1 Left direct sponsor and 1 Right direct sponsor.
   - Daily matching cap: 50 pairs/day ($100/day).
   - If unqualified, matching income is safely diverted to the Treasury wallet.
5. **Champion Club (6% = $3)**:
   - Accumulates $3 per registration into a monthly pool.
   - Qualification: 30 direct referrals (set to 3 for testing).
   - Concluded each month: admin creates snapshot and distributes in safe batches of 50–100 directly to member wallets.
   - If 0 members qualify, pool diverts to Treasury.
6. **Weekly Rewards (6% = $3)**:
   - Accumulates $3 per registration Sunday 00:00:00 UTC to Saturday 23:59:59 UTC.
   - Qualification: 3 direct referrals within the single week.
   - Concluded Sunday morning: admin batch distributes equally to all qualifiers directly to wallets.
   - If 0 members qualify, pool diverts to Treasury.
7. **Lifetime Milestones (10% = $5)**:
   - 27 progressive milestones from 5L/5R ($25) up to 7,000,000L/7,000,000R ($21,000,000).
   - Direct referral requirement:
     - Levels 1–5: 1 direct
     - Levels 6–10: 2 directs
     - Levels 11–15: 3 directs
     - Levels 16–20: 4 directs
     - Levels 21–24: 5 directs
     - Levels 25–27: 6 directs
   - Unmet direct conditions wait safely and never lapse or divert to treasury.
8. **Single Leg Income / Global Club ($25)**:
   - Infinite 1-in-2 re-entry algorithm queue.
   - Dual activation:
     - Manual entry via dashboard for $25 USDT.
     - Auto-activated by Lifetime Milestone 1 ($25) if not already joined.
   - When 2 entries enter after a position: $25 instant profit to wallet + 1 automatic re-entry at the tail of the queue.

---

## Directory Structure

```text
contracts/
  ├── ElzoraMain.sol            # Core UUPS upgradeable contract
  ├── ElzoraGateway.sol         # Read-only query aggregator & write router
  ├── interfaces/
  │   └── IElzora.sol           # Interface, structs, custom errors & events
  ├── proxy/
  │   └── ElzoraProxy.sol       # ERC1967 Proxy wrapper
  └── test/
      └── TestToken.sol         # 6-decimal mock USDT token

test/
  └── Elzora.test.ts            # Hardhat 3 TypeScript integration test suite

scripts/
  ├── deploy-elzora-main.ts     # UUPS Proxy deployment script
  └── deploy-elzora-gateway.ts  # Gateway deployment script
```

---

## Testing & Build

```bash
# Compile contracts and run TypeScript checks
npm run build

# Run comprehensive test suite
npm test
```
