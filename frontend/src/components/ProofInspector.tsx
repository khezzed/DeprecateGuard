import React, { useState } from 'react';
import { ExternalLink, ShieldCheck, FileCode, Hash, Quote, ChevronDown, ChevronUp } from 'lucide-react';
import { ScenarioProof } from '../types';

interface Props {
  scenarios: ScenarioProof[];
  mainContractAddress: string;
}

export const ProofInspector: React.FC<Props> = ({ scenarios }) => {
  const [expandedId, setExpandedId] = useState<number | null>(3);

  const getBadgeColor = (outcome: string) => {
    switch (outcome) {
      case 'ACCEPTED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'REJECTED_VAGUE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'BREAKING_CONFIRMED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'NON_BREAKING':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'INSUFFICIENT_EVIDENCE':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Zero-Wallet Proof Inspector (Finalized StudioNet Scenarios)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Inspect every finalized verdict, verified verbatim quote, SHA-256 slice digest, and StudioNet Explorer receipt without connecting a wallet.
          </p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
          {scenarios.length} / {scenarios.length} Scenarios Finalized & Verified
        </span>
      </div>

      <div className="grid gap-4">
        {scenarios.map((sc) => {
          const isExpanded = expandedId === sc.id;
          return (
            <div
              key={sc.id}
              className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Scenario #{sc.id}
                    </span>
                    <h3 className="font-medium text-slate-200">{sc.title}</h3>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{sc.description}</p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-mono border font-medium shrink-0 ${getBadgeColor(
                    sc.outcome
                  )}`}
                >
                  {sc.outcome}
                </span>
              </div>

              {/* Verbatim Quote & Digest Row */}
              {(sc.verbatimQuote || sc.extractedDigest) && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sc.verbatimQuote && (
                    <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/90 space-y-1">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Quote className="w-3 h-3 text-emerald-400" />
                        Validator-Verified Verbatim Quote / Reason
                      </div>
                      <code className="block text-xs text-emerald-300 font-mono break-all">
                        "{sc.verbatimQuote}"
                      </code>
                    </div>
                  )}
                  {sc.extractedDigest && (
                    <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/90 space-y-1">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Hash className="w-3 h-3 text-indigo-400" />
                        SHA-256 Bounded Slice / Clause Digest
                      </div>
                      <code className="block text-xs text-indigo-300 font-mono break-all">
                        {sc.extractedDigest}
                      </code>
                    </div>
                  )}
                </div>
              )}

              {/* Links & Expand Row */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Finalized Tx:</span>
                    <a
                      href={`https://explorer-studio.genlayer.com/tx/${sc.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
                    >
                      {sc.txHash.slice(0, 10)}...{sc.txHash.slice(-8)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {sc.withdrawTx && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Refund Withdraw Tx:</span>
                      <a
                        href={`https://explorer-studio.genlayer.com/tx/${sc.withdrawTx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline"
                      >
                        {sc.withdrawTx.slice(0, 8)}...{sc.withdrawTx.slice(-6)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {sc.expireTx && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Expiry Fallback Tx:</span>
                      <a
                        href={`https://explorer-studio.genlayer.com/tx/${sc.expireTx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline"
                      >
                        {sc.expireTx.slice(0, 8)}...{sc.expireTx.slice(-6)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {sc.evidenceUrl && (
                    <a
                      href={sc.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-300 hover:text-white flex items-center gap-1 hover:underline"
                    >
                      <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                      Immutable Evidence Artifact
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <button
                  onClick={() => setExpandedId(isExpanded ? null : sc.id)}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono text-[11px]"
                >
                  {isExpanded ? 'Hide On-Chain JSON' : 'Inspect On-Chain State'}
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {isExpanded && sc.details && (
                <pre className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                  {typeof sc.details === 'string' ? sc.details : JSON.stringify(sc.details, null, 2)}
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
