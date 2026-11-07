# TetherStream Upgradeable Smart Contract Architecture

A production-quality, secure, UUPS upgradeable package and 25-trade cycle smart contract built on **Solidity 0.8.28** and **Hardhat 3** with OpenZeppelin Contracts v5.6.1.

---

## Technical Overview

### 1. Packages
Centralized package configuration dynamically scaled to the payment token's decimals (USDT 6 or 18 decimals):

| Package | Price (USD) | Max Trades per Cycle | Instant Trade Income | Rebuy Allocation |
| :--- | :---: | :---: | :---: | :---: |
| **REGULAR** | $25 | 25 | 0.6% (60 BPS) | 4.0% (400 BPS) |
| **STANDARD** | $50 | 25 | 0.6% (60 BPS) | 4.0% (400 BPS) |
| **PREMIUM** | $100 | 25 | 0.6% (60 BPS) | 4.0% (400 BPS) |

---

### 2. Instant Income & Level Income Rules
- **5-Level Upline Income (0.5% x 5 Levels = 2.5%)**: Paid **ONETIME ON PACKAGE PURCHASE** (during registration and cycle rebuy). `0.5%` per level is transferred **INSTANTLY** via `SafeERC20` directly into each active upline sponsor's USDT wallet!
- **Instant Trade Income (0.6%)**: Transferred **INSTANTLY** via `SafeERC20` directly into the user's USDT wallet whenever `claimTrade()` is called!
- **Rebuy Wallet Allocation (4.0%)**: Accumulated in `rebuyBalance` (non-withdrawable as cash, used for 25-trade same-package auto-rebuy).
- **Global Pool Contribution (0.4%)**: Credited to contract `globalPoolBalance`.

---

### 3. Dynamic Cooldown Booster
Cooldown between trade claims is dynamically calculated based on direct referrals:
- **0–9 Direct Referrals**: 8 Hours (`28,800` seconds)
- **10–19 Direct Referrals**: 6 Hours (`21,600` seconds)
- **20+ Direct Referrals**: 4 Hours (`14,400` seconds)

---

### 4. Automatic / Keeper Rebuy Execution
- 25 trades $\times$ 4% = 100% of package price accumulated in `rebuyBalance`.
- After 25 trades, user reaches cycle completion.
- `executeRebuy(address user)` is **permissionless and keeper-compatible**. Anyone (Chainlink Automation, Gelato, user, or bot) can execute it.
- Consumes `rebuyBalance` to reset `tradeCount` to 0, increment `currentCycle` for the **SAME package**, and pays 5-Level Income ONCE on the new cycle package purchase!
- Rebuy funds CANNOT be withdrawn as cash or transferred away.

---

### 5. Global Pool & Claim System
- **Eligibility**:
  1. Active package is **PREMIUM** ($100).
  2. Direct referral count $\ge 25$.
  3. At least 25 of those direct referrals purchased **PREMIUM** ($100).
- **Admin Distribution (`distributeGlobalPool()`)**: Calculates equal share for eligible members using a master reward index (`accumulatedPoolPerMember`). Remainder (dust) stays in `globalPoolBalance`.
- **User Claim (`claimGlobalPool()`)**: Eligible members call `claimGlobalPool()` to claim their pool share and receive USDT **INSTANTLY** in their wallet!

---

### 6. Security Features
- **OpenZeppelin 5.6.1 Standard Contracts**: `Initializable`, `UUPSUpgradeable`, `AccessControlUpgradeable`, `PausableUpgradeable`, `ReentrancyGuard`, `SafeERC20`.
- **Checks-Effects-Interactions (CEI)**: All state changes precede external token transfers.
- **Solvency Guard**: Contract verifies available token balance exceeds `totalRebuyLiabilities + globalPoolBalance`.
- **Referral Loop Protection**: Recursively verifies up to 20 upline levels during registration to reject circular referral graphs.

---

## Directory Structure

```text
contracts/
  ├── TetherStream.sol            # Main UUPS upgradeable smart contract
  ├── TetherStreamGateway.sol     # Read-only query aggregator & write router
  ├── interfaces/
  │   └── ITetherStream.sol       # Core interface, structs, custom errors & events
  ├── proxy/
  │   └── TetherStreamProxy.sol   # ERC1967 Proxy wrapper
  └── test/
      └── TetherStream.t.sol      # Hardhat 3 Solidity unit test suite (forge-std)

test/
  ├── TetherStream.test.ts        # Hardhat 3 TypeScript integration test suite
  └── TetherStreamGateway.test.ts # Gateway router & aggregator test suite

scripts/
  └── deploy-tetherstream.ts      # UUPS & Gateway deployment script
```

---

## Development & Testing

### 1. Build & Typecheck
```bash
npx hardhat build && npx tsc --noEmit
```

### 2. Run All Tests
```bash
npx hardhat test
```

---

## Deployment Guide

Deploy to BSC Testnet:
```bash
npx hardhat run scripts/deploy-tetherstream.ts --network bscTestnet
```
