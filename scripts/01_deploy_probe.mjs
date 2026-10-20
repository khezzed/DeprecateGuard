import fs from 'node:fs';
import path from 'node:path';
import { getStudioClient, saveState, loadState, waitForFinality } from './lib/studio_client.mjs';

const PINNED_EXPRESS_URL = 'https://raw.githubusercontent.com/expressjs/express/8368dc178af16b91b576c4c1d135f701a0007e5d/lib/response.js';

async function main() {
  console.log('=== Step 1: Deploy & Run Evidence Probe Contract ===');
  const { client, account } = getStudioClient();
  console.log(`Using Deployer Account: ${account.address}`);

  const state = loadState();
  let probeAddress = state.probeContractAddress;

  if (!probeAddress) {
    const contractPath = path.resolve('contracts/probe_evidence.py');
    const code = fs.readFileSync(contractPath, 'utf-8');
    console.log(`Deploying probe_evidence.py (${code.length} bytes)...`);

    const deployTx = await client.deployContract({ code });
    console.log(`Probe Deploy Tx Hash: ${deployTx}`);
    saveState({ probeDeployTx: deployTx });

    const finality = await waitForFinality(client, deployTx);
    probeAddress = finality.contractAddress;
    console.log(`Probe Contract Finalized at: ${probeAddress}`);
    saveState({ probeContractAddress: probeAddress });
  } else {
    console.log(`Using existing probe contract at: ${probeAddress}`);
  }

  // Probe the pinned evidence URL
  console.log(`Invoking probe_url with pinned evidence: ${PINNED_EXPRESS_URL}`);
  const callTx = await client.writeContract({
    address: probeAddress,
    functionName: 'probe_url',
    args: [PINNED_EXPRESS_URL]
  });
  console.log(`Probe writeContract Tx Hash: ${callTx}`);
  saveState({ probeCallTx: callTx });

  const finalityCall = await waitForFinality(client, callTx);
  console.log(`Probe Call Finalized with Result: ${finalityCall.result}`);

  // Read back the result
  const result = await client.readContract({
    address: probeAddress,
    functionName: 'get_probe_result',
    args: []
  });
  console.log(`Probe On-Chain State: ${result}`);
  saveState({ probeOnChainResult: result });

  console.log('=== Evidence Prober Verified on StudioNet! ===');
}

main().catch(err => {
  console.error('Probe failed:', err);
  process.exit(1);
});
