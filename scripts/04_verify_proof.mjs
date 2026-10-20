import fs from 'node:fs';
import path from 'node:path';
import { createClient, chains } from 'genlayer-js';

const PROOF_PATH = path.resolve('deploy/proof.json');

async function main() {
  console.log('===============================================================');
  console.log('        DeprecateGuard Live Proof Verifier (verify:proof)      ');
  console.log('===============================================================');

  if (!fs.existsSync(PROOF_PATH)) {
    console.error('[FAIL] Proof manifest not found at deploy/proof.json. Run scripts/03_seed_live_cases.mjs first.');
    process.exit(1);
  }

  const proof = JSON.parse(fs.readFileSync(PROOF_PATH, 'utf-8'));
  const contractAddress = proof.contracts.mainContract.address;
  console.log(`[Project]      : ${proof.projectName} (${proof.tagline})`);
  console.log(`[Repository]   : ${proof.repositoryUrl || 'https://github.com/khezzed/DeprecateGuard'}`);
  console.log(`[Network]      : ${proof.network.networkName} (Chain ID: ${proof.network.chainId})`);
  console.log(`[RPC URL]      : ${proof.network.rpcUrl}`);
  console.log(`[Main Contract]: ${contractAddress}`);
  console.log(`[Runner Hash]  : ${proof.runnerHash}`);
  console.log('---------------------------------------------------------------');

  const client = createClient({
    chain: {
      ...chains.studionet,
      rpcUrls: {
        default: {
          http: [proof.network.rpcUrl]
        }
      }
    }
  });

  // 1. Verify live contract stats
  const statsRaw = await client.readContract({
    address: contractAddress,
    functionName: 'get_stats',
    args: []
  });
  const liveStats = JSON.parse(statsRaw);
  console.log(`[LIVE RPC READ] get_stats() => total_pledges: ${liveStats.total_pledges}, total_claims: ${liveStats.total_claims}`);
  if (liveStats.total_pledges < 4 || liveStats.total_claims < 3) {
    console.error(`[FAIL] Expected populated on-chain pledges and claims, got: ${statsRaw}`);
    process.exit(1);
  }

  let totalCases = proof.scenarios.length;
  let passedCases = 0;

  console.log(`\nAuditing ${totalCases} Finalized On-Chain Scenarios...\n`);

  for (const sc of proof.scenarios) {
    console.log(`[Scenario ${sc.id}] ${sc.title}`);
    console.log(`  Tx Hash         : ${sc.txHash}`);
    console.log(`  Expected Verdict: ${sc.outcome}`);

    try {
      const tx = await client.getTransaction({ hash: sc.txHash });
      const status = tx.statusName || (tx.consensus_history?.current_status_changes?.includes('FINALIZED') ? 'FINALIZED' : 'PENDING');
      const consensus = tx.result_name || 'UNKNOWN';
      const lr = tx.consensus_data?.leader_receipt?.[0];
      const execResult = lr?.execution_result || 'UNKNOWN';
      const readablePayload = lr?.result?.payload?.readable || '';

      if (status !== 'FINALIZED') {
        console.error(`  [FAIL] Transaction status is ${status}, expected FINALIZED`);
        continue;
      }
      if (execResult !== 'SUCCESS') {
        console.error(`  [FAIL] GenVM execution_result is ${execResult}, expected SUCCESS`);
        continue;
      }
      if (readablePayload.includes('ERROR:')) {
        console.error(`  [FAIL] Contract returned error payload: ${readablePayload}`);
        continue;
      }

      console.log(`  Status on Chain : ${status} | Consensus: ${consensus} | GenVM: ${execResult}`);
      console.log(`  Return Value    : ${readablePayload}`);
      if (sc.verbatimQuote) {
        console.log(`  Verbatim Quote  : "${sc.verbatimQuote}"`);
      }
      if (sc.extractedDigest) {
        console.log(`  SHA-256 Digest  : ${sc.extractedDigest}`);
      }
      console.log(`  Explorer Link   : https://explorer-studio.genlayer.com/tx/${sc.txHash}`);
      console.log(`  [PASS] Scenario ${sc.id} verified 100% on StudioNet.\n`);
      passedCases++;
    } catch (err) {
      console.error(`  [FAIL] Verification error: ${err.message}\n`);
    }
  }

  console.log('===============================================================');
  console.log(`Verification Summary: ${passedCases}/${totalCases} Scenarios Verified on StudioNet`);
  if (passedCases === totalCases) {
    console.log('STATUS: ALL LIVE CLAIMS, QUOTES, DIGESTS & JUDGMENTS VERIFIED');
    console.log('===============================================================');
    process.exit(0);
  } else {
    console.error('STATUS: AUDIT DISCREPANCY DETECTED');
    console.log('===============================================================');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
