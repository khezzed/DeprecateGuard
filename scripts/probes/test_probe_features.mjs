import fs from 'node:fs';
import path from 'node:path';
import { getStudioClient, waitForFinality } from './lib/studio_client.mjs';

async function main() {
  console.log('--- Probing StudioNet Features: datetime & emit_transfer ---');
  const { client, account } = getStudioClient();
  console.log(`Account: ${account.address}`);

  const code = fs.readFileSync(path.resolve('contracts/probe_features.py'), 'utf-8');
  console.log('Deploying probe_features.py...');
  const deployTx = await client.deployContract({ code });
  console.log(`Deploy tx: ${deployTx}`);

  const deployFinal = await waitForFinality(client, deployTx);
  const probeAddress = deployFinal.contractAddress;
  console.log(`Probe contract deployed at: ${probeAddress}`);

  console.log('\nTesting test_time_and_deposit with value = 1n...');
  const txTime = await client.writeContract({
    address: probeAddress,
    functionName: 'test_time_and_deposit',
    args: [],
    value: 1n
  });
  console.log(`Time tx: ${txTime}`);
  const timeFinal = await waitForFinality(client, txTime);
  console.log(`Time return: ${timeFinal.returnReadable}`);

  console.log('\nTesting test_transfer with amount = 1...');
  const txTransfer = await client.writeContract({
    address: probeAddress,
    functionName: 'test_transfer',
    args: [1]
  });
  console.log(`Transfer tx: ${txTransfer}`);
  const transferFinal = await waitForFinality(client, txTransfer);
  console.log(`Transfer return: ${transferFinal.returnReadable}`);

  const infoRaw = await client.readContract({
    address: probeAddress,
    functionName: 'get_info',
    args: []
  });
  console.log(`Info read: ${infoRaw}`);
}

main().catch(err => {
  console.error('Feature probe failed:', err);
  process.exit(1);
});
