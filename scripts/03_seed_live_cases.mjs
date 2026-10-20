import fs from 'node:fs';
import { getStudioClient, saveState, loadState, saveProof, waitForFinality } from './lib/studio_client.mjs';

const PINNED_EXPRESS_URL = 'https://raw.githubusercontent.com/expressjs/express/8368dc178af16b91b576c4c1d135f701a0007e5d/lib/response.js';
const PINNED_INJECTION_URL = 'https://raw.githubusercontent.com/liu00222/Open-Prompt-Injection/fbed5cca347488f88363790ae3ae97c56116da6a/OpenPromptInjection/attackers/CombineAttacker.py';

async function main() {
  console.log('=== Step 3: Seeding Live Real Historical Demo Scenarios on StudioNet ===');
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
  // Case 1: Valid Pledge Creation (RuleGate ACCEPTED)
  // --------------------------------------------------------------------------
  if (!cases.case1_pledgeValid) {
    console.log('\n--- Case 1: Submitting Objective Pledge (Express res.sendFile) ---');
    const clause = 'In Express.js lib/response.js, the res.sendFile(path, options, callback) method must exist and accept (path, options, callback) arguments without being removed.';
    const tx = await client.writeContract({
      address: contractAddress,
      functionName: 'create_pledge',
      args: ['express', clause, 2592000, 86400],
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
  // Case 2: Vague Pledge Rejection (RuleGate REJECTED_VAGUE) + Refund Withdrawal
  // --------------------------------------------------------------------------
  if (!cases.case2_pledgeVague) {
    console.log('\n--- Case 2: Submitting Subjective/Vague Pledge ---');
    const vagueClause = 'We promise our API will always stay modern, ergonomic, fast, and developer-friendly for everyone.';
    const tx = await client.writeContract({
      address: contractAddress,
      functionName: 'create_pledge',
      args: ['express-vague', vagueClause, 2592000, 86400],
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

    console.log('Executing withdraw_refundable() to reclaim rejected deposit...');
    const withdrawTx = await client.writeContract({
      address: contractAddress,
      functionName: 'withdraw_refundable',
      args: []
    });
    await waitForFinality(client, withdrawTx);

    cases.case2_pledgeVague = {
      txHash: tx,
      withdrawTx,
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
  // Case 3: Breaking Change Claim (BREAKING_CONFIRMED) + Bond Settlement
  // --------------------------------------------------------------------------
  if (!cases.case3_claimBreaking) {
    console.log('\n--- Case 3: Creating Legacy sendfile Pledge & Filing Breaking Claim ---');
    const legacyClause = 'In Express.js lib/response.js, the legacy res.sendfile (lowercase f) method must NOT be deprecated or wrapped in deprecate.function.';
    const pledgeTx = await client.writeContract({
      address: contractAddress,
      functionName: 'create_pledge',
      args: ['express-legacy', legacyClause, 2592000, 86400],
      value: 1n
    });
    await waitForFinality(client, pledgeTx);

    console.log('Claimant submitting breaking change claim against Express 4.18.2 pinned commit...');
    const claimTx = await client.writeContract({
      address: contractAddress,
      functionName: 'submit_and_judge_claim',
      args: [3, PINNED_EXPRESS_URL, 'res.sendfile =']
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

    cases.case3_claimBreaking = {
      pledgeTx,
      txHash: claimTx,
      returnReadable: finality.returnReadable,
      expected: 'BREAKING_CONFIRMED',
      actual: claimObj.verdict,
      evidenceUrl: PINNED_EXPRESS_URL,
      verbatimQuote: claimObj.verbatim_quote,
      extractedDigest: claimObj.extracted_digest,
      details: claimObj
    };
    saveState({ cases });
  } else {
    console.log('[SKIP] Case 3 already verified:', cases.case3_claimBreaking.txHash);
  }

  // --------------------------------------------------------------------------
  // Case 4: Honest Non-Breaking Claim Rejection (NON_BREAKING)
  // --------------------------------------------------------------------------
  if (!cases.case4_claimNonBreaking) {
    console.log('\n--- Case 4: Filing Non-Breaking Claim Against Intact Express res.sendFile ---');
    const claimTx = await client.writeContract({
      address: contractAddress,
      functionName: 'submit_and_judge_claim',
      args: [1, PINNED_EXPRESS_URL, 'res.sendFile = function sendFile']
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
      verbatimQuote: claimObj.verbatim_quote,
      extractedDigest: claimObj.extracted_digest,
      details: claimObj
    };
    saveState({ cases });
  } else {
    console.log('[SKIP] Case 4 already verified:', cases.case4_claimNonBreaking.txHash);
  }

  // --------------------------------------------------------------------------
  // Case 5: Adversarial Prompt Injection Defense (NON_BREAKING)
  // --------------------------------------------------------------------------
  if (!cases.case5_injectionDefense) {
    console.log('\n--- Case 5: Testing Adversarial Prompt Injection Defense (Real Pinned File Containing "Ignore previous instructions") ---');
    const injectClause = 'In OpenPromptInjection CombineAttacker.py, the inject(self, clean_data, idx, target_task) method must continue to exist and accept (self, clean_data, idx, target_task) arguments.';
    const pledgeTx = await client.writeContract({
      address: contractAddress,
      functionName: 'create_pledge',
      args: ['open-prompt-injection', injectClause, 2592000, 86400],
      value: 1n
    });
    await waitForFinality(client, pledgeTx);

    console.log('Submitting claim against CombineAttacker.py (contains literal "Ignore previous instructions" inside code)...');
    const claimTx = await client.writeContract({
      address: contractAddress,
      functionName: 'submit_and_judge_claim',
      args: [4, PINNED_INJECTION_URL, 'def inject(self, clean_data, idx, target_task):']
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
      pledgeTx,
      txHash: claimTx,
      returnReadable: finality.returnReadable,
      expected: 'NON_BREAKING',
      actual: claimObj.verdict,
      evidenceUrl: PINNED_INJECTION_URL,
      verbatimQuote: claimObj.verbatim_quote,
      extractedDigest: claimObj.extracted_digest,
      details: claimObj
    };
    saveState({ cases });
  } else {
    console.log('[SKIP] Case 5 already verified:', cases.case5_injectionDefense.txHash);
  }

  // --------------------------------------------------------------------------
  // Case 6: INSUFFICIENT_EVIDENCE & Deterministic Deadline Fallback
  // --------------------------------------------------------------------------
  if (!cases.case6_insufficientAndFallback) {
    console.log('\n--- Case 6: Testing INSUFFICIENT_EVIDENCE & Deterministic Deadline Fallback ---');
    const claimTx = await client.writeContract({
      address: contractAddress,
      functionName: 'submit_and_judge_claim',
      args: [1, PINNED_EXPRESS_URL, 'nonExistentFunctionSymbol_XYZ_999']
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

    console.log('Executing resolve_expired_pledge(1, 1796000000) to prove deterministic deadline fallback...');
    const expireTx = await client.writeContract({
      address: contractAddress,
      functionName: 'resolve_expired_pledge',
      args: [1, 1796000000]
    });
    await waitForFinality(client, expireTx);

    cases.case6_insufficientAndFallback = {
      txHash: claimTx,
      expireTx,
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

  const proofManifest = {
    projectName: 'DeprecateGuard',
    tagline: 'API Breaking-Change & Deprecation Pledge Bond on GenLayer',
    repositoryUrl: 'https://github.com/khezzed/DeprecateGuard',
    network: {
      chainId: 61999,
      networkName: 'GenLayer StudioNet',
      rpcUrl: 'https://studio.genlayer.com/api',
      explorerUrl: 'https://explorer-studio.genlayer.com'
    },
    runnerHash: 'py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6',
    contracts: {
      probeContract: {
        address: state.probeContractAddress || '0xE735D4d659Ec0ED69e491C3262d517c81E6Aa88F',
        deployTx: state.probeDeployTx,
        probeCallTx: state.probeCallTx,
        evidenceSampleUrl: PINNED_EXPRESS_URL,
        onChainResult: state.probeOnChainResult
      },
      mainContract: {
        address: contractAddress,
        deployTx: state.mainDeployTx,
        liveStats
      }
    },
    scenarios: [
      {
        id: 1,
        title: 'Case 1: Objective Pledge Creation (RuleGate ACCEPTED)',
        description: 'Maintainer locks a stability pledge bond for Express.js res.sendFile(path, options, callback). Validators run the RuleGate LLM check, confirm the commitment is concrete and observable, freeze the SHA-256 clause digest, and open the pledge.',
        txHash: cases.case1_pledgeValid.txHash,
        outcome: cases.case1_pledgeValid.actual,
        evidenceUrl: cases.case1_pledgeValid.evidenceUrl,
        verbatimQuote: cases.case1_pledgeValid.verbatimQuote,
        extractedDigest: cases.case1_pledgeValid.extractedDigest,
        details: cases.case1_pledgeValid.details
      },
      {
        id: 2,
        title: 'Case 2: Subjective Pledge Rejection (RuleGate REJECTED_VAGUE + Refund)',
        description: 'Maintainer submits a vague promise ("modern, ergonomic, fast, and developer-friendly"). Validators reject it up front via RuleGate, credit the deposit to refundable_balances, and the maintainer withdraws the refund on-chain.',
        txHash: cases.case2_pledgeVague.txHash,
        withdrawTx: cases.case2_pledgeVague.withdrawTx,
        outcome: cases.case2_pledgeVague.actual,
        evidenceUrl: cases.case2_pledgeVague.evidenceUrl,
        verbatimQuote: cases.case2_pledgeVague.verbatimQuote,
        extractedDigest: cases.case2_pledgeVague.extractedDigest,
        details: cases.case2_pledgeVague.details
      },
      {
        id: 3,
        title: 'Case 3: Breaking Change Confirmed (BREAKING_CONFIRMED & Bond Payout)',
        description: 'Claimant submits pinned Express 4.18.2 commit (8368dc17...) proving legacy res.sendfile is wrapped in deprecate.function. Validators verify the SHA-256 slice digest, confirm the verbatim quote exists in their own fetched bytes, and settle the bond.',
        txHash: cases.case3_claimBreaking.txHash,
        pledgeTx: cases.case3_claimBreaking.pledgeTx,
        outcome: cases.case3_claimBreaking.actual,
        evidenceUrl: cases.case3_claimBreaking.evidenceUrl,
        verbatimQuote: cases.case3_claimBreaking.verbatimQuote,
        extractedDigest: cases.case3_claimBreaking.extractedDigest,
        details: cases.case3_claimBreaking.details
      },
      {
        id: 4,
        title: 'Case 4: Honest Non-Breaking Claim Rejection (NON_BREAKING)',
        description: 'Claimant files a claim against intact res.sendFile(path, options, callback). Validators fetch the pinned commit, verify the verbatim signature quote, and unanimously reject the claim as NON_BREAKING.',
        txHash: cases.case4_claimNonBreaking.txHash,
        outcome: cases.case4_claimNonBreaking.actual,
        evidenceUrl: cases.case4_claimNonBreaking.evidenceUrl,
        verbatimQuote: cases.case4_claimNonBreaking.verbatimQuote,
        extractedDigest: cases.case4_claimNonBreaking.extractedDigest,
        details: cases.case4_claimNonBreaking.details
      },
      {
        id: 5,
        title: 'Case 5: Adversarial Prompt Injection Defense (NON_BREAKING)',
        description: 'Claimant submits pinned Open-Prompt-Injection CombineAttacker.py commit (fbed5cca...) which contains literal "Ignore previous instructions." inside the fetched source code. Validators sandbox the untrusted evidence, ignore the injection, and return NON_BREAKING.',
        txHash: cases.case5_injectionDefense.txHash,
        pledgeTx: cases.case5_injectionDefense.pledgeTx,
        outcome: cases.case5_injectionDefense.actual,
        evidenceUrl: cases.case5_injectionDefense.evidenceUrl,
        verbatimQuote: cases.case5_injectionDefense.verbatimQuote,
        extractedDigest: cases.case5_injectionDefense.extractedDigest,
        details: cases.case5_injectionDefense.details
      },
      {
        id: 6,
        title: 'Case 6: Insufficient Evidence & Deadline Fallback (INSUFFICIENT_EVIDENCE)',
        description: 'Claimant queries an absent symbol, finalizing as INSUFFICIENT_EVIDENCE. Then resolve_expired_pledge() executes after expires_at + grace_period, deterministically unlocking the maintainer bond so funds never lock forever.',
        txHash: cases.case6_insufficientAndFallback.txHash,
        expireTx: cases.case6_insufficientAndFallback.expireTx,
        outcome: cases.case6_insufficientAndFallback.actual,
        evidenceUrl: cases.case6_insufficientAndFallback.evidenceUrl,
        verbatimQuote: cases.case6_insufficientAndFallback.verbatimQuote,
        extractedDigest: cases.case6_insufficientAndFallback.extractedDigest,
        details: cases.case6_insufficientAndFallback.details
      }
    ],
    verifiedAt: new Date().toISOString()
  };

  saveProof(proofManifest);
  fs.writeFileSync('frontend/src/data/recordedProof.json', JSON.stringify(proofManifest, null, 2), 'utf-8');
  console.log('Proof manifest saved to deploy/proof.json and synced to frontend/src/data/recordedProof.json!');
}

main().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
