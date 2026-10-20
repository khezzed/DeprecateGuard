import React, { useState } from 'react';
import { RefreshCw, Radio, Globe, Search } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'RECORDED' | 'LIVE_RPC'>('RECORDED');
  const [liveStats, setLiveStats] = useState<{ total_pledges: number; total_claims: number } | null>(null);
  const [lookupType, setLookupType] = useState<'pledge' | 'claim'>('claim');
  const [lookupId, setLookupId] = useState('1');
  const [lookupResult, setLookupResult] = useState<string | null>(null);
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
      setRpcError(err?.message || 'Live RPC call failed');
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
      setLookupResult(JSON.stringify(parsed, null, 2));
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      setRpcError(err?.message || 'Live lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const displayedStats = activeTab === 'LIVE_RPC' && liveStats ? liveStats : recordedStats;

  return (
    <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h3 className="font-semibold text-slate-100">
              Recorded Proof vs. Live StudioNet RPC Comparator
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Main Contract: <span className="text-indigo-400">{contractAddress}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('RECORDED')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'RECORDED'
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Recorded Proof (deploy/proof.json)
          </button>
          <button
            onClick={() => {
              setActiveTab('LIVE_RPC');
              fetchLiveStats();
            }}
            className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
              activeTab === 'LIVE_RPC'
                ? 'bg-emerald-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live StudioNet RPC (gen_call)
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] text-slate-400">Network / Chain ID</div>
          <div className="text-sm font-semibold text-slate-200 mt-0.5">StudioNet (61999)</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] text-slate-400">On-Chain Pledges</div>
          <div className="text-sm font-semibold text-emerald-400 mt-0.5 font-mono">
            {displayedStats.total_pledges}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] text-slate-400">Adjudicated Claims</div>
          <div className="text-sm font-semibold text-indigo-400 mt-0.5 font-mono">
            {displayedStats.total_claims}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] text-slate-400">Data Source Mode</div>
          <div className="text-sm font-semibold text-slate-300 mt-0.5 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            {activeTab === 'RECORDED' ? 'Recorded Manifest' : `Live RPC (${lastRefreshed || 'ready'})`}
          </div>
        </div>
      </div>

      {activeTab === 'LIVE_RPC' && (
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <form onSubmit={handleLiveLookup} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Contract View Method</label>
              <select
                value={lookupType}
                onChange={(e) => setLookupType(e.target.value as 'pledge' | 'claim')}
                className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="claim">get_claim(claim_id)</option>
                <option value="pledge">get_pledge(pledge_id)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">ID (1 - 4)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                className="w-20 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              Query Live StudioNet State
            </button>
          </form>

          {rpcError && (
            <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300 font-mono">
              {rpcError}
            </div>
          )}

          {lookupResult && (
            <pre className="p-3 rounded-lg bg-slate-950 border border-emerald-800/40 text-[11px] font-mono text-emerald-300 overflow-x-auto">
              {lookupResult}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
