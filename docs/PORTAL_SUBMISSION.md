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
  Click the "Live StudioNet RPC (gen_call)" toggle in the top header to execute real-time read calls (get_stats, get_pledge, get_claim) directly against StudioNet Chain 61999 (0x9D8830F4A62d37D9Ca346e3f2D54b512B228fc4d).
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
  The UI and "npm run verify:proof" confirm 6/6 finalized StudioNet scenarios (MAJORITY_AGREE, GenVM: SUCCESS): (1) ACCEPTED pledge, (2) REJECTED_VAGUE + real native transfer, (3) BREAKING_CONFIRMED + real native bounty payout, (4) NON_BREAKING additive release, (5) NON_BREAKING prompt-injection defense + mismatched repo rejection, and (6) INSUFFICIENT_EVIDENCE + trusted-time expiry fallback refund.
  ```

- **CONTRACT LINK 1 (OPTIONAL):**
  ```text
  https://explorer-studio.genlayer.com/address/0x9D8830F4A62d37D9Ca346e3f2D54b512B228fc4d
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
  - **Proof Manifest (`deploy/proof.json`):** `https://github.com/khezzed/DeprecateGuard/blob/main/deploy/proof.json`
  - **Scenario 1 (`ACCEPTED`):** `https://explorer-studio.genlayer.com/tx/0x2622cb4ca4fc9aa7d68324fb242d192eb81451f940634d6a49a649bd7fe02219`
  - **Scenario 2 (`REJECTED_VAGUE`):** `https://explorer-studio.genlayer.com/tx/0xe2cf3a052271ea08b9e0f6f6e16553df763bfb516411569722db9d6f51e2af80` (Native Withdrawal: `0xaf79de750f3f0fdd74e05df2577bd7e62843b9fcfc6bd0e6778460a02c478b5e`)
  - **Scenario 3 (`BREAKING_CONFIRMED`):** `https://explorer-studio.genlayer.com/tx/0xbcb2d48e79d1c8a950b123abd6bec824418b754c77978c1a68f89fbe88788c92` (Native Bounty Payout: `0xaeb4b7f365256480cc75da6d1ac6e8c459cdb8622c2c7a01f7b5f051ffd25626`)
  - **Scenario 4 (`NON_BREAKING`):** `https://explorer-studio.genlayer.com/tx/0x5de0423ad3738de5e9fa754de6e2e21dca61442a2cce2ee6a11023851993a622`
  - **Scenario 5 (`NON_BREAKING` Injection Defense):** `https://explorer-studio.genlayer.com/tx/0xe0fc22e79332d45ecfcf42329f7efb8a6c7411470cd115fb6384843176f95709` (Repo Mismatch Rejection: `0x9a3609197f88073cf924f23ad9d5d71c1363ea7e6e4bac0e451d2f0393fef5de`)
  - **Scenario 6 (`INSUFFICIENT_EVIDENCE`):** `https://explorer-studio.genlayer.com/tx/0xeb4471c9980a2fb66768862bd2ab178f10e8a3444a2cc358c5e1be32dd407784` (Trusted-Time Expiry: `0xa9af99732fa388fcb8ff1de2a33caeeb954bf3c0a7bad6053427c6e4b585e438`, Native Refund: `0x5831efbb052df6ac12f1936aeb36be115fce9b76f9d8bfbe7872dca027d7e977`)
