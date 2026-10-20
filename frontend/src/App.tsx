import React from 'react';
import { Shield, ExternalLink, CheckCircle, Github } from 'lucide-react';
import { LiveContractReader } from './components/LiveContractReader';
import { TxLifecycleTracker } from './components/TxLifecycleTracker';
import { ProofInspector } from './components/ProofInspector';
import { WalletActionPanel } from './components/WalletActionPanel';
import proofData from './data/recordedProof.json';

export const App: React.FC = () => {
  const mainAddress =
    proofData.contracts.mainContract.address || '0x0645f04f8Fb89451Fa0c2B3c6F5E4cbD724Fb531';
  const rpcUrl = proofData.network.rpcUrl || 'https://studio.genlayer.com/api';
  const recordedStats = (proofData.contracts.mainContract as any).liveStats || {
    total_pledges: 4,
    total_claims: 4
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Banner */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight text-white">DeprecateGuard</h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  GenLayer Intelligent Contract
                </span>
              </div>
              <p className="text-xs text-slate-400">API Breaking-Change & Deprecation Pledge Bond</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              StudioNet (61999)
            </span>
            <a
              href="https://github.com/khezzed/DeprecateGuard"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition flex items-center gap-1.5"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub Repo
            </a>
            <a
              href={`https://explorer-studio.genlayer.com/address/${mainAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition flex items-center gap-1"
            >
              StudioNet Explorer
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 space-y-8 w-full">
        <div className="p-6 rounded-2xl bg-gradient-to-b from-indigo-950/40 to-slate-900/40 border border-indigo-900/30 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono">
            <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
            10 Non-Negotiable GenLayer Design Rules Implemented & Audited
          </div>
          <h2 className="text-2xl font-bold text-slate-100 sm:text-3xl tracking-tight">
            Cryptographic Stability Bonds for Semantic Versioning
          </h2>
          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            API maintainers lock collateral pledging backward compatibility. When updates ship, GenLayer
            validators independently fetch immutable 40-hex SHA GitHub commit bytes, verify the SHA-256 slice
            digest, confirm verbatim code quotes exist in their own copy, and settle bounties deterministically.
          </p>
        </div>

        {/* Live Contract State vs Recorded Proof */}
        <LiveContractReader
          contractAddress={mainAddress}
          rpcUrl={rpcUrl}
          recordedStats={recordedStats}
        />

        {/* Protocol Lifecycle & Timeout Fallback */}
        <TxLifecycleTracker />

        {/* Finalized On-Chain Scenarios */}
        <ProofInspector scenarios={proofData.scenarios} mainContractAddress={mainAddress} />

        {/* Interactive Wallet Actions */}
        <WalletActionPanel contractAddress={mainAddress} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/30 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            DeprecateGuard —{' '}
            <a
              href="https://github.com/khezzed/DeprecateGuard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:underline"
            >
              github.com/khezzed/DeprecateGuard
            </a>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-mono">
            <span>Chain ID: 61999</span>
            <span>•</span>
            <span>Contract: {mainAddress.slice(0, 10)}...</span>
            <span>•</span>
            <span>py-genlayer:1jb45aa8...</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
