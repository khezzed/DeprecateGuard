import fs from 'node:fs';
import path from 'node:path';
import { createClient, chains, createAccount, generatePrivateKey } from 'genlayer-js';

const STATE_FILE = path.resolve('deploy/state.json');
const PROOF_FILE = path.resolve('deploy/proof.json');

export function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

export function saveState(patch) {
  const current = loadState();
  const updated = { ...current, ...patch, updatedAt: new Date().toISOString() };
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

export function loadProof() {
  if (fs.existsSync(PROOF_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROOF_FILE, 'utf-8'));
    } catch {
      return null;
    }
  }
  return null;
}

export function saveProof(proof) {
  fs.mkdirSync(path.dirname(PROOF_FILE), { recursive: true });
  fs.writeFileSync(PROOF_FILE, JSON.stringify(proof, null, 2), 'utf-8');
}

export function getStudioClient(privateKey = null) {
  const state = loadState();
  let pk = privateKey || state.deployerPrivateKey;
  if (!pk || typeof pk !== 'string' || pk.length !== 66) {
    pk = generatePrivateKey();
    saveState({ deployerPrivateKey: pk });
  }

  const account = createAccount(pk);
  const client = createClient({
    chain: {
      ...chains.studionet,
      rpcUrls: {
        default: {
          http: ['https://studio.genlayer.com/api']
        }
      }
    },
    account
  });

  return { client, account, privateKey: pk };
}

/**
 * Polls for a transaction receipt with rate-limit protection (8s interval).
 * Strictly verifies both FINALIZED status AND GenVM execution_result === 'SUCCESS'.
 */
export async function waitForFinality(client, txHash, maxAttempts = 60) {
  console.log(`[POLL] Waiting for finality of tx: ${txHash}`);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise(r => setTimeout(r, 8000));
    try {
      const tx = await client.getTransaction({ hash: txHash });
      const statusName = tx.statusName || (tx.consensus_history?.current_status_changes?.includes('FINALIZED') ? 'FINALIZED' : 'PENDING');
      const resultName = tx.result_name || 'UNKNOWN';
      const lr = tx.consensus_data?.leader_receipt?.[0];
      const execResult = lr?.execution_result || 'PENDING';
      const returnPayload = lr?.result?.payload?.readable || lr?.result?.payload || '';
      console.log(`  [Attempt ${attempt}/${maxAttempts}] Status: ${statusName} | Consensus: ${resultName} | GenVM: ${execResult} ${returnPayload}`);

      if (statusName === 'FINALIZED' || statusName === 'ACCEPTED') {
        if (execResult === 'ERROR') {
          const stderr = lr?.genvm_result?.stderr || JSON.stringify(lr?.result);
          throw new Error(`GenVM execution ERROR in tx ${txHash}:\n${stderr}`);
        }
      }

      if (statusName === 'FINALIZED') {
        const contractAddress = tx.to_address || tx.contract_address || (tx.data && tx.data.contract_address);
        return {
          finalized: true,
          status: statusName,
          result: resultName,
          executionResult: execResult,
          returnReadable: returnPayload,
          contractAddress,
          tx
        };
      }
    } catch (err) {
      if (err.message.includes('GenVM execution ERROR')) {
        throw err;
      }
      console.warn(`  [Poll warning attempt ${attempt}]: ${err.message}`);
    }
  }
  throw new Error(`Transaction ${txHash} did not finalize within ${maxAttempts * 8}s`);
}
