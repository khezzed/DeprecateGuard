import fs from 'node:fs';
import path from 'node:path';
import { getStudioClient, waitForFinality } from './lib/studio_client.mjs';

async function main() {
  const { client } = getStudioClient();
  const code = fs.readFileSync(path.resolve('contracts/probe_gl_attrs.py'), 'utf-8');
  console.log('Deploying updated probe_gl_attrs.py...');
  const deployTx = await client.deployContract({ code });
  const deployFinal = await waitForFinality(client, deployTx);
  const addr = deployFinal.contractAddress;
  console.log(`ProbeGlAttrs at: ${addr}`);

  const info = await client.readContract({
    address: addr,
    functionName: 'inspect_proxy',
    args: []
  });
  console.log('Proxy inspection:', JSON.stringify(JSON.parse(info), null, 2));
}

main().catch(console.error);
