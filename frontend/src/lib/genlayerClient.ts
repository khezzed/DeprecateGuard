import { createClient, chains, createAccount, generatePrivateKey } from 'genlayer-js';

export const STUDIONET_CHAIN_ID = 61999;
export const STUDIONET_RPC_URL = 'https://studio.genlayer.com/api';
export const STUDIONET_EXPLORER_URL = 'https://explorer-studio.genlayer.com';

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
  return { client, account };
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
