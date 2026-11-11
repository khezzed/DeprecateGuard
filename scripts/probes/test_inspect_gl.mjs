import fs from 'node:fs';
import path from 'node:path';
import { getStudioClient, waitForFinality } from './lib/studio_client.mjs';

async function main() {
  const { client, account } = getStudioClient();
  const code = fs.readFileSync(path.resolve('contracts/probe_gl_attrs.py'), 'utf-8');
  console.log('Deploying probe_gl_attrs.py...');
  const deployTx = await client.deployContract({ code });
  const deployFinal = await waitForFinality(client, deployTx);
  const addr = deployFinal.contractAddress;
  console.log(`ProbeGlAttrs at: ${addr}`);

  const info = await client.readContract({
    address: addr,
    functionName: 'inspect_gl',
    args: []
  });
  console.log('Attrs:', JSON.stringify(JSON.parse(info), null, 2));
}

main().catch(console.error);
