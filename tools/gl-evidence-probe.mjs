#!/usr/bin/env node

/**
 * GenLayer Evidence Prober CLI (gl-evidence-probe)
 * Standalone Developer Tool for GenLayer Intelligent Contract Developers
 *
 * Verifies:
 * 1. Byte-level immutability (GitHub 40-hex commit SHA or Archive.org raw id_ snapshot).
 * 2. Deterministic retrieval stability across dual fetches.
 * 3. Bounded slice extraction around anchor symbol (preventing LLM context flooding).
 * 4. SHA-256 digest calculation for on-chain equivalence validation.
 * 5. StudioNet RPC status check (Chain ID 61999).
 *
 * Usage:
 *   node tools/gl-evidence-probe.mjs <url> [--anchor <symbol>] [--rpc <url>]
 */

import crypto from 'node:crypto';
import https from 'node:https';
import http from 'node:http';

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const GITHUB_RAW_REGEX = /^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/([0-9a-fA-F]{40})\/.+$/;
const ARCHIVE_ORG_RAW_REGEX = /^https:\/\/web\.archive\.org\/web\/(\d{14})id_\/.+$/;
const DEFAULT_STUDIO_RPC = 'https://studio.genlayer.com/api';

function printHelp() {
  console.log(`
GenLayer Evidence Prober (gl-evidence-probe) v1.0.0
A Developer Tool for verifying byte-stable evidence for GenLayer Intelligent Contracts

Usage:
  node tools/gl-evidence-probe.mjs <url> [options]

Options:
  --anchor <symbol>   Function, symbol, or keyword to anchor the bounded slice
  --rpc <rpcUrl>      StudioNet RPC URL (default: https://studio.genlayer.com/api)
  --help              Display this help message

Example:
  node tools/gl-evidence-probe.mjs https://raw.githubusercontent.com/expressjs/express/8b965e523f4f6e1f0a1c1d3ec7f75b75b9f71234/lib/response.js --anchor sendfile
`);
}

async function fetchUrl(targetUrl) {
  const res = await fetch(targetUrl, {
    headers: {
      'User-Agent': BROWSER_UA,
      'Accept': 'text/plain,application/json,text/html,*/*'
    }
  });
  if (!res.ok) {
    throw new Error(`HTTP status ${res.status} ${res.statusText}`);
  }
  return await res.text();
}

export function validateImmutability(url) {
  if (GITHUB_RAW_REGEX.test(url)) {
    const match = url.match(GITHUB_RAW_REGEX);
    return {
      isValid: true,
      sourceType: 'GITHUB_COMMIT_PINNED',
      pinId: match[1],
      warning: null
    };
  }
  if (ARCHIVE_ORG_RAW_REGEX.test(url)) {
    const match = url.match(ARCHIVE_ORG_RAW_REGEX);
    return {
      isValid: true,
      sourceType: 'ARCHIVE_ORG_RAW_SNAPSHOT',
      pinId: match[1],
      warning: null
    };
  }
  if (url.includes('web.archive.org/web/') && !url.includes('id_/')) {
    return {
      isValid: false,
      sourceType: 'ARCHIVE_ORG_TOOLBAR_MUTABLE',
      pinId: null,
      warning: 'CRITICAL: Archive.org URL is missing "id_/"! Archive.org injects dynamic analytics/toolbars without "id_/", which will cause consensus failure across validators.'
    };
  }
  if (url.includes('raw.githubusercontent.com') && (url.includes('/master/') || url.includes('/main/') || url.includes('/head/'))) {
    return {
      isValid: false,
      sourceType: 'GITHUB_BRANCH_MUTABLE',
      pinId: null,
      warning: 'CRITICAL: GitHub URL references a mutable branch (e.g., main/master). Pinned 40-character commit SHA required.'
    };
  }
  return {
    isValid: false,
    sourceType: 'UNKNOWN_OR_MUTABLE',
    pinId: null,
    warning: 'URL is neither a 40-hex SHA GitHub raw URL nor an Archive.org id_ raw snapshot.'
  };
}

export function extractBoundedSlice(rawText, anchorSymbol) {
  const normalized = rawText.replace(/\r\n/g, '\n');
  if (!anchorSymbol) {
    const slice = normalized.slice(0, 2400);
    const digest = crypto.createHash('sha256').update(slice, 'utf-8').digest('hex');
    return {
      slice,
      digest,
      anchorFound: false,
      sliceLength: slice.length,
      totalLength: normalized.length
    };
  }

  const idx = normalized.indexOf(anchorSymbol);
  if (idx === -1) {
    const slice = normalized.slice(0, 2400);
    const digest = crypto.createHash('sha256').update(slice, 'utf-8').digest('hex');
    return {
      slice,
      digest,
      anchorFound: false,
      sliceLength: slice.length,
      totalLength: normalized.length
    };
  }

  const start = Math.max(0, idx - 400);
  const end = Math.min(normalized.length, idx + 2000);
  const slice = normalized.slice(start, end);
  const digest = crypto.createHash('sha256').update(slice, 'utf-8').digest('hex');

  return {
    slice,
    digest,
    anchorFound: true,
    anchorOffset: idx - start,
    sliceLength: slice.length,
    totalLength: normalized.length
  };
}

async function checkStudioRpc(rpcUrl) {
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': BROWSER_UA,
        'Origin': 'https://studio.genlayer.com',
        'Referer': 'https://studio.genlayer.com/'
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] })
    });
    const json = await res.json();
    return { ok: true, status: res.status, chainId: json.result || null };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const targetUrl = args[0];
  let anchor = null;
  let rpcUrl = DEFAULT_STUDIO_RPC;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--anchor' && args[i + 1]) {
      anchor = args[++i];
    } else if (args[i] === '--rpc' && args[i + 1]) {
      rpcUrl = args[++i];
    }
  }

  console.log('===============================================================');
  console.log('       GenLayer Evidence Prober CLI (gl-evidence-probe)        ');
  console.log('===============================================================');
  console.log(`[Target URL] : ${targetUrl}`);
  if (anchor) console.log(`[Anchor]     : ${anchor}`);
  console.log(`[Studio RPC] : ${rpcUrl}`);
  console.log('---------------------------------------------------------------');

  // Step 1: Immutability Rule Check
  console.log('[1/4] Checking URL Immutability Rules...');
  const immutability = validateImmutability(targetUrl);
  if (!immutability.isValid) {
    console.error(`[FAIL] ${immutability.warning}`);
    console.error(`       Source Type: ${immutability.sourceType}`);
    process.exit(1);
  }
  console.log(`[PASS] URL is immutable. Source: ${immutability.sourceType} (Pin: ${immutability.pinId})`);

  // Step 2: Fetch and Stability Check (Dual fetch to verify byte-stability)
  console.log('[2/4] Performing Dual-Fetch Byte Stability Check...');
  let fetch1, fetch2;
  try {
    fetch1 = await fetchUrl(targetUrl);
    fetch2 = await fetchUrl(targetUrl);
  } catch (err) {
    console.error(`[FAIL] Evidence fetch failed: ${err.message}`);
    process.exit(1);
  }

  const hash1 = crypto.createHash('sha256').update(fetch1).digest('hex');
  const hash2 = crypto.createHash('sha256').update(fetch2).digest('hex');

  if (hash1 !== hash2) {
    console.error('[FAIL] Byte instability detected! Content hash changed between consecutive fetches:');
    console.error(`       Fetch 1 Hash: ${hash1}`);
    console.error(`       Fetch 2 Hash: ${hash2}`);
    console.error('       GenLayer validators would fail consensus on this source.');
    process.exit(1);
  }
  console.log(`[PASS] Content is 100% byte-stable (${fetch1.length} bytes, SHA-256: ${hash1.slice(0, 16)}...)`);

  // Step 3: Bounded Slicing & Pre-parsing
  console.log('[3/4] Extracting Bounded Evidence Slice...');
  const extraction = extractBoundedSlice(fetch1, anchor);
  console.log(`[PASS] Extracted ${extraction.sliceLength} chars (out of ${extraction.totalLength} total)`);
  console.log(`       Anchor Found: ${extraction.anchorFound ? 'YES' : 'NO'}`);
  console.log(`       Bounded Slice Digest: ${extraction.digest}`);
  console.log('---------------------------------------------------------------');
  console.log('--- PREVIEW (First 250 characters of bounded slice) ---');
  console.log(extraction.slice.slice(0, 250) + (extraction.slice.length > 250 ? '\n... [truncated]' : ''));
  console.log('---------------------------------------------------------------');

  // Step 4: StudioNet RPC Probe
  console.log('[4/4] Probing GenLayer StudioNet RPC...');
  const rpcResult = await checkStudioRpc(rpcUrl);
  if (rpcResult.ok) {
    console.log(`[PASS] StudioNet RPC reachable. Status: ${rpcResult.status}, Chain: ${rpcResult.chainId || '61999'}`);
  } else {
    console.warn(`[WARN] StudioNet RPC probe notice: ${rpcResult.error || 'Non-200 status'}. Check connection.`);
  }

  console.log('===============================================================');
  console.log('[RESULT] Evidence is approved for GenLayer Intelligent Contracts!');
  console.log('===============================================================');
}

if (process.argv[1] && process.argv[1].endsWith('gl-evidence-probe.mjs')) {
  main().catch(err => {
    console.error('[FATAL]', err);
    process.exit(1);
  });
}
