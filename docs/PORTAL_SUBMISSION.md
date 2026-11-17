# GenLayer Portal Submission Guide (`portal.genlayer.foundation/submit-contribution`)

Copy and paste these exact fields into each section of the **Project Explorer Application** form shown on the GenLayer Portal. Every field is strictly sized to fit the Portal's exact character limits (`100`, `1,000`, and `500` characters).

---

## 01 Identity — "Make it recognizable"

- **Logo (`PNG, JPEG, or WebP - 128-2048 px - max 2 MB`):**
  Upload [`logo.png`](file:///C:/Users/user/AntigravityProfiles/account1/.gemini/antigravity/scratch/deprecate-guard/logo.png) (`512x512 px`, PNG, `< 20 KB`) located in the root of your project folder.
- **PROJECT NAME:**
  ```text
  DeprecateGuard
  ```
- **PRIMARY TAG:** Select `Developer Tools` (or `Infrastructure` / `DeFi` / `AI & Agents` depending on dropdown options)
- **TAG 1 (OPTIONAL):** `Intelligent Contracts` (or `Governance`)
- **TAG 2 (OPTIONAL):** `Security` (or `Oracles`)

---

## 02 Project Summary — "One-liner" (`94 / 100` characters)

- **DESCRIBE THE PROJECT IN ONE LINE (`Max 100 chars`):**
  ```text
  Intelligent Contract bonds that penalize unannounced API breaking changes via LLM consensus.
  ```
  *(92 characters — fits cleanly inside the `0/100` limit)*

---

## 03 Project Overview — "Description" (`868 / 1000` characters)

- **WHAT IS THIS PROJECT? (`Max 1000 chars`):**
  ```text
  DeprecateGuard is a GenLayer-native Intelligent Contract application where API and open-source maintainers lock a stability bond guaranteeing backward compatibility. When a release ships, GenLayer validators evaluate claims against immutable 40-hex commit SHA artifacts to judge whether a breaking change occurred. Built strictly to GenLayer design rules: plain code moves funds while models return only fixed enum verdicts; custom validator equivalence (`gl.vm.run_nondet_unsafe`) verifies the SHA-256 slice digest, checks that the leader's verbatim quote exists in each validator's fetched bytes, and compares verdicts; large files are pre-parsed into bounded slices; vague clauses are rejected up front by a RuleGate check; untrusted code is sandboxed against prompt injection; and `resolve_expired_pledge()` prevents locked funds.
  ```
  *(868 characters — fits cleanly inside the `0/1000` limit)*

---

## 04 Demo Video — "Show it in action"

- **DEMO URL (YOUTUBE OR X) - OPTIONAL:**
  Leave blank if submitting without a video, or paste your YouTube/X video link recorded using [`docs/DEMO_SCRIPT.md`](file:///C:/Users/user/AntigravityProfiles/account1/.gemini/antigravity/scratch/deprecate-guard/docs/DEMO_SCRIPT.md).

---

## 05 How-To — "Write the exact path"

Click **`+ Add another step`** to create 4 steps and paste the following:

### Step `#1`
- **OPTIONAL HEADING:**
  ```text
  Inspect Zero-Wallet Reviewer Proof
  ```
- **INSTRUCTION:**
  ```text
  Open the live frontend URL. Zero-Wallet Reviewer Mode loads by default so you can inspect all 6 finalized StudioNet scenarios, verbatim validator quotes, SHA-256 slice digests, and Explorer links without connecting a wallet.
  ```

### Step `#2`
- **OPTIONAL HEADING:**
  ```text
  Query Live StudioNet State
  ```
- **INSTRUCTION:**
  ```text
  Click the "Live StudioNet RPC (gen_call)" toggle in the top header to execute real-time read calls (get_stats, get_pledge, get_claim) directly against StudioNet Chain 61999 (0xd975E69a3B2C4919Da5C8e72bE5EE42c233c1e81).
  ```

### Step `#3`
- **OPTIONAL HEADING:**
  ```text
  Run Automated CLI Proof Verification
  ```
- **INSTRUCTION:**
  ```text
  Clone https://github.com/khezzed/DeprecateGuard, run "npm install", and execute "npm run verify:proof" to independently verify all 6 finalized transactions, real native token transfers, and GenVM receipts against https://studio.genlayer.com/api.
  ```

### Step `#4`
- **OPTIONAL HEADING:**
  ```text
  Test Interactive Wallet Flows
  ```
- **INSTRUCTION:**
  ```text
  Use the Interactive StudioNet Actions panel to create a new pledge bond (testing RuleGate acceptance or vague-rule rejection), submit a breaking-change claim against a 40-hex commit SHA, or withdraw refundable balances via real native token transfers.
  ```

---

## 06 Review Verification — "Prove the path works" (`358 / 500` characters)

- **EXPECTED VERIFICATION OUTCOME (`Max 500 chars`):**
  ```text
  The UI and "npm run verify:proof" confirm 6/6 finalized StudioNet scenarios (MAJORITY_AGREE, GenVM: SUCCESS): (1) ACCEPTED pledge, (2) REJECTED_VAGUE + real native transfer, (3) BREAKING_CONFIRMED + direct native bounty payout, (4) NON_BREAKING additive release, (5) NON_BREAKING prompt-injection defense + mismatched repo rejection, and (6) INSUFFICIENT_EVIDENCE + trusted-time expiry fallback refund.
  ```

- **CONTRACT LINK 1 (OPTIONAL):**
  ```text
  https://explorer-studio.genlayer.com/address/0xd975E69a3B2C4919Da5C8e72bE5EE42c233c1e81
  ```
- Click **`+ Add another deployment`** -> **CONTRACT LINK 2:**
  ```text
  https://explorer-studio.genlayer.com/address/0xE735D4d659Ec0ED69e491C3262d517c81E6Aa88F
  ```

---

## 07 Project Links — "Send people to it"

- **WEBSITE - REQUIRED:**
  ```text
  https://khezzed.github.io/DeprecateGuard/
  ```
- **GITHUB:**
  ```text
  https://github.com/khezzed/DeprecateGuard
  ```

---

## Evidence & Supporting Information

- **GitHub Repository (`REQUIRED`):**
  ```text
  https://github.com/khezzed/DeprecateGuard
  ```
- Click **`+ Add Evidence`** to attach direct proof artifacts:
  - **Contract Deployment:** `https://explorer-studio.genlayer.com/tx/0x13a7420bf0da2a7d0c631a825103670d7d142a49092b797bc7a4b56bac94e923`
  - **Proof Manifest (`deploy/proof.json`):** `https://github.com/khezzed/DeprecateGuard/blob/main/deploy/proof.json`
  - **Steward Remediation (Invalid Input Deposit Protection):** Invalid Repo: `0x72af1350e28e4e8a38efe47bfba87efad39400b640ba62a6ae9ac19b048f67f5`, Invalid Path: `0xad0c4537f1ed5278d1dfe9ce2992ebf74dec7ed0985f16af46a11e409c514598`, Invalid Tag: `0x84ffe0b3bc633c3cf6dac85c75d6c0b2da56fd9848c7bcab252bce244a5b535a`, Cumulative Native Refund: `https://explorer-studio.genlayer.com/tx/0x1be89d90b695331c1e28ebaa19befa736bbd7ad7748fa7fb79215f8f04831ea8`
  - **Scenario 1 (`ACCEPTED`):** `https://explorer-studio.genlayer.com/tx/0xfe2b837190ca96eafd82ff2c05344cdcccd005806c5b9a8ea53d0ea394fb49f3`
  - **Scenario 2 (`REJECTED_VAGUE`):** `https://explorer-studio.genlayer.com/tx/0xf0ae0a0c6c9cc178692e0bd391c89b54dc81b1393f7b4a312ca30a56cb17c22d` (Native Withdrawal: `0xe821b1211daa9bf17e7723c24a3bf47adac2c57e81a7d3a147b03bbd99e0d0a1`)
  - **Scenario 3 (`BREAKING_CONFIRMED`):** `https://explorer-studio.genlayer.com/tx/0x8d0d859938420f9b3fea93ba071371e3634c8d909a795242ed398fb4e8eb4dc3` (Direct Native Bounty Payout: 1 wei via `emit_transfer`)
  - **Scenario 4 (`NON_BREAKING`):** `https://explorer-studio.genlayer.com/tx/0xe5463dac8400eeef01991c7842fe48f0b2d193ca3ff509f8956a19030db5b33d`
  - **Scenario 5 (`NON_BREAKING` Injection Defense):** `https://explorer-studio.genlayer.com/tx/0xc2c0f9cd4ab755d54fc05554b996f7c67f9a99b7e6a8d1b089b620d5dae19880` (Repo Mismatch Rejection: `0x158bfd195bb574fb2013a13ceb6ee132e396af34c1ca5b58f1f6fd9189fc10d0`)
  - **Scenario 6 (`INSUFFICIENT_EVIDENCE`):** `https://explorer-studio.genlayer.com/tx/0x4eb9db85fc5e94beed31f10c918d9b36f346538d90a91a51f5b04569b2dd87f9` (Trusted-Time Expiry: `0xbd74fe55180dfbaf0315b38e49c9f40b578c9879d748d589c13a4a8b5e48c1b5`, Native Refund: `0xdf66fa1a4136b4a3feabf23343eed1527249e960d3b919d7a1b8b076800e306f`)
