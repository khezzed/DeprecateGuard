import { createClient, chains, createAccount, generatePrivateKey } from 'genlayer-js';

export const STUDIONET_CHAIN_ID = 61999;
export const STUDIONET_CHAIN_ID_HEX = '0xf22f';
export const STUDIONET_RPC_URL = 'https://studio.genlayer.com/api';
export const STUDIONET_EXPLORER_URL = 'https://explorer-studio.genlayer.com';
export const MAIN_CONTRACT_ADDRESS = '0x9D8830F4A62d37D9Ca346e3f2D54b512B228fc4d';

const GITHUB_RAW_REGEX = /^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/([0-9a-fA-F]{40})\/.+$/;
const ARCHIVE_ORG_RAW_REGEX = /^https:\/\/web\.archive\.org\/web\/(\d{14})id_\/.+$/;

export function getReadOnlyStudioClient(rpcUrl = STUDIONET_RPC_URL) {
  return createClient({
    chain: {
      ...chains.studionet,
      rpcUrls: {
        default: {
          http: [rpcUrl]
        }
      }
    }
  });
}

/**
 * Returns a client and local signer account from browser localStorage.
 * Guarantees the displayed wallet address matches client.account.address exactly.
 */
export function getBrowserSessionClient(rpcUrl = STUDIONET_RPC_URL) {
  let pk = localStorage.getItem('deprecate_guard_session_pk');
  if (!pk || pk.length !== 66) {
    pk = generatePrivateKey();
    localStorage.setItem('deprecate_guard_session_pk', pk);
  }
  const account = createAccount(pk as `0x${string}`);
  const client = createClient({
    chain: {
      ...chains.studionet,
      rpcUrls: {
        default: {
          http: [rpcUrl]
        }
      }
    },
    account
  });
  return { client, account, address: account.address, mode: 'burner' as const };
}

/**
 * Returns a client bound to an injected EIP-1193 browser wallet (MetaMask).
 * Enforces that client.account is the connected address and window.ethereum signs writes.
 */
export async function getInjectedWalletClient(rpcUrl = STUDIONET_RPC_URL) {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('No injected browser wallet detected (window.ethereum).');
  }
  const provider = (window as any).ethereum;
  const accounts: string[] = await provider.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('No account authorized in browser wallet.');
  }
  const connectedAddress = accounts[0] as `0x${string}`;

  // Switch or add StudioNet chain
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: STUDIONET_CHAIN_ID_HEX }]
    });
  } catch (switchErr: any) {
    if (switchErr.code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: STUDIONET_CHAIN_ID_HEX,
          chainName: 'GenLayer StudioNet',
          nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
          rpcUrls: [rpcUrl],
          blockExplorerUrls: [STUDIONET_EXPLORER_URL]
        }]
      });
    }
  }

  const client = createClient({
    chain: {
      ...chains.studionet,
      rpcUrls: {
        default: {
          http: [rpcUrl]
        }
      }
    },
    account: connectedAddress,
    provider
  });

  return { client, address: connectedAddress, mode: 'injected' as const };
}

export function validateRepoAndPath(repoFullName: string, targetFilePath: string) {
  const repoRegex = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
  if (!repoRegex.test(repoFullName.trim())) {
    return { valid: false, message: 'Invalid repository name. Must be in owner/repo format.' };
  }
  const cleaned = targetFilePath.trim().replace(/^\/+/, '');
  if (!cleaned || cleaned.includes('..')) {
    return { valid: false, message: 'Invalid target file path. Relative path without .. required.' };
  }
  return { valid: true, message: 'Valid repository and file path.' };
}

export function validateImmutableEvidenceUrl(url: string): {
  valid: boolean;
  sourceType: string;
  message: string;
} {
  if (GITHUB_RAW_REGEX.test(url)) {
    const sha = url.match(GITHUB_RAW_REGEX)?.[1] || '';
    return {
      valid: true,
      sourceType: 'GITHUB_40HEX_SHA',
      message: `Valid immutable GitHub raw commit artifact (${sha.slice(0, 10)}...)`
    };
  }
  if (ARCHIVE_ORG_RAW_REGEX.test(url)) {
    const ts = url.match(ARCHIVE_ORG_RAW_REGEX)?.[1] || '';
    return {
      valid: true,
      sourceType: 'ARCHIVE_ORG_ID_RAW',
      message: `Valid immutable Archive.org id_ raw snapshot (${ts})`
    };
  }
  if (url.includes('web.archive.org/web/') && !url.includes('id_/')) {
    return {
      valid: false,
      sourceType: 'ARCHIVE_TOOLBAR_MUTABLE',
      message: 'Rejected: Archive.org URLs must use the "id_/" raw modifier to strip dynamic toolbars.'
    };
  }
  return {
    valid: false,
    sourceType: 'MUTABLE_URL',
    message: 'Rejected: Evidence URL must be a 40-hex commit SHA on raw.githubusercontent.com or an Archive.org id_ snapshot.'
  };
}
