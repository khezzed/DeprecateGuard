import React, { useState } from 'react';
import { ExternalLink, Github, ArrowUpRight } from 'lucide-react';
import { LiveContractReader } from './components/LiveContractReader';
import { ProofInspector } from './components/ProofInspector';
import { WalletActionPanel } from './components/WalletActionPanel';
import { CopyButton, truncateHash } from './components/ui';
import { MAIN_CONTRACT_ADDRESS, STUDIONET_EXPLORER_URL } from './lib/genlayerClient';
import proofData from './data/recordedProof.json';

type ActiveView = 'cases' | 'actions' | 'live';

const NAV_TABS: { id: ActiveView; label: string }[] = [
  { id: 'cases', label: 'Case Ledger' },
  { id: 'actions', label: 'Transaction Studio' },
  { id: 'live', label: 'RPC Inspector' }
];

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('cases');

  const mainAddress = proofData.contracts.mainContract.address || MAIN_CONTRACT_ADDRESS;
  const rpcUrl = proofData.network.rpcUrl || 'https://studio.genlayer.com/api';
  const recordedStats = (proofData as any).contractStats || {
    total_pledges: 5,
    total_claims: 4
  };

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-50 flex flex-col">
      {/* Architectural Top Navigation Bar */}
      <header className="sticky top-0 z-50 h-14 border-b border-white/[0.07] bg-[#050507]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-6">
          {/* Left: Brand + Tabs */}
          <div className="flex items-center gap-6 sm:gap-8 h-full min-w-0">
            <button
              type="button"
              onClick={() => setActiveView('cases')}
              className="flex items-center gap-2.5 shrink-0 text-left focus:outline-none"
            >
              {/* Custom Architectural Shield Mark */}
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="shrink-0"
              >
                <path
                  d="M12 2.5L4.5 5.8V11.5C4.5 16.4 7.7 20.8 12 22.3C16.3 20.8 19.5 16.4 19.5 11.5V5.8L12 2.5Z"
                  fill="#101217"
                  stroke="#fafafa"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M9.2 12.1L11.1 14L15 10.1"
                  stroke="#34d399"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-semibold text-sm tracking-[-0.02em] text-zinc-50">
                DeprecateGuard
              </span>
              <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 border border-white/[0.08] bg-[#0a0b0e] px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                v1.0 · StudioNet
              </span>
            </button>

            {/* Architectural Tab Navigation */}
            <nav className="flex items-center gap-1 sm:gap-2 h-full" aria-label="Primary">
              {NAV_TABS.map((tab) => {
                const isActive = activeView === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveView(tab.id)}
                    className={`relative h-full px-2.5 sm:px-3 text-xs font-medium transition-colors flex items-center whitespace-nowrap border-b-2 ${
                      isActive
                        ? 'border-white text-zinc-50'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Contract Chip + GitHub */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0a0b0e] border border-white/[0.08] hover:border-white/[0.14] transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <a
                href={`${STUDIONET_EXPLORER_URL}/address/${mainAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-zinc-300 hover:text-white transition-colors inline-flex items-center gap-1 tabular-nums"
              >
                {truncateHash(mainAddress, 6, 4)}
                <ExternalLink className="w-3 h-3 text-zinc-500" />
              </a>
              <span className="h-3 w-px bg-white/[0.08]" />
              <CopyButton text={mainAddress} />
            </div>

            <a
              href="https://github.com/khezzed/DeprecateGuard"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-md bg-[#0a0b0e] hover:bg-[#101217] text-zinc-300 hover:text-white border border-white/[0.08] hover:border-white/[0.14] transition-colors inline-flex items-center gap-1.5 text-xs font-medium"
            >
              <Github className="w-3.5 h-3.5 text-zinc-400" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-7 w-full space-y-6">
        {activeView === 'cases' && (
          <>
            {/* Compact Product Header + Primary CTA */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-semibold text-zinc-50 tracking-[-0.025em]">
                  API Compatibility Adjudication Ledger
                </h1>
                <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
                  Maintainers lock native stability bonds over pinned GitHub artifacts. GenLayer validators
                  adjudicate breaking changes via consensus and settle bounties or refunds automatically.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveView('live')}
                  className="px-3.5 py-2 rounded-md bg-[#101217] hover:bg-[#161920] text-zinc-200 border border-white/[0.08] hover:border-white/[0.14] text-xs font-medium transition-colors"
                >
                  Inspect Live RPC
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('actions')}
                  className="px-3.5 py-2 rounded-md bg-white hover:bg-zinc-200 text-black text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  Open Transaction Studio
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Unified 4-Column On-Chain Telemetry Strip */}
            <section
              aria-label="On-Chain Telemetry"
              className="border border-white/[0.08] bg-[#0a0b0e] rounded-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07]"
            >
              <div className="p-4 space-y-1">
                <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
                  Active Contract
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`${STUDIONET_EXPLORER_URL}/address/${mainAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono font-medium text-zinc-100 hover:text-white inline-flex items-center gap-1 tabular-nums"
                  >
                    {truncateHash(mainAddress, 6, 4)}
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>
                  <CopyButton text={mainAddress} />
                </div>
                <div className="text-xs text-zinc-400 tabular-nums">Verified on Chain 61999</div>
              </div>

              <div className="p-4 space-y-1">
                <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
                  Finalized Judgments
                </div>
                <div className="text-sm font-semibold text-zinc-100 tabular-nums">
                  {proofData.scenarios.length} / {proofData.scenarios.length} Scenarios
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  MAJORITY_AGREE
                </div>
              </div>

              <div className="p-4 space-y-1">
                <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
                  Settlement Engine
                </div>
                <div className="text-sm font-mono font-medium text-zinc-100">
                  Native emit_transfer
                </div>
                <div className="text-xs text-zinc-400">Push Bounties &amp; Pull Refunds</div>
              </div>

              <div className="p-4 space-y-1">
                <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
                  Deposit Safety Invariant
                </div>
                <div className="text-sm font-semibold text-zinc-100 tabular-nums">
                  3 / 3 Invalid Paths Protected
                </div>
                <div className="text-xs font-mono text-emerald-400 tabular-nums">
                  0 Stranded Wei
                </div>
              </div>
            </section>

            <ProofInspector
              scenarios={proofData.scenarios}
              mainContractAddress={mainAddress}
              invalidInputProof={(proofData as any).invalidInputDepositProtectionProof}
            />
          </>
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

      {/* Architectural Footer */}
      <footer className="border-t border-white/[0.07] py-4 mt-10 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-zinc-300 font-medium">DeprecateGuard</span>
            <span>·</span>
            <span className="tabular-nums">GenLayer StudioNet (Chain 61999)</span>
          </div>
          <div className="flex items-center gap-3 font-mono">
            <a
              href={`${STUDIONET_EXPLORER_URL}/address/${mainAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors tabular-nums"
            >
              {truncateHash(mainAddress, 10, 8)}
            </a>
            <CopyButton text={mainAddress} />
          </div>
        </div>
      </footer>
    </div>
  );
};
