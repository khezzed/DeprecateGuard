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
  Click the "Live StudioNet RPC (gen_call)" toggle in the top header to execute real-time read calls (get_stats, get_pledge, get_claim) directly against StudioNet Chain 61999 (0xEEDa967BeC7EB022350425C1D0c7c50107c06F1c).
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
  https://explorer-studio.genlayer.com/address/0xEEDa967BeC7EB022350425C1D0c7c50107c06F1c
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
  - **Scenario 1 (`ACCEPTED`):** `https://explorer-studio.genlayer.com/tx/0x2481585086712952a749ea5b6947cddb8a6e9a9bb1566c1e65434b63cf2d5537`
  - **Scenario 2 (`REJECTED_VAGUE`):** `https://explorer-studio.genlayer.com/tx/0xccf1320dacac1cd425bd983462051e64f954348bb23afe6021b4f7f606ca9147` (Native Withdrawal: `0x4dcb7084e44aa52a4f8738bdfe81ed4521b8052aad54fc0d86745820ae9329fe`)
  - **Scenario 3 (`BREAKING_CONFIRMED`):** `https://explorer-studio.genlayer.com/tx/0x2b1765792aed5528fe0516ed081f3615d907019b4fb025f440bc09b8a7ec28a5` (Direct Native Bounty Payout: 1 wei via `emit_transfer`)
  - **Scenario 4 (`NON_BREAKING`):** `https://explorer-studio.genlayer.com/tx/0x312985382ea2e59e09b6fd2feeb5a461fd8f0fb468c7519f9a212a06fdb9fae4`
  - **Scenario 5 (`NON_BREAKING` Injection Defense):** `https://explorer-studio.genlayer.com/tx/0xb167cde822841b6fbadc8529d6abb1b0b64e562fcfabd13dc82aba2451024fce` (Repo Mismatch Rejection: `0x54c7c83647d273c1f4cd32f4340f74030949e29397c193642a6ff77078be1e59`)
  - **Scenario 6 (`INSUFFICIENT_EVIDENCE`):** `https://explorer-studio.genlayer.com/tx/0xf992292cd32e3474a42f26ecef4a8c6e261bfb1851b797b0c581548d0667516b` (Trusted-Time Expiry: `0x4ba5b75ca1cfcb09adf2812d0353d883c1934efbc5df8f24e9e5f3ff9afab5d0`, Native Refund: `0x6b7b772e16d317e62e57bd6f39357a037a74534f8573b02770ed15536c2be05e`)
