import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, ExternalLink, ChevronDown, ChevronUp, SearchX } from 'lucide-react';
import { getReadOnlyStudioClient, STUDIONET_EXPLORER_URL } from '../lib/genlayerClient';
import {
  CodeEvidenceFrame,
  CopyButton,
  getOutcomeMeta,
  SURFACE_CARD,
  truncateHash
} from './ui';

interface Props {
  contractAddress: string;
  rpcUrl: string;
  recordedStats?: { total_pledges: number; total_claims: number };
}

const PLEDGE_CHIPS = [1, 2, 3, 4, 5];
const CLAIM_CHIPS = [1, 2, 3, 4];

export const LiveContractReader: React.FC<Props> = ({
  contractAddress,
  rpcUrl,
  recordedStats = { total_pledges: 5, total_claims: 4 }
}) => {
  const [liveStats, setLiveStats] = useState<{
    total_pledges: number;
    total_claims: number;
  } | null>(null);
  const [lookupType, setLookupType] = useState<'claim' | 'pledge'>('claim');
  const [lookupId, setLookupId] = useState('1');
  const [lookupData, setLookupData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [rpcError, setRpcError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  useEffect(() => {
    executeRecordLookup('claim', 1);
  }, []);

  const fetchLiveStats = async () => {
    setLoading(true);
    setRpcError(null);
    try {
      const client = getReadOnlyStudioClient(rpcUrl);
      const rawStats = await client.readContract({
        address: contractAddress as `0x${string}`,
        functionName: 'get_stats',
        args: []
      });
      const parsed = typeof rawStats === 'string' ? JSON.parse(rawStats) : rawStats;
      setLiveStats(parsed);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      setRpcError(err?.message || 'Could not reach StudioNet RPC');
    } finally {
      setLoading(false);
    }
  };

  const executeRecordLookup = async (type: 'pledge' | 'claim', idNum: number) => {
    setLookupType(type);
    setLookupId(String(idNum));
    setLoading(true);
    setRpcError(null);
    try {
      const client = getReadOnlyStudioClient(rpcUrl);
      const fnName = type === 'pledge' ? 'get_pledge' : 'get_claim';
      const rawRes = await client.readContract({
        address: contractAddress as `0x${string}`,
        functionName: fnName,
        args: [idNum]
      });
      const parsed = typeof rawRes === 'string' ? JSON.parse(rawRes) : rawRes;
      setLookupData(parsed);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      setRpcError(err?.message || 'Live query failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLiveLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeRecordLookup(lookupType, Number(lookupId));
  };

  const stats = liveStats || recordedStats;
  const statusLabel = lookupData ? lookupData.verdict || lookupData.status : '';
  const statusMeta = getOutcomeMeta(statusLabel);

  const specRows: { label: string; value: React.ReactNode }[] = lookupData
    ? [
        {
          label: 'Record Identifier',
          value: (
            <span className="font-mono text-zinc-100 tabular-nums">
              {lookupType === 'claim' ? `Claim #${lookupData.id}` : `Pledge #${lookupData.id}`}
            </span>
          )
        },
        ...(lookupData.pledge_id !== undefined
          ? [
              {
                label: 'Parent Pledge ID',
                value: (
                  <button
                    type="button"
                    onClick={() => executeRecordLookup('pledge', Number(lookupData.pledge_id))}
                    className="font-mono text-sky-400 hover:text-sky-300 underline-offset-2 hover:underline tabular-nums"
                  >
                    Pledge #{lookupData.pledge_id}
                  </button>
                )
              }
            ]
          : []),
        ...(lookupData.package_name
          ? [{ label: 'Package', value: <span className="font-mono">{lookupData.package_name}</span> }]
          : []),
        ...(lookupData.repo_full_name
          ? [
              {
                label: 'Repository',
                value: <span className="font-mono">{lookupData.repo_full_name}</span>
              }
            ]
          : []),
        ...(lookupData.target_file_path
          ? [
              {
                label: 'Target File',
                value: <span className="font-mono">{lookupData.target_file_path}</span>
              }
            ]
          : []),
        ...(lookupData.baseline_tag
          ? [
              {
                label: 'Baseline Tag',
                value: <span className="font-mono">{lookupData.baseline_tag}</span>
              }
            ]
          : []),
        ...(lookupData.release_tag
          ? [
              {
                label: 'Release Tag',
                value: <span className="font-mono">{lookupData.release_tag}</span>
              }
            ]
          : []),
        ...(lookupData.commit_sha
          ? [
              {
                label: 'Commit SHA',
                value: (
                  <span className="inline-flex items-center gap-2 font-mono">
                    <span>{truncateHash(lookupData.commit_sha, 10, 6)}</span>
                    <CopyButton text={lookupData.commit_sha} />
                  </span>
                )
              }
            ]
          : []),
        ...(lookupData.maintainer || lookupData.claimant
          ? [
              {
                label: lookupData.maintainer ? 'Maintainer' : 'Claimant',
                value: (
                  <span className="inline-flex items-center gap-2 font-mono">
                    <span>{truncateHash(lookupData.maintainer || lookupData.claimant, 8, 6)}</span>
                    <CopyButton text={lookupData.maintainer || lookupData.claimant} />
                  </span>
                )
              }
            ]
          : []),
        ...(lookupData.bond_wei !== undefined
          ? [
              {
                label: 'Bond Balance',
                value: <span className="font-mono tabular-nums">{lookupData.bond_wei} wei</span>
              }
            ]
          : []),
        ...(lookupData.payout_transferred_wei !== undefined
          ? [
              {
                label: 'Bounty Payout',
                value: (
                  <span className="font-mono tabular-nums">
                    {lookupData.payout_transferred_wei} wei
                  </span>
                )
              }
            ]
          : []),
        ...(lookupData.extracted_digest || lookupData.clause_sha256
          ? [
              {
                label: lookupData.extracted_digest ? 'Evidence SHA-256' : 'Clause SHA-256',
                value: (
                  <span className="inline-flex items-center gap-2 font-mono">
                    <span>
                      {truncateHash(lookupData.extracted_digest || lookupData.clause_sha256, 12, 8)}
                    </span>
                    <CopyButton text={lookupData.extracted_digest || lookupData.clause_sha256} />
                  </span>
                )
              }
            ]
          : [])
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-50 tracking-[-0.025em]">
            Live RPC Inspector
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Query deployed contract state directly via{' '}
            <code className="font-mono text-zinc-300 text-xs">{rpcUrl}</code> without a wallet.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLiveStats}
          disabled={loading}
          className="px-3.5 py-2 rounded-md bg-white hover:bg-zinc-200 text-black text-xs font-medium transition-colors inline-flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {liveStats ? `Synced (${lastRefreshed})` : 'Sync Live Contract Counts'}
        </button>
      </div>

      {/* Unified 3-Column Contract Telemetry Strip */}
      <section className={`${SURFACE_CARD} grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07]`}>
        <div className="p-4 space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
            Deployed Contract
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`${STUDIONET_EXPLORER_URL}/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono font-medium text-zinc-100 hover:text-white inline-flex items-center gap-1 tabular-nums"
            >
              {truncateHash(contractAddress, 8, 6)}
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </a>
            <CopyButton text={contractAddress} />
          </div>
        </div>

        <div className="p-4 space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
            Total Stability Pledges
          </div>
          <div className="text-xl font-semibold font-mono text-zinc-50 tabular-nums">
            {stats.total_pledges}
          </div>
        </div>

        <div className="p-4 space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
            Total Adjudicated Claims
          </div>
          <div className="text-xl font-semibold font-mono text-zinc-50 tabular-nums">
            {stats.total_claims}
          </div>
        </div>
      </section>

      {/* Quick-Select Chips & Custom RPC Query Bar */}
      <section className={`${SURFACE_CARD} p-5 space-y-5`}>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Quick-Select On-Chain Records
            </span>
            {lastRefreshed && (
              <span className="text-[11px] font-mono text-zinc-500 tabular-nums">
                Last RPC response: {lastRefreshed}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-500 mr-1">get_pledge:</span>
            {PLEDGE_CHIPS.map((id) => {
              const isSelected =
                lookupData && lookupType === 'pledge' && Number(lookupId) === id;
              return (
                <button
                  key={`pledge-${id}`}
                  type="button"
                  disabled={loading}
                  onClick={() => executeRecordLookup('pledge', id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors border tabular-nums ${
                    isSelected
                      ? 'bg-white text-black border-white font-medium'
                      : 'bg-[#101217] text-zinc-300 border-white/[0.08] hover:border-white/[0.18] hover:text-white'
                  }`}
                >
                  Pledge #{id}
                </button>
              );
            })}

            <span className="hidden sm:inline-block h-4 w-px bg-white/[0.08] mx-1" />

            <span className="text-[11px] font-mono text-zinc-500 mr-1">get_claim:</span>
            {CLAIM_CHIPS.map((id) => {
              const isSelected =
                lookupData && lookupType === 'claim' && Number(lookupId) === id;
              return (
                <button
                  key={`claim-${id}`}
                  type="button"
                  disabled={loading}
                  onClick={() => executeRecordLookup('claim', id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors border tabular-nums ${
                    isSelected
                      ? 'bg-white text-black border-white font-medium'
                      : 'bg-[#101217] text-zinc-300 border-white/[0.08] hover:border-white/[0.18] hover:text-white'
                  }`}
                >
                  Claim #{id}
                </button>
              );
            })}
          </div>
        </div>

        {/* Arbitrary ID Lookup Form */}
        <form
          onSubmit={handleLiveLookup}
          className="pt-4 border-t border-white/[0.07] flex flex-wrap items-end gap-3"
        >
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400 block">Method</label>
            <select
              value={lookupType}
              onChange={(e) => {
                setLookupType(e.target.value as 'pledge' | 'claim');
                setLookupData(null);
              }}
              className="bg-[#161920] border border-white/[0.08] rounded-md px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-white/30"
            >
              <option value="claim">get_claim(id)</option>
              <option value="pledge">get_pledge(id)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400 block">Record ID</label>
            <input
              type="number"
              min={1}
              max={100}
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              className="w-24 bg-[#161920] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-zinc-100 font-mono tabular-nums focus:outline-none focus:border-white/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md bg-[#101217] hover:bg-[#161920] border border-white/[0.12] hover:border-white/[0.2] disabled:opacity-50 text-zinc-100 text-xs font-medium transition-colors inline-flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            Fetch from StudioNet
          </button>
        </form>

        {rpcError && (
          <div className="p-3 rounded-md bg-rose-500/[0.08] border border-rose-500/25 text-xs font-mono text-rose-300">
            {rpcError}
          </div>
        )}

        {/* Live Structured Specification Table */}
        {lookupData && (
          <div className="border border-white/[0.08] bg-[#050507] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.07] bg-[#101217] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-mono font-medium text-zinc-100">
                  {lookupType === 'claim'
                    ? `get_claim(${lookupData.id})`
                    : `get_pledge(${lookupData.id})`}
                </span>
              </div>

              {statusLabel && (
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded border ${statusMeta.pillClass}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                  {statusLabel}
                </span>
              )}
            </div>

            {/* Key-Value Specification Grid */}
            <div className="divide-y divide-white/[0.06]">
              {specRows.map((row) => (
                <div
                  key={row.label}
                  className="px-4 py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 text-xs"
                >
                  <div className="text-zinc-500 font-medium">{row.label}</div>
                  <div className="sm:col-span-2 text-zinc-200 break-all">{row.value}</div>
                </div>
              ))}
            </div>

            {/* Clause / Code / Reasoning Blocks */}
            {(lookupData.clause_text ||
              lookupData.verbatim_quote ||
              lookupData.reason ||
              lookupData.rule_gate_reason) && (
              <div className="p-4 border-t border-white/[0.07] space-y-4">
                {lookupData.clause_text && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-medium text-zinc-400">
                      Pledged Compatibility Rule
                    </div>
                    <div className="p-3 rounded-md bg-[#0a0b0e] border border-white/[0.07] text-xs font-mono text-zinc-200 leading-relaxed">
                      “{lookupData.clause_text}”
                    </div>
                  </div>
                )}

                {lookupData.verbatim_quote &&
                  (lookupData.verbatim_quote === 'ANCHOR_SYMBOL_NOT_FOUND' ? (
                    <div className="p-3 rounded-md bg-[#0a0b0e] border border-amber-500/25 flex items-center justify-between gap-2 text-xs">
                      <span className="inline-flex items-center gap-2 text-zinc-200">
                        <SearchX className="w-3.5 h-3.5 text-amber-400" />
                        Symbol Lookup Diagnostic
                      </span>
                      <span className="font-mono text-[11px] text-amber-300">
                        ANCHOR_SYMBOL_NOT_FOUND
                      </span>
                    </div>
                  ) : (
                    <CodeEvidenceFrame
                      filePath={lookupData.target_file_path || 'verified_artifact'}
                      code={lookupData.verbatim_quote}
                      commitSha={lookupData.commit_sha}
                      anchorSymbol={lookupData.anchor_symbol}
                      evidenceUrl={lookupData.evidence_url}
                    />
                  ))}

                {(lookupData.reason || lookupData.rule_gate_reason) && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-medium text-zinc-400">
                      Validator Consensus Reasoning
                    </div>
                    <div className="p-3 rounded-md bg-[#0a0b0e] border border-white/[0.07] text-xs text-zinc-300 leading-relaxed">
                      {lookupData.reason || lookupData.rule_gate_reason}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Collapsible Raw JSON */}
            <div className="px-4 py-2.5 border-t border-white/[0.07] bg-[#0a0b0e]">
              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="w-full flex items-center justify-between text-[11px] font-mono text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <span>Raw On-Chain JSON</span>
                <span className="inline-flex items-center gap-1">
                  {showRawJson ? 'Hide' : 'Inspect'}
                  {showRawJson ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </span>
              </button>

              {showRawJson && (
                <pre className="mt-2.5 p-3 rounded-md bg-[#050507] border border-white/[0.07] text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                  {JSON.stringify(lookupData, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
