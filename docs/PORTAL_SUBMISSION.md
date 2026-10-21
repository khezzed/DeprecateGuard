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
  Click the "Live StudioNet RPC (gen_call)" toggle in the top header to execute real-time read calls (get_stats, get_pledge, get_claim) directly against StudioNet Chain 61999 (0x0645f04f8Fb89451Fa0c2B3c6F5E4cbD724Fb531).
  ```

### Step `#3`
- **OPTIONAL HEADING:**
  ```text
  Run Automated CLI Proof Verification
  ```
- **INSTRUCTION:**
  ```text
  Clone https://github.com/khezzed/DeprecateGuard, run "npm install", and execute "npm run verify:proof" to independently verify all 6 finalized transactions and GenVM receipts against https://studio.genlayer.com/api.
  ```

### Step `#4`
- **OPTIONAL HEADING:**
  ```text
  Test Interactive Wallet Flows
  ```
- **INSTRUCTION:**
  ```text
  Use the Interactive StudioNet Actions panel to create a new pledge bond (testing RuleGate acceptance or vague-rule rejection), submit a breaking-change claim against a 40-hex commit SHA, or withdraw refundable balances.
  ```

---

## 06 Review Verification — "Prove the path works" (`358 / 500` characters)

- **EXPECTED VERIFICATION OUTCOME (`Max 500 chars`):**
  ```text
  The UI and "npm run verify:proof" confirm 6/6 finalized StudioNet scenarios (MAJORITY_AGREE, GenVM: SUCCESS): (1) ACCEPTED pledge, (2) REJECTED_VAGUE + refund withdrawal, (3) BREAKING_CONFIRMED + bond payout, (4) NON_BREAKING additive release, (5) NON_BREAKING adversarial prompt-injection rejection, and (6) INSUFFICIENT_EVIDENCE + deadline expiry refund.
  ```
  *(360 characters — fits cleanly inside the `0/500` limit)*

- **CONTRACT LINK 1 (OPTIONAL):**
  ```text
  https://explorer-studio.genlayer.com/address/0x0645f04f8Fb89451Fa0c2B3c6F5E4cbD724Fb531
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
  *(Note: Prepared and pushed to the `gh-pages` branch of your repository — enable GitHub Pages on branch `gh-pages` in repo Settings -> Pages, or deploy via Vercel).*
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
  - **Scenario 1 (`ACCEPTED`):** `https://explorer-studio.genlayer.com/tx/0xc39597f74e279ea29f6637a4471294b6c5f32701314dee90f9036d0b29914fd5`
  - **Scenario 2 (`REJECTED_VAGUE`):** `https://explorer-studio.genlayer.com/tx/0xb73415e7075773cefcd8e500a38a88993fbeaf2eb97b2521ac339fa53658aa23`
  - **Scenario 3 (`BREAKING_CONFIRMED`):** `https://explorer-studio.genlayer.com/tx/0x5246e1f868746b57d6566a2786876617ae51763aa0d09a24d2a3d5c1cd86fe10`
  - **Scenario 4 (`NON_BREAKING`):** `https://explorer-studio.genlayer.com/tx/0x8a2852ae7c25976800032db41e412b8e5ae936b3e69733c744a5f429ba380ea7`
  - **Scenario 5 (`NON_BREAKING` Injection Defense):** `https://explorer-studio.genlayer.com/tx/0x04d21a7e64ebc1dc3ae4e184d7d39b305f2b74e09cb1cdec88a437782912a3b6`
  - **Scenario 6 (`INSUFFICIENT_EVIDENCE`):** `https://explorer-studio.genlayer.com/tx/0xc02ae20c49a468bcfa0d08d7acc02cffa267b0238c7c9bfae68a23607e5b174f`
