import fs from 'node:fs';
import path from 'node:path';
import { getStudioClient, saveState, loadState, waitForFinality } from './lib/studio_client.mjs';

async function main() {
  console.log('=== Step 2: Deploy Main DeprecateGuard Contract ===');
  const { client, account } = getStudioClient();
  console.log(`Using Deployer Account: ${account.address}`);

  const state = loadState();
  if (state.mainContractAddress) {
    console.log(`DeprecateGuard already deployed at: ${state.mainContractAddress}`);
    return;
  }

  const contractPath = path.resolve('contracts/deprecate_guard.py');
  const code = fs.readFileSync(contractPath, 'utf-8');
  console.log(`Deploying deprecate_guard.py (${code.length} bytes)...`);

  const deployTx = await client.deployContract({ code });
  console.log(`Deploy Transaction Hash: ${deployTx}`);
  saveState({ mainDeployTx: deployTx });

  const finality = await waitForFinality(client, deployTx);
  const contractAddress = finality.contractAddress;
  console.log(`DeprecateGuard Contract Finalized on StudioNet at: ${contractAddress}`);
  saveState({ mainContractAddress: contractAddress });

  console.log('=== DeprecateGuard Main Contract Deployed Successfully ===');
}

main().catch(err => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
