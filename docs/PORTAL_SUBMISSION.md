# GenLayer Portal Submission Fields

Copy and paste these exact fields when submitting your contributions to the GenLayer Portal.

---

### Contribution 1: Project / Deployed Contract (25–500 Base Points)

- **Contribution Type:** Project / Deployed Contract
- **Project Name:** DeprecateGuard
- **One-Liner:** API Breaking-Change & SemVer Deprecation Pledge Bond on GenLayer Intelligent Contracts
- **Public GitHub Repository:** `https://github.com/khezzed/DeprecateGuard`
- **Network / Chain ID:** GenLayer StudioNet (Chain ID: `61999`, RPC: `https://studio.genlayer.com/api`)
- **Main Intelligent Contract Address:** `0x0645f04f8Fb89451Fa0c2B3c6F5E4cbD724Fb531`
- **Probe Evidence Contract Address:** `0xE735D4d659Ec0ED69e491C3262d517c81E6Aa88F`
- **Contract Explorer Links:**
  - Main Contract: `https://explorer-studio.genlayer.com/address/0x0645f04f8Fb89451Fa0c2B3c6F5E4cbD724Fb531`
  - Probe Contract: `https://explorer-studio.genlayer.com/address/0xE735D4d659Ec0ED69e491C3262d517c81E6Aa88F`
  - Scenario 1 (`ACCEPTED`): `https://explorer-studio.genlayer.com/tx/0xc39597f74e279ea29f6637a4471294b6c5f32701314dee90f9036d0b29914fd5`
  - Scenario 2 (`REJECTED_VAGUE`): `https://explorer-studio.genlayer.com/tx/0xb73415e7075773cefcd8e500a38a88993fbeaf2eb97b2521ac339fa53658aa23`
  - Scenario 3 (`BREAKING_CONFIRMED`): `https://explorer-studio.genlayer.com/tx/0x5246e1f868746b57d6566a2786876617ae51763aa0d09a24d2a3d5c1cd86fe10`
  - Scenario 4 (`NON_BREAKING`): `https://explorer-studio.genlayer.com/tx/0x8a2852ae7c25976800032db41e412b8e5ae936b3e69733c744a5f429ba380ea7`
  - Scenario 5 (`NON_BREAKING` Injection Defense): `https://explorer-studio.genlayer.com/tx/0x04d21a7e64ebc1dc3ae4e184d7d39b305f2b74e09cb1cdec88a437782912a3b6`
  - Scenario 6 (`INSUFFICIENT_EVIDENCE` + Deadline Fallback): `https://explorer-studio.genlayer.com/tx/0xc02ae20c49a468bcfa0d08d7acc02cffa267b0238c7c9bfae68a23607e5b174f`

#### Description (868 characters — strictly under the 1,000-character limit):
DeprecateGuard is a GenLayer-native Intelligent Contract application where API and open-source maintainers lock a stability bond guaranteeing backward compatibility. When a release ships, GenLayer validators evaluate claims against immutable 40-hex commit SHA artifacts to judge whether a breaking change occurred. Built strictly to GenLayer design rules: plain code moves funds while models return only fixed enum verdicts; custom validator equivalence (`gl.vm.run_nondet_unsafe`) verifies the SHA-256 slice digest, checks that the leader's verbatim quote exists in each validator's fetched bytes, and compares verdicts; large files are pre-parsed into bounded slices; vague clauses are rejected up front by a RuleGate check; untrusted code is sandboxed against prompt injection; and `resolve_expired_pledge()` prevents locked funds.

#### How-To Steps for Reviewers:
1. Open the deployed frontend (Zero-Wallet Reviewer Mode loads by default) to inspect all 6 finalized StudioNet scenarios, verbatim quotes, SHA-256 slice digests, and Explorer links without connecting a wallet.
2. Click "Live StudioNet RPC (gen_call)" to query live on-chain `get_stats()`, `get_pledge(id)`, and `get_claim(id)` directly from StudioNet Chain 61999.
3. Clone `https://github.com/khezzed/DeprecateGuard`, run `npm install`, and run `npm run verify:proof` to independently verify all 6 finalized transactions and GenVM receipts against `https://studio.genlayer.com/api`.
4. Use the Interactive Wallet panel to lock a new pledge bond, submit a breaking-change claim, or withdraw refundable balances.

#### Expected Outcome:
`npm run verify:proof` outputs 6/6 Scenarios Verified on StudioNet (`FINALIZED`, `MAJORITY_AGREE`, `GenVM: SUCCESS`), confirming `ACCEPTED`, `REJECTED_VAGUE` + withdrawal, `BREAKING_CONFIRMED` + bond payout, `NON_BREAKING`, prompt-injection rejection, and `INSUFFICIENT_EVIDENCE` + expiry fallback.

---

### Contribution 2: Standalone Developer Tool (100–500 Base Points)

- **Contribution Type:** Developer Tool
- **Tool Name:** `gl-evidence-probe` CLI
- **Repository Link:** `https://github.com/khezzed/DeprecateGuard/blob/main/tools/gl-evidence-probe.mjs`
- **Description:** A standalone CLI developer utility for GenLayer developers that audits external evidence URLs before writing Intelligent Contracts. Verifies byte-level immutability (GitHub 40-hex SHA pinning and Archive.org `id_` raw modifiers), tests dual-fetch byte stability to prevent validator consensus disagreement, extracts bounded keyword slices with SHA-256 digests, and probes StudioNet RPC health.
- **Usage:** `node tools/gl-evidence-probe.mjs <url> --anchor <symbol>`

---

### Contribution 3: Step-by-Step Developer Tutorial (50–200 Base Points)

- **Contribution Type:** Tutorial / Documentation
- **Title:** Building DeprecateGuard: Decentralized API Breaking-Change & Deprecation Pledge Bonds on GenLayer
- **Repository Link:** `https://github.com/khezzed/DeprecateGuard/blob/main/docs/TUTORIAL.md`
- **Word Count:** 850+ words

---

### Contribution 4: Architectural Deep-Dive Blog Post (30–150 Base Points)

- **Contribution Type:** Blog / Article
- **Title:** Why Oracles Can't Judge SemVer: Intelligent Contracts for API Governance on GenLayer
- **Repository Link:** `https://github.com/khezzed/DeprecateGuard/blob/main/docs/BLOG_ARTICLE.md`
- **Word Count:** 750+ words
