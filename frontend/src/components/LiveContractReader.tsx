import React, { useState } from 'react';
import { RefreshCw, Search, ExternalLink, CheckCircle2, Database } from 'lucide-react';
import { getReadOnlyStudioClient } from '../lib/genlayerClient';

interface Props {
  contractAddress: string;
  rpcUrl: string;
  recordedStats?: { total_pledges: number; total_claims: number };
}

export const LiveContractReader: React.FC<Props> = ({
  contractAddress,
  rpcUrl,
  recordedStats = { total_pledges: 4, total_claims: 4 }
}) => {
  const [liveStats, setLiveStats] = useState<{ total_pledges: number; total_claims: number } | null>(null);
  const [lookupType, setLookupType] = useState<'claim' | 'pledge'>('claim');
  const [lookupId, setLookupId] = useState('1');
  const [lookupData, setLookupData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [rpcError, setRpcError] = useState<string | null>(null);

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

  const handleLiveLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRpcError(null);
    try {
      const client = getReadOnlyStudioClient(rpcUrl);
      const fnName = lookupType === 'pledge' ? 'get_pledge' : 'get_claim';
      const rawRes = await client.readContract({
        address: contractAddress as `0x${string}`,
        functionName: fnName,
        args: [Number(lookupId)]
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

  const stats = liveStats || recordedStats;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Contract Summary Card */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-400" />
              Live StudioNet Contract Reader
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Query the deployed Intelligent Contract directly on GenLayer StudioNet (Chain 61999) without a wallet.
            </p>
          </div>

          <button
            onClick={fetchLiveStats}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-semibold transition flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {liveStats ? `Refreshed (${lastRefreshed})` : 'Sync Live Contract Counts'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-xs text-slate-400">Deployed Contract</div>
            <a
              href={`https://explorer-studio.genlayer.com/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-sky-400 hover:underline mt-1 inline-flex items-center gap-1"
            >
              {contractAddress.slice(0, 10)}...{contractAddress.slice(-8)}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-xs text-slate-400">Total Stability Pledges</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">{stats.total_pledges}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-xs text-slate-400">Total Adjudicated Claims</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">{stats.total_claims}</div>
          </div>
        </div>

        {/* Record Lookup Form */}
        <form onSubmit={handleLiveLookup} className="pt-4 border-t border-slate-800/80 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">Record Type</label>
            <select
              value={lookupType}
              onChange={(e) => {
                setLookupType(e.target.value as 'pledge' | 'claim');
                setLookupData(null);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="claim">Claim Record (get_claim)</option>
              <option value="pledge">Pledge Bond (get_pledge)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">Record ID (1 – 4)</label>
            <input
              type="number"
              min={1}
              max={20}
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            Fetch from StudioNet
          </button>
        </form>

        {rpcError && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300">
            {rpcError}
          </div>
        )}

        {lookupData && (
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Live StudioNet Response ({lookupType === 'claim' ? `Claim #${lookupData.id}` : `Pledge #${lookupData.id}`})
              </span>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200">
                {lookupData.verdict || lookupData.status}
              </span>
            </div>

            {lookupData.clause_text && (
              <div className="text-xs text-slate-300">
                <span className="text-slate-400 block mb-1">Pledged Compatibility Rule:</span>
                “{lookupData.clause_text}”
              </div>
            )}

            {lookupData.verbatim_quote && (
              <div>
                <span className="text-xs text-slate-400 block mb-1">Verified Code Quote:</span>
                <pre className="p-3 rounded-lg bg-[#060911] border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto">
                  {lookupData.verbatim_quote}
                </pre>
              </div>
            )}

            {(lookupData.reason || lookupData.rule_gate_reason) && (
              <div className="text-xs text-slate-300">
                <span className="text-slate-400 block mb-0.5">Validator Reasoning:</span>
                {lookupData.reason || lookupData.rule_gate_reason}
              </div>
            )}

            <details className="pt-2">
              <summary className="text-[11px] font-mono text-slate-400 cursor-pointer hover:text-slate-200">
                View Raw On-Chain JSON
              </summary>
              <pre className="mt-2 p-3 rounded-lg bg-[#060911] border border-slate-800/80 text-[11px] font-mono text-slate-300 overflow-x-auto">
                {JSON.stringify(lookupData, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};
