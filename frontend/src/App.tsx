import React, { useState } from 'react';
import { Shield, ExternalLink, Github, Layers, PlusCircle, Database } from 'lucide-react';
import { LiveContractReader } from './components/LiveContractReader';
import { ProofInspector } from './components/ProofInspector';
import { WalletActionPanel } from './components/WalletActionPanel';
import proofData from './data/recordedProof.json';

type ActiveView = 'cases' | 'actions' | 'live';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('cases');

  const mainAddress =
    proofData.contracts.mainContract.address || '0x0645f04f8Fb89451Fa0c2B3c6F5E4cbD724Fb531';
  const rpcUrl = proofData.network.rpcUrl || 'https://studio.genlayer.com/api';
  const recordedStats = (proofData.contracts.mainContract as any).liveStats || {
    total_pledges: 4,
    total_claims: 4
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-sky-500 selection:text-slate-950">
      {/* Clean Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">DeprecateGuard</span>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  StudioNet
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                On-Chain Stability Bonds for API Backward Compatibility
              </p>
            </div>
          </div>

          {/* Center View Switcher */}
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveView('cases')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeView === 'cases'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Case Explorer
            </button>
            <button
              onClick={() => setActiveView('actions')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeView === 'actions'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New Pledge / Claim
            </button>
            <button
              onClick={() => setActiveView('live')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeView === 'live'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Contract State
            </button>
          </nav>

          {/* Right External Links */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            <a
              href={`https://explorer-studio.genlayer.com/address/${mainAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1.5"
            >
              Contract
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <a
              href="https://github.com/khezzed/DeprecateGuard"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1.5"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full space-y-6">
        {/* Compact Context Header */}
        {activeView === 'cases' && (
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-800/80">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Verified API Compatibility Judgments
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Maintainers lock a stability bond promising specific functions will not break. When code changes,
                GenLayer validators inspect the pinned GitHub commit and settle claims automatically.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveView('actions')}
                className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold transition"
              >
                + Create Pledge or File Claim
              </button>
            </div>
          </div>
        )}

        {activeView === 'cases' && (
          <ProofInspector scenarios={proofData.scenarios} mainContractAddress={mainAddress} />
        )}

        {activeView === 'actions' && <WalletActionPanel contractAddress={mainAddress} />}

        {activeView === 'live' && (
          <LiveContractReader
            contractAddress={mainAddress}
            rpcUrl={rpcUrl}
            recordedStats={recordedStats}
          />
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-slate-800/60 py-5 mt-12 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <span>DeprecateGuard — GenLayer StudioNet (Chain 61999)</span>
          <div className="flex items-center gap-4 font-mono">
            <a
              href={`https://explorer-studio.genlayer.com/address/${mainAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition"
            >
              {mainAddress}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
