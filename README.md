# DeprecateGuard 🛡️

> **Cryptographic Stability Bonds for Semantic Versioning (SemVer) on GenLayer Intelligent Contracts**

**Public Repository:** [`https://github.com/khezzed/DeprecateGuard`](https://github.com/khezzed/DeprecateGuard)  
**Network:** GenLayer StudioNet (Chain ID: `61999`, RPC: `https://studio.genlayer.com/api`)  
**Main Contract Address:** [`0xd975E69a3B2C4919Da5C8e72bE5EE42c233c1e81`](https://explorer-studio.genlayer.com/address/0xd975E69a3B2C4919Da5C8e72bE5EE42c233c1e81)  
**Deployment Tx:** [`0x13a7420bf0da2a7d0c631a825103670d7d142a49092b797bc7a4b56bac94e923`](https://explorer-studio.genlayer.com/tx/0x13a7420bf0da2a7d0c631a825103670d7d142a49092b797bc7a4b56bac94e923)  
**Evidence Probe Contract:** [`0xE735D4d659Ec0ED69e491C3262d517c81E6Aa88F`](https://explorer-studio.genlayer.com/address/0xE735D4d659Ec0ED69e491C3262d517c81E6Aa88F)

DeprecateGuard is a GenLayer-native decentralized application where open-source and API maintainers lock a **Stability Pledge Bond** guaranteeing that a specific interface or semantic behavior will not suffer an unannounced breaking change before a declared sunset date.

If a maintainer ships a release that breaks the pledged contract (e.g., deprecating a method, altering return semantics, or removing parameters), affected integrators submit a claim backed by **immutable, byte-stable release artifacts** (`raw.githubusercontent.com` pinned to an exact 40-character commit SHA or Archive.org raw `id_` captures). GenLayer decentralized validators parse the bounded artifact, verify an exact verbatim quote in their own fetched bytes, and judge whether the change constitutes a breaking violation of the frozen pledge clause.

---

## 1. Why GenLayer? (Judgment-Heavy vs. Number-Reading)

Classical oracles (Chainlink, Pyth) are designed to read numeric feeds (prices, scores, timestamps). They cannot judge software semantics. If an oracle checks whether a function string appears in a repository, it gets confused by comments, deprecation notices, or changelogs.

GenLayer validators run isolated Large Language Models (LLMs) inside the **GenVM** runtime and reach consensus on semantic interpretations. In DeprecateGuard:
1. **The Model Judges; Plain Code Moves Money:** The LLM outputs only fixed enum strings (`ACCEPTED`, `REJECTED_VAGUE`, `BREAKING_CONFIRMED`, `NON_BREAKING`, `INSUFFICIENT_EVIDENCE`). Deterministic Python arithmetic moves bond payouts.
2. **One Narrow Judgment Per Transaction:** Each claim evaluates **one frozen pledge clause** against **one bounded code slice**.
3. **Validators Agree on Evidence, Not Just Verdicts:** Using `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)`, the leader validator provides an exact verbatim quote and the SHA-256 digest of the extracted slice. Independent validators re-fetch the raw bytes, confirm `leader_out["digest"] == val_res["digest"]`, verify `verbatim_quote in val_res["slice"]`, and ratify the verdict.
4. **Byte-Level Immutability:** Mutable branch references (`main`, `master`) are deterministically rejected. Only 40-hex commit SHAs or raw Archive.org captures (`id_`) are accepted.
5. **Deterministic Pre-Parsing:** Large source files are pre-parsed with Python code before the model sees them. A bounded window ($\le 2,400$ characters) around the anchor symbol is extracted and hashed with SHA-256.
6. **Every Waiting State Has a Fallback:** After `expires_at + grace_period_seconds`, calling `resolve_expired_pledge()` deterministically unlocks the maintainer's bond so funds never lock forever.
7. **RuleGate Up Front:** Subjective promises (*"We promise our API will be modern, ergonomic, and fast"*) are rejected by validators at creation time (`REJECTED_VAGUE`), crediting the deposit to `refundable_balances` for immediate withdrawal.
8. **Prompt Injection Resilience:** External code is isolated inside `<UNTRUSTED_EVIDENCE>` tags. Tested live against a pinned commit from `liu00222/Open-Prompt-Injection` containing literal `"Ignore previous instructions."` inside the fetched Python code.

---

## 2. Architecture Diagram

```mermaid
flowchart TD
    subgraph Creation["Pledge Creation (Payable + RuleGate)"]
        A["Maintainer submits Clause + Bond (gl.public.write.payable)"] --> B["RuleGate Validator Consensus (gl.vm.run_nondet_unsafe)"]
        B -->|Objective & Testable| C["OPEN: Clause Frozen + SHA-256 Digest Stored"]
        B -->|Subjective / Vague| D["REJECTED_VAGUE: Deposit Credited to refundable_balances"]
    end

    subgraph Claim["Breaking Change Adjudication"]
        C --> E["Claimant submits Pinned 40-hex SHA URL + Anchor Symbol"]
        E --> F["Deterministic Pre-Parser: Validates URL, extracts bounded window <= 2400 chars, computes SHA-256"]
        F --> G["Leader Validator (leader_fn): Evaluates criterion vs Untrusted Evidence"]
        G --> H["Outputs: verdict + verbatim_quote + digest"]
        H --> I["Committee Validators (validator_fn): Re-fetch bytes, assert digest match, assert verbatim_quote in slice, assert verdict match"]
    end

    subgraph Settlement["Deterministic Code Moves Money"]
        I -->|BREAKING_CONFIRMED| J["Bond Awarded to Claimant"]
        I -->|NON_BREAKING| K["Pledge Remains Active"]
        I -->|INSUFFICIENT_EVIDENCE or Expired| L["Deterministic Fallback (resolve_expired_pledge): Maintainer Reclaims Bond"]
    end
```

---

## 2.1 Portal Steward Review Remediation (100% Real, Unmocked On-Chain Implementation)

Following direct feedback from GenLayer Portal Stewards (including latest Update Request from **Gen. Dave**), all mandatory architectural fixes were engineered and fully proven on StudioNet:

1. **Invalid Input Deposit Protection & Immediate Refundability (Gen. Dave Remediation):**
   - In `create_pledge()`, `gl.message.value` is credited to `refundable_balances[caller]` immediately up front before checking repository format, file path directory traversal, baseline tag length, or duration parameters.
   - Any transaction with invalid input returns `"ERROR:..."` with the full deposit safely recorded and immediately withdrawable via `withdraw_refundable()`. Callers never lose funds.
   - Tested and finalized on StudioNet:
     - Invalid Repo Tx: [`0x72af1350...`](https://explorer-studio.genlayer.com/tx/0x72af1350e28e4e8a38efe47bfba87efad39400b640ba62a6ae9ac19b048f67f5) -> `ERROR:INVALID_REPO_FULL_NAME` (credited 1 wei)
     - Invalid Path Tx: [`0xad0c4537...`](https://explorer-studio.genlayer.com/tx/0xad0c4537f1ed5278d1dfe9ce2992ebf74dec7ed0985f16af46a11e409c514598) -> `ERROR:INVALID_TARGET_FILE_PATH` (credited 1 wei)
     - Invalid Tag Tx: [`0x84ffe0b3...`](https://explorer-studio.genlayer.com/tx/0x84ffe0b3bc633c3cf6dac85c75d6c0b2da56fd9848c7bcab252bce244a5b535a) -> `ERROR:INVALID_BASELINE_TAG` (credited 1 wei)
     - Cumulative Native Withdrawal: [`0x1be89d90...`](https://explorer-studio.genlayer.com/tx/0x1be89d90b695331c1e28ebaa19befa736bbd7ad7748fa7fb79215f8f04831ea8) -> `WITHDRAWN:Address("0xc130..."):3` wei transferred back!

2. **Real Native Value Transfers (`gl.get_contract_at(recipient).emit_transfer`):**
   - Direct Bounty Transfer: When `BREAKING_CONFIRMED` is judged in `submit_and_judge_claim()`, the contract issues an immediate native token transfer to `claimant` via `gl.get_contract_at(claimant).emit_transfer(value=u256(bond))`.
   - Pull-Based Withdrawal: In `withdraw_refundable()`, checks-effects-interactions are enforced by zeroing the recorded balance *before* calling `gl.get_contract_at(caller).emit_transfer(value=u256(amount))`.
   - Verified on StudioNet:
     - Case 2: Vague pledge deposit refund ([`0xe821b121...`](https://explorer-studio.genlayer.com/tx/0xe821b1211daa9bf17e7723c24a3bf47adac2c57e81a7d3a147b03bbd99e0d0a1)) -> `WITHDRAWN:1 wei`
     - Case 3: Confirmed breaking change direct bounty payout ([`0x8d0d8599...`](https://explorer-studio.genlayer.com/tx/0x8d0d859938420f9b3fea93ba071371e3634c8d909a795242ed398fb4e8eb4dc3)) -> `CLAIM_SETTLED_PAID:CLAIM_1:BREAKING_CONFIRMED` with 1 wei native value transferred upon finalization!
     - Case 6: Unlocked expired pledge maintainer return ([`0xdf66fa1a...`](https://explorer-studio.genlayer.com/tx/0xdf66fa1a4136b4a3feabf23343eed1527249e960d3b919d7a1b8b076800e306f)) -> `WITHDRAWN:1 wei`

3. **Trusted Runtime Time Window Enforcement (`gl.message_raw["datetime"]`):**
   - Caller-supplied timestamp parameters and hardcoded timestamps have been eliminated.
   - `_get_trusted_timestamp()` extracts and parses the ISO-8601 string from GenVM (`gl.message_raw["datetime"]`) into a Unix integer timestamp.
   - `submit_and_judge_claim()` strictly enforces `now_ts <= int(pledge["expires_at"])` and records `judged_at` on every claim.
   - `resolve_expired_pledge(pledge_id)` evaluates real GenVM clock progression (`now_ts >= expires_at + grace_period_seconds`).

4. **Pledge-Bound Repository and Release Evidence:**
   - `create_pledge()` binds `repo_full_name`, `target_file_path`, and `baseline_tag`.
   - `submit_and_judge_claim()` requires `release_evidence_url != evidence_url`, enforces repository boundaries, extracts bounded slices with `extract_bounded_evidence(release_raw, release_tag)`, and verifies that the release artifact references `release_tag` (which cannot equal `baseline_tag`).
   - Combined SHA-256 digest (`hashlib.sha256(f"{release_digest}:{code_digest}")`) commits both validators and leader to the exact release evidence and code evidence.
   - Tested live on StudioNet: Mismatched repository claim was rejected on-chain with `ERROR:EVIDENCE_NOT_BOUND_TO_PLEDGE_REPO_OR_FILE` ([`0x158bfd19...`](https://explorer-studio.genlayer.com/tx/0x158bfd195bb574fb2013a13ceb6ee132e396af34c1ca5b58f1f6fd9189fc10d0)).

5. **Displayed Wallet Equals Signing Account:**
   - The React frontend provides an explicit dual-mode wallet controller: **Injected Browser Wallet (MetaMask / EIP-1193)** and **Embedded Burner Session Wallet**.
   - Includes a live `window.ethereum.on('accountsChanged')` listener so displayed accounts never diverge from MetaMask.
   - Every transaction write verifies `activeClientAccount.toLowerCase() === displayedAccount.toLowerCase()` before signing.

---

## 3. Finalized Live Scenarios on StudioNet (Chain ID: 61999)

All 6 scenarios are finalized on-chain at [`0xd975E69a3B2C4919Da5C8e72bE5EE42c233c1e81`](https://explorer-studio.genlayer.com/address/0xd975E69a3B2C4919Da5C8e72bE5EE42c233c1e81) and verified by `npm run verify:proof`:

| Scenario | Description | Immutable Evidence Artifact | Finalized Verdict & Return Payload | StudioNet Explorer Tx |
|---|---|---|---|---|
| **1** | Approved Stability Pledge for Express.js | Express `lib/response.js` | `ACCEPTED` (`"ACCEPTED:PLEDGE_1"`) | [`0xfe2b8371...`](https://explorer-studio.genlayer.com/tx/0xfe2b837190ca96eafd82ff2c05344cdcccd005806c5b9a8ea53d0ea394fb49f3) |
| **2** | Rejected Vague Marketing Pledge & Real Native Refund | Vague promise (`"modern, ergonomic, fast"`) | `REJECTED_VAGUE` (`"REJECTED_VAGUE:PLEDGE_2"`) + Real Native Transfer [`0xe821b121...`](https://explorer-studio.genlayer.com/tx/0xe821b1211daa9bf17e7723c24a3bf47adac2c57e81a7d3a147b03bbd99e0d0a1) | [`0xf0ae0a0c...`](https://explorer-studio.genlayer.com/tx/0xf0ae0a0c6c9cc178692e0bd391c89b54dc81b1393f7b4a312ca30a56cb17c22d) |
| **3** | Express.js Deprecates Legacy res.sendfile() & Pays Bounty | Express 4.18.2 (`8368dc17...`) `res.sendfile = deprecate.function` | `BREAKING_CONFIRMED` (`"CLAIM_SETTLED_PAID:CLAIM_1:BREAKING_CONFIRMED"`) + Direct Native Payout (1 wei) | [`0x8d0d8599...`](https://explorer-studio.genlayer.com/tx/0x8d0d859938420f9b3fea93ba071371e3634c8d909a795242ed398fb4e8eb4dc3) |
| **4** | False Alarm on Intact res.sendFile() Signature | Express 4.18.2 (`8368dc17...`) intact `res.sendFile` | `NON_BREAKING` (`"CLAIM_RECORDED:CLAIM_2:NON_BREAKING"`) | [`0xe5463dac...`](https://explorer-studio.genlayer.com/tx/0xe5463dac8400eeef01991c7842fe48f0b2d193ca3ff509f8956a19030db5b33d) |
| **5** | Prompt-Injection Defense & Mismatched Repo Enforcement | `Open-Prompt-Injection` (`fbed5cca...`) `environment.yml` & `CombineAttacker.py` | `NON_BREAKING` (`"CLAIM_RECORDED:CLAIM_3:NON_BREAKING"`) + Repo Mismatch Rejection [`0x158bfd19...`](https://explorer-studio.genlayer.com/tx/0x158bfd195bb574fb2013a13ceb6ee132e396af34c1ca5b58f1f6fd9189fc10d0) | [`0xc2c0f9cd...`](https://explorer-studio.genlayer.com/tx/0xc2c0f9cd4ab755d54fc05554b996f7c67f9a99b7e6a8d1b089b620d5dae19880) |
| **6** | Unmatched Symbol & Trusted-Time Bond Expiry Refund | Absent symbol query + Trusted-time `resolve_expired_pledge()` | `INSUFFICIENT_EVIDENCE` + Expiry Fallback [`0xbd74fe55...`](https://explorer-studio.genlayer.com/tx/0xbd74fe55180dfbaf0315b38e49c9f40b578c9879d748d589c13a4a8b5e48c1b5) + Real Refund Transfer [`0xdf66fa1a...`](https://explorer-studio.genlayer.com/tx/0xdf66fa1a4136b4a3feabf23343eed1527249e960d3b919d7a1b8b076800e306f) | [`0x4eb9db85...`](https://explorer-studio.genlayer.com/tx/0x4eb9db85fc5e94beed31f10c918d9b36f346538d90a91a51f5b04569b2dd87f9) |

---

## 4. Developer Tool: `gl-evidence-probe` CLI

DeprecateGuard includes a standalone, reusable CLI utility (`tools/gl-evidence-probe.mjs`) to audit evidence URLs before writing contracts:

```bash
# Verify byte immutability, dual-fetch stability, and bounded extraction
node tools/gl-evidence-probe.mjs "https://raw.githubusercontent.com/expressjs/express/8368dc178af16b91b576c4c1d135f701a0007e5d/lib/response.js" --anchor sendfile
```

---

## 5. How to Run & Verify

```bash
# 1. Install dependencies
npm install

# 2. Run Direct-Mode simulation tests
npm run test:mock

# 3. Verify all 6 live on-chain proofs on StudioNet (zero private keys needed)
npm run verify:proof

# 4. Build and run the frontend
cd frontend
npm install
npm run build
npm run dev
```

---

## 6. Honest Limitations

1. **Pre-Parsed File Scope:** Slicing is bounded to 2,400 characters around the anchor symbol. If a breaking change spans across multiple unanchored files simultaneously, claims should be split across discrete symbol clauses.
2. **Appeal Windows:** GenLayer transactions include a native appeal window before finalization. The frontend tracks `submitted -> pending -> accepted -> finalized-success / finalized-error`.
3. **Network Rate Limits:** StudioNet enforces ~30 req/min; all deployment, seeding, and frontend polling scripts use 8-second polling intervals.

---

## 7. Documentation & Portal Contributions

- [Step-by-Step Developer Tutorial](docs/TUTORIAL.md) (850+ words)
- [Architectural Deep-Dive Blog Article](docs/BLOG_ARTICLE.md) (750+ words)
- [2-Minute Demonstration Script](docs/DEMO_SCRIPT.md)
- [Ready-to-Paste Portal Submission Fields](docs/PORTAL_SUBMISSION.md)
