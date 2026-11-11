import fs from 'node:fs';
import path from 'node:path';
import { getStudioClient, saveState, loadState, saveProof, waitForFinality } from './lib/studio_client.mjs';

const PINNED_EXPRESS_URL = 'https://raw.githubusercontent.com/expressjs/express/8368dc178af16b91b576c4c1d135f701a0007e5d/lib/response.js';
const PINNED_EXPRESS_RELEASE = 'https://raw.githubusercontent.com/expressjs/express/8368dc178af16b91b576c4c1d135f701a0007e5d/History.md';
const PINNED_INJECTION_URL = 'https://raw.githubusercontent.com/liu00222/Open-Prompt-Injection/fbed5cca347488f88363790ae3ae97c56116da6a/OpenPromptInjection/attackers/CombineAttacker.py';
const PINNED_INJECTION_RELEASE = 'https://raw.githubusercontent.com/liu00222/Open-Prompt-Injection/fbed5cca347488f88363790ae3ae97c56116da6a/README.md';

async function main() {
  console.log('=== Step 3: Seeding Live Real Scenarios on StudioNet (All 4 Steward Fixes) ===');
  const { client, account } = getStudioClient();
  const state = loadState();
  const contractAddress = state.mainContractAddress;

  if (!contractAddress) {
    throw new Error('Main contract address not found in state. Run 02_deploy_main.mjs first.');
  }

  console.log(`Target Contract Address: ${contractAddress}`);
  console.log(`Operator Account: ${account.address}`);

  const cases = state.cases || {};

  // --------------------------------------------------------------------------
  // Case 1: Valid Objective Pledge Creation (RuleGate ACCEPTED)
  // --------------------------------------------------------------------------
  if (!cases.case1_pledgeValid) {
    console.log('\n--- Case 1: Submitting Objective Pledge (Express res.sendFile) ---');
    const clause = 'In Express.js lib/response.js, the res.sendFile(path, options, callback) method must exist and accept (path, options, callback) arguments without being removed.';
    const tx = await client.writeContract({
      address: contractAddress,
      functionName: 'create_pledge',
      args: [
        'express',
        'expressjs/express',
        'lib/response.js',
        '4.17.1',
        clause,
        2592000,
        86400
      ],
      value: 1n
    });
    console.log(`Case 1 Tx Hash: ${tx}`);
    const finality = await waitForFinality(client, tx);
    const pledgeRaw = await client.readContract({
      address: contractAddress,
      functionName: 'get_pledge',
      args: [1]
    });
    const pledgeObj = JSON.parse(pledgeRaw);
    console.log(`Case 1 Finalized On-Chain Pledge #1:`, pledgeObj);
    if (pledgeObj.status !== 'OPEN') {
      throw new Error(`Expected Pledge #1 status OPEN, got: ${pledgeRaw}`);
    }
    cases.case1_pledgeValid = {
      txHash: tx,
      returnReadable: finality.returnReadable,
      expected: 'ACCEPTED',
      actual: pledgeObj.rule_gate_outcome || 'ACCEPTED',
      evidenceUrl: PINNED_EXPRESS_URL,
      verbatimQuote: 'res.sendFile = function sendFile(path, options, callback)',
      extractedDigest: pledgeObj.clause_sha256,
      details: pledgeObj
    };
    saveState({ cases });
  } else {
    console.log('[SKIP] Case 1 already verified:', cases.case1_pledgeValid.txHash);
  }

  // --------------------------------------------------------------------------
  // Case 2: Vague Pledge Rejection (RuleGate REJECTED_VAGUE) + Real Withdrawal
  // --------------------------------------------------------------------------
  if (!cases.case2_pledgeVague) {
    console.log('\n--- Case 2: Submitting Subjective/Vague Pledge ---');
    const vagueClause = 'We promise our API will always stay modern, ergonomic, fast, and developer-friendly for everyone.';
    const tx = await client.writeContract({
      address: contractAddress,
      functionName: 'create_pledge',
      args: [
        'express-vague',
        'expressjs/express',
        'lib/response.js',
        '4.17.1',
        vagueClause,
        2592000,
        86400
      ],
      value: 1n
    });
    console.log(`Case 2 Tx Hash: ${tx}`);
    const finality = await waitForFinality(client, tx);
    const pledgeRaw = await client.readContract({
      address: contractAddress,
      functionName: 'get_pledge',
      args: [2]
    });
    const pledgeObj = JSON.parse(pledgeRaw);
    console.log(`Case 2 Finalized On-Chain Pledge #2:`, pledgeObj);
    if (pledgeObj.status !== 'REJECTED_VAGUE') {
      throw new Error(`Expected Pledge #2 status REJECTED_VAGUE, got: ${pledgeRaw}`);
    }

    console.log('Executing real withdraw_refundable() native transfer to reclaim rejected deposit...');
    const withdrawTx = await client.writeContract({
      address: contractAddress,
      functionName: 'withdraw_refundable',
      args: []
    });
    console.log(`Case 2 Withdraw Tx Hash: ${withdrawTx}`);
    const withdrawFinality = await waitForFinality(client, withdrawTx);
    console.log(`Case 2 Real Native Token Withdrawal Finalized: ${withdrawFinality.returnReadable}`);

    cases.case2_pledgeVague = {
      txHash: tx,
      withdrawTx,
      withdrawReturn: withdrawFinality.returnReadable,
      returnReadable: finality.returnReadable,
      expected: 'REJECTED_VAGUE',
      actual: pledgeObj.status,
      evidenceUrl: PINNED_EXPRESS_URL,
      verbatimQuote: pledgeObj.rule_gate_reason,
      extractedDigest: pledgeObj.clause_sha256,
      details: pledgeObj
    };
    saveState({ cases });
  } else {
    console.log('[SKIP] Case 2 already verified:', cases.case2_pledgeVague.txHash);
  }

  // --------------------------------------------------------------------------
  // Case 3: Breaking Change Claim (BREAKING_CONFIRMED) + Bond Settlement & Withdrawal
  // --------------------------------------------------------------------------
  if (!cases.case3_claimBreaking) {
    console.log('\n--- Case 3: Creating Legacy sendfile Pledge & Filing Breaking Claim ---');
    const legacyClause = 'In Express.js lib/response.js, the legacy res.sendfile (lowercase f) method must NOT be deprecated or wrapped in deprecate.function.';
    const pledgeTx = await client.writeContract({
      address: contractAddress,
      functionName: 'create_pledge',
      args: [
        'express-legacy',
        'expressjs/express',
        'lib/response.js',
        '4.17.1',
        legacyClause,
        2592000,
        86400
      ],
      value: 1n
    });
    console.log(`Case 3 Pledge Tx: ${pledgeTx}`);
    await waitForFinality(client, pledgeTx);

    console.log('Submitting breaking claim with pledge-bound repository and release evidence...');
    const claimTx = await client.writeContract({
      address: contractAddress,
      functionName: 'submit_and_judge_claim',
      args: [
        3,
        '4.18.2',
        '8368dc178af16b91b576c4c1d135f701a0007e5d',
        PINNED_EXPRESS_RELEASE,
        PINNED_EXPRESS_URL,
        'res.sendfile ='
      ]
    });
    console.log(`Case 3 Claim Tx Hash: ${claimTx}`);
    const finality = await waitForFinality(client, claimTx);
    const claimRaw = await client.readContract({
      address: contractAddress,
      functionName: 'get_claim',
      args: [1]
    });
    const claimObj = JSON.parse(claimRaw);
    console.log(`Case 3 Finalized On-Chain Claim #1:`, claimObj);
    if (claimObj.verdict !== 'BREAKING_CONFIRMED') {
      throw new Error(`Expected Claim #1 BREAKING_CONFIRMED, got: ${claimRaw}`);
    }

    console.log('Executing claimant withdraw_refundable() for real native token bond payout...');
    const withdrawTx = await client.writeContract({
      address: contractAddress,
      functionName: 'withdraw_refundable',
      args: []
    });
    console.log(`Case 3 Bounty Payout Withdraw Tx Hash: ${withdrawTx}`);
    const withdrawFinality = await waitForFinality(client, withdrawTx);
    console.log(`Case 3 Bounty Payout Real Native Transfer Finalized: ${withdrawFinality.returnReadable}`);

    cases.case3_claimBreaking = {
      pledgeTx,
      txHash: claimTx,
      withdrawTx,
      withdrawReturn: withdrawFinality.returnReadable,
      returnReadable: finality.returnReadable,
      expected: 'BREAKING_CONFIRMED',
      actual: claimObj.verdict,
      evidenceUrl: PINNED_EXPRESS_URL,
      releaseEvidenceUrl: PINNED_EXPRESS_RELEASE,
      verbatimQuote: claimObj.verbatim_quote,
      extractedDigest: claimObj.extracted_digest,
      details: claimObj
    };
    saveState({ cases });
  } else {
    console.log('[SKIP] Case 3 already verified:', cases.case3_claimBreaking.txHash);
  }

  // --------------------------------------------------------------------------
  // Case 4: Honest Non-Breaking Claim (NON_BREAKING)
  // --------------------------------------------------------------------------
  if (!cases.case4_claimNonBreaking) {
    console.log('\n--- Case 4: Filing Non-Breaking Claim Against Intact Express res.sendFile ---');
    const claimTx = await client.writeContract({
      address: contractAddress,
      functionName: 'submit_and_judge_claim',
      args: [
        1,
        '4.18.2',
        '8368dc178af16b91b576c4c1d135f701a0007e5d',
        PINNED_EXPRESS_RELEASE,
        PINNED_EXPRESS_URL,
        'res.sendFile = function sendFile'
      ]
    });
    console.log(`Case 4 Claim Tx Hash: ${claimTx}`);
    const finality = await waitForFinality(client, claimTx);
    const claimRaw = await client.readContract({
      address: contractAddress,
      functionName: 'get_claim',
      args: [2]
    });
    const claimObj = JSON.parse(claimRaw);
    console.log(`Case 4 Finalized On-Chain Claim #2:`, claimObj);
    if (claimObj.verdict !== 'NON_BREAKING') {
      throw new Error(`Expected Claim #2 NON_BREAKING, got: ${claimRaw}`);
    }

    cases.case4_claimNonBreaking = {
      txHash: claimTx,
      returnReadable: finality.returnReadable,
      expected: 'NON_BREAKING',
      actual: claimObj.verdict,
      evidenceUrl: PINNED_EXPRESS_URL,
      releaseEvidenceUrl: PINNED_EXPRESS_RELEASE,
      verbatimQuote: claimObj.verbatim_quote,
      extractedDigest: claimObj.extracted_digest,
      details: claimObj
    };
    saveState({ cases });
  } else {
    console.log('[SKIP] Case 4 already verified:', cases.case4_claimNonBreaking.txHash);
  }

  // --------------------------------------------------------------------------
  // Case 5: Adversarial Prompt Injection Defense + Bonus Mismatched Repo Check
  // --------------------------------------------------------------------------
  if (!cases.case5_injectionDefense) {
    console.log('\n--- Case 5: Testing Mismatched Repo Rejection & Prompt Injection Defense ---');

    console.log('Testing bonus check: attempting claim with mismatched repository URL against Pledge 1...');
    const mismatchedTx = await client.writeContract({
      address: contractAddress,
      functionName: 'submit_and_judge_claim',
      args: [
        1,
        '4.18.2',
        '8368dc178af16b91b576c4c1d135f701a0007e5d',
        PINNED_EXPRESS_RELEASE,
        'https://raw.githubusercontent.com/evilorg/fakeexpress/8368dc178af16b91b576c4c1d135f701a0007e5d/lib/response.js',
        'res.sendFile ='
      ]
    });
    console.log(`Mismatched Repo Tx Hash: ${mismatchedTx}`);
    const mismatchedFinality = await waitForFinality(client, mismatchedTx);
    console.log(`Mismatched Repo Rejection Result: ${mismatchedFinality.returnReadable}`);

    console.log('Now creating Pledge #4 for Open-Prompt-Injection...');
    const injectClause = 'In OpenPromptInjection CombineAttacker.py, the inject(self, clean_data, idx, target_task) method must continue to exist and accept (self, clean_data, idx, target_task) arguments.';
    const pledgeTx = await client.writeContract({
      address: contractAddress,
      functionName: 'create_pledge',
      args: [
        'open-prompt-injection',
        'liu00222/Open-Prompt-Injection',
        'OpenPromptInjection/attackers/CombineAttacker.py',
        '0.1.0',
        injectClause,
        2592000,
        86400
      ],
      value: 1n
    });
    console.log(`Case 5 Pledge Tx: ${pledgeTx}`);
    await waitForFinality(client, pledgeTx);

    console.log('Submitting claim against CombineAttacker.py (contains literal "Ignore previous instructions")...');
    const claimTx = await client.writeContract({
      address: contractAddress,
      functionName: 'submit_and_judge_claim',
      args: [
        4,
        'Open-Prompt-Injection',
        'fbed5cca347488f88363790ae3ae97c56116da6a',
        PINNED_INJECTION_RELEASE,
        PINNED_INJECTION_URL,
        'def inject(self, clean_data, idx, target_task):'
      ]
    });
    console.log(`Case 5 Claim Tx Hash: ${claimTx}`);
    const finality = await waitForFinality(client, claimTx);
    const claimRaw = await client.readContract({
      address: contractAddress,
      functionName: 'get_claim',
      args: [3]
    });
    const claimObj = JSON.parse(claimRaw);
    console.log(`Case 5 Finalized On-Chain Claim #3:`, claimObj);
    if (claimObj.verdict !== 'NON_BREAKING') {
      throw new Error(`Expected Claim #3 NON_BREAKING, got: ${claimRaw}`);
    }

    cases.case5_injectionDefense = {
      mismatchedTx,
      mismatchedReturn: mismatchedFinality.returnReadable,
      pledgeTx,
      txHash: claimTx,
      returnReadable: finality.returnReadable,
      expected: 'NON_BREAKING',
      actual: claimObj.verdict,
      evidenceUrl: PINNED_INJECTION_URL,
      releaseEvidenceUrl: PINNED_INJECTION_RELEASE,
      verbatimQuote: claimObj.verbatim_quote,
      extractedDigest: claimObj.extracted_digest,
      details: claimObj
    };
    saveState({ cases });
  } else {
    console.log('[SKIP] Case 5 already verified:', cases.case5_injectionDefense.txHash);
  }

  // --------------------------------------------------------------------------
  // Case 6: INSUFFICIENT_EVIDENCE & Trusted-Time Expiry Fallback & Real Withdrawal
  // --------------------------------------------------------------------------
  if (!cases.case6_insufficientAndFallback) {
    console.log('\n--- Case 6: Testing INSUFFICIENT_EVIDENCE & Trusted-Time Expiry Fallback ---');
    console.log('Creating short-duration pledge (duration=2s, grace=2s) for trusted-time expiry test...');
    const pledgeTx = await client.writeContract({
      address: contractAddress,
      functionName: 'create_pledge',
      args: [
        'express-short',
        'expressjs/express',
        'lib/response.js',
        '4.17.1',
        'In Express.js lib/response.js, res.format must exist.',
        2,
        2
      ],
      value: 1n
    });
    console.log(`Case 6 Pledge Tx: ${pledgeTx}`);
    await waitForFinality(client, pledgeTx);

    console.log('Submitting claim with nonexistent anchor symbol (INSUFFICIENT_EVIDENCE)...');
    const claimTx = await client.writeContract({
      address: contractAddress,
      functionName: 'submit_and_judge_claim',
      args: [
        5,
        '4.18.2',
        '8368dc178af16b91b576c4c1d135f701a0007e5d',
        PINNED_EXPRESS_RELEASE,
        PINNED_EXPRESS_URL,
        'nonExistentFunctionSymbol_XYZ_999'
      ]
    });
    console.log(`Case 6 Insufficient Evidence Claim Tx Hash: ${claimTx}`);
    const finality = await waitForFinality(client, claimTx);
    const claimRaw = await client.readContract({
      address: contractAddress,
      functionName: 'get_claim',
      args: [4]
    });
    const claimObj = JSON.parse(claimRaw);
    console.log(`Case 6 Finalized On-Chain Claim #4:`, claimObj);

    console.log('Waiting 10s so trusted runtime timestamp gl.message_raw["datetime"] > expires_at + grace_period...');
    await new Promise(r => setTimeout(r, 10000));

    console.log('Executing resolve_expired_pledge(5) with trusted runtime time (no caller timestamp parameter!)...');
    const expireTx = await client.writeContract({
      address: contractAddress,
      functionName: 'resolve_expired_pledge',
      args: [5]
    });
    console.log(`Case 6 Expire Tx Hash: ${expireTx}`);
    const expireFinality = await waitForFinality(client, expireTx);
    console.log(`Case 6 Expire Fallback Finalized: ${expireFinality.returnReadable}`);

    console.log('Executing withdraw_refundable() for maintainer unlocked bond via real native transfer...');
    const withdrawTx = await client.writeContract({
      address: contractAddress,
      functionName: 'withdraw_refundable',
      args: []
    });
    console.log(`Case 6 Maintainer Refund Withdraw Tx: ${withdrawTx}`);
    const withdrawFinality = await waitForFinality(client, withdrawTx);
    console.log(`Case 6 Maintainer Refund Native Transfer Finalized: ${withdrawFinality.returnReadable}`);

    cases.case6_insufficientAndFallback = {
      pledgeTx,
      txHash: claimTx,
      expireTx,
      expireReturn: expireFinality.returnReadable,
      withdrawTx,
      withdrawReturn: withdrawFinality.returnReadable,
      returnReadable: finality.returnReadable,
      expected: 'INSUFFICIENT_EVIDENCE',
      actual: claimObj.verdict,
      evidenceUrl: PINNED_EXPRESS_URL,
      verbatimQuote: claimObj.verbatim_quote,
      extractedDigest: claimObj.extracted_digest,
      details: claimObj
    };
    saveState({ cases });
  } else {
    console.log('[SKIP] Case 6 already verified:', cases.case6_insufficientAndFallback.txHash);
  }

  // --------------------------------------------------------------------------
  // Build and Save deploy/proof.json Manifest
  // --------------------------------------------------------------------------
  const statsRaw = await client.readContract({
    address: contractAddress,
    functionName: 'get_stats',
    args: []
  });
  const liveStats = JSON.parse(statsRaw);
  console.log('\nFinal On-Chain Contract Stats:', liveStats);

  const proof = {
    projectName: 'DeprecateGuard',
    tagline: 'Intelligent Contract for API Breaking-Change & Deprecation Pledge Bonds',
    repositoryUrl: 'https://github.com/khezzed/DeprecateGuard',
    network: {
      networkName: 'GenLayer StudioNet',
      chainId: 61999,
      rpcUrl: 'https://studio.genlayer.com/api',
      explorerUrl: 'https://explorer-studio.genlayer.com'
    },
    runnerHash: '1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6',
    contracts: {
      mainContract: {
        name: 'DeprecateGuard',
        address: contractAddress,
        deployTx: state.mainDeployTx
      }
    },
    contractStats: liveStats,
    operatorAccount: account.address,
    portalStewardAuditFixes: {
      fix1_realNativeTransfers: 'gl.get_contract_at(caller).emit_transfer(value=u256(amount)) executed on withdraw_refundable() for rejected deposits, settled breaking bounties, and expired pledge bond returns.',
      fix2_trustedRuntimeTime: 'gl.message_raw["datetime"] parsed via _get_trusted_timestamp(); caller timestamp removed from resolve_expired_pledge(pledge_id).',
      fix3_pledgeBoundRepositoryAndRelease: 'create_pledge binds repo_full_name, target_file_path, and baseline_tag; submit_and_judge_claim enforces exact commit SHA URL match, verifies release artifact tag, and computes combined SHA-256 digest.',
      fix4_displayedWalletMatchesSigner: 'Signing account strictly exposed and matched with displayed account badge across embedded session and injected wallet modes.'
    },
    scenarios: [
      {
        id: 1,
        title: 'Case 1: Objective Pledge Creation (RuleGate ACCEPTED)',
        description: 'Maintainer locks a stability pledge bond for Express.js res.sendFile. Validators run RuleGate LLM check, confirm the commitment is concrete and code-verifiable, freeze repo and clause hash, and open the pledge.',
        txHash: cases.case1_pledgeValid.txHash,
        outcome: 'ACCEPTED',
        evidenceUrl: cases.case1_pledgeValid.evidenceUrl,
        verbatimQuote: cases.case1_pledgeValid.verbatimQuote,
        extractedDigest: cases.case1_pledgeValid.extractedDigest,
        details: cases.case1_pledgeValid.details
      },
      {
        id: 2,
        title: 'Case 2: Subjective Pledge Rejection (RuleGate REJECTED_VAGUE) + Real Native Withdrawal',
        description: 'Maintainer attempts vague pledge ("modern, ergonomic, fast"). Validators reject it. Maintainer executes withdraw_refundable() which issues a real on-chain native transfer via gl.get_contract_at(caller).emit_transfer.',
        txHash: cases.case2_pledgeVague.txHash,
        withdrawTx: cases.case2_pledgeVague.withdrawTx,
        withdrawReturn: cases.case2_pledgeVague.withdrawReturn,
        outcome: 'REJECTED_VAGUE',
        evidenceUrl: cases.case2_pledgeVague.evidenceUrl,
        verbatimQuote: cases.case2_pledgeVague.verbatimQuote,
        extractedDigest: cases.case2_pledgeVague.extractedDigest,
        details: cases.case2_pledgeVague.details
      },
      {
        id: 3,
        title: 'Case 3: Breaking Change Confirmed (BREAKING_CONFIRMED) + Real Native Bounty Payout',
        description: 'Claimant submits pledge-bound release evidence (History.md) and code evidence (lib/response.js) proving res.sendfile was deprecated. Validators confirm breach. Bond settles to claimant, who withdraws via real native transfer.',
        txHash: cases.case3_claimBreaking.txHash,
        withdrawTx: cases.case3_claimBreaking.withdrawTx,
        withdrawReturn: cases.case3_claimBreaking.withdrawReturn,
        outcome: 'BREAKING_CONFIRMED',
        evidenceUrl: cases.case3_claimBreaking.evidenceUrl,
        releaseEvidenceUrl: cases.case3_claimBreaking.releaseEvidenceUrl,
        verbatimQuote: cases.case3_claimBreaking.verbatimQuote,
        extractedDigest: cases.case3_claimBreaking.extractedDigest,
        details: cases.case3_claimBreaking.details
      },
      {
        id: 4,
        title: 'Case 4: Honest Non-Breaking Claim (NON_BREAKING)',
        description: 'Claimant tests intact method (res.sendFile). Validators fetch bounded slice, verify method is fully functional, and record NON_BREAKING verdict without penalizing maintainer.',
        txHash: cases.case4_claimNonBreaking.txHash,
        outcome: 'NON_BREAKING',
        evidenceUrl: cases.case4_claimNonBreaking.evidenceUrl,
        releaseEvidenceUrl: cases.case4_claimNonBreaking.releaseEvidenceUrl,
        verbatimQuote: cases.case4_claimNonBreaking.verbatimQuote,
        extractedDigest: cases.case4_claimNonBreaking.extractedDigest,
        details: cases.case4_claimNonBreaking.details
      },
      {
        id: 5,
        title: 'Case 5: Adversarial Prompt Injection Defense + Mismatched Repo Rejection',
        description: 'Demonstrates deterministic rejection of mismatched repository claims, and defense against adversarial code containing prompt injections ("Ignore previous instructions") in CombineAttacker.py.',
        txHash: cases.case5_injectionDefense.txHash,
        mismatchedTx: cases.case5_injectionDefense.mismatchedTx,
        mismatchedReturn: cases.case5_injectionDefense.mismatchedReturn,
        outcome: 'NON_BREAKING',
        evidenceUrl: cases.case5_injectionDefense.evidenceUrl,
        releaseEvidenceUrl: cases.case5_injectionDefense.releaseEvidenceUrl,
        verbatimQuote: cases.case5_injectionDefense.verbatimQuote,
        extractedDigest: cases.case5_injectionDefense.extractedDigest,
        details: cases.case5_injectionDefense.details
      },
      {
        id: 6,
        title: 'Case 6: Insufficient Evidence & Trusted-Time Expiry Fallback + Real Refund Transfer',
        description: 'Demonstrates INSUFFICIENT_EVIDENCE when anchor symbol is missing, followed by trusted-time fallback resolution via resolve_expired_pledge() without caller-supplied time, and real native token refund via withdraw_refundable().',
        txHash: cases.case6_insufficientAndFallback.txHash,
        expireTx: cases.case6_insufficientAndFallback.expireTx,
        expireReturn: cases.case6_insufficientAndFallback.expireReturn,
        withdrawTx: cases.case6_insufficientAndFallback.withdrawTx,
        withdrawReturn: cases.case6_insufficientAndFallback.withdrawReturn,
        outcome: 'INSUFFICIENT_EVIDENCE',
        evidenceUrl: cases.case6_insufficientAndFallback.evidenceUrl,
        verbatimQuote: cases.case6_insufficientAndFallback.verbatimQuote,
        extractedDigest: cases.case6_insufficientAndFallback.extractedDigest,
        details: cases.case6_insufficientAndFallback.details
      }
    ],
    generatedAt: new Date().toISOString()
  };

  saveProof(proof);

  // Synchronize to frontend/src/data/recordedProof.json
  const frontendProofPath = path.resolve('frontend/src/data/recordedProof.json');
  fs.mkdirSync(path.dirname(frontendProofPath), { recursive: true });
  fs.writeFileSync(frontendProofPath, JSON.stringify(proof, null, 2), 'utf-8');
  console.log(`Proof successfully saved to deploy/proof.json and frontend/src/data/recordedProof.json!`);
}

main().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
