import React, { useState } from 'react';
import {
  ExternalLink,
  FileCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Terminal,
  Copy,
  Check
} from 'lucide-react';
import { ScenarioProof } from '../types';

interface Props {
  scenarios: ScenarioProof[];
  mainContractAddress: string;
}

const OUTCOME_META: Record<
  string,
  {
    label: string;
    shortLabel: string;
    badgeClass: string;
    borderClass: string;
    icon: React.ReactNode;
  }
> = {
  BREAKING_CONFIRMED: {
    label: 'Breaking Change Confirmed — Bond Paid',
    shortLabel: 'Breaking Change',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    borderClass: 'border-rose-500/40',
    icon: <ShieldAlert className="w-4 h-4 text-rose-400" />
  },
  NON_BREAKING: {
    label: 'No Breaking Change — Claim Dismissed',
    shortLabel: 'Non-Breaking',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    borderClass: 'border-sky-500/40',
    icon: <CheckCircle2 className="w-4 h-4 text-sky-400" />
  },
  ACCEPTED: {
    label: 'Pledge Approved & Active',
    shortLabel: 'Pledge Approved',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    borderClass: 'border-emerald-500/40',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
  },
  REJECTED_VAGUE: {
    label: 'Vague Pledge Rejected — Deposit Refunded',
    shortLabel: 'Vague Rejected',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    borderClass: 'border-amber-500/40',
    icon: <XCircle className="w-4 h-4 text-amber-400" />
  },
  INSUFFICIENT_EVIDENCE: {
    label: 'Symbol Not Found — Bond Returned at Expiry',
    shortLabel: 'Insufficient Evidence',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    borderClass: 'border-purple-500/40',
    icon: <HelpCircle className="w-4 h-4 text-purple-400" />
  }
};

export const ProofInspector: React.FC<Props> = ({ scenarios }) => {
  const [selectedId, setSelectedId] = useState<number>(scenarios[0]?.id ?? 3);
  const [showRaw, setShowRaw] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const activeScenario = scenarios.find((s) => s.id === selectedId) || scenarios[0];
  const meta = OUTCOME_META[activeScenario.outcome] || {
    label: activeScenario.outcome,
    shortLabel: activeScenario.outcome,
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    borderClass: 'border-slate-700',
    icon: <AlertTriangle className="w-4 h-4 text-slate-400" />
  };

  const details: any = activeScenario.details || {};
  const reasonText = details.reason || details.rule_gate_reason || '';
  const packageName = details.package_name || (details.pledge_id === 4 ? 'open-prompt-injection' : 'express');

  const copyTxHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 1800);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Case List */}
      <div className="lg:col-span-5 space-y-2.5">
        <div className="flex items-center justify-between px-1 pb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Verified On-Chain Cases ({scenarios.length})
          </span>
          <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            StudioNet Finalized
          </span>
        </div>

        {scenarios.map((sc) => {
          const isSelected = sc.id === activeScenario.id;
          const itemMeta = OUTCOME_META[sc.outcome] || meta;
          const itemDetails: any = sc.details || {};
          const pkg =
            itemDetails.package_name || (itemDetails.pledge_id === 4 ? 'open-prompt-injection' : 'express');

          return (
            <button
              key={sc.id}
              onClick={() => {
                setSelectedId(sc.id);
                setShowRaw(false);
              }}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-slate-900 border-sky-500/50 shadow-lg shadow-sky-950/30 ring-1 ring-sky-500/30'
                  : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                  {pkg}
                </span>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${itemMeta.badgeClass}`}
                >
                  {itemMeta.shortLabel}
                </span>
              </div>
              <div className="font-semibold text-sm text-slate-100 leading-snug">{sc.title}</div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{sc.description}</p>
            </button>
          );
        })}
      </div>

      {/* Right Column: Selected Case Detail */}
      <div className="lg:col-span-7 rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-xl">
        {/* Top Status Header */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/90 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${meta.badgeClass}`}
            >
              {meta.icon}
              {meta.label}
            </div>
            <span className="text-xs font-mono text-slate-400">
              Package: <strong className="text-slate-200">{packageName}</strong>
            </span>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">{activeScenario.title}</h2>
          <p className="text-sm text-slate-300 leading-relaxed">{activeScenario.description}</p>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* If Pledge Clause Exists, Show It Clearly */}
          {details.clause_text && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-slate-400">Pledged Compatibility Rule</div>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-slate-200 leading-relaxed">
                “{details.clause_text}”
              </div>
            </div>
          )}

          {/* Verbatim Evidence Quote */}
          {activeScenario.verbatimQuote && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-sky-400" />
                  {details.clause_text ? 'Validator Rule Check' : 'Exact Code Line Verified by Validators'}
                </span>
                {details.anchor_symbol && (
                  <span className="text-[11px] font-mono text-slate-400">
                    Target: <code className="text-sky-300">{details.anchor_symbol}</code>
                  </span>
                )}
              </div>
              <pre className="p-4 rounded-xl bg-[#060911] border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {activeScenario.verbatimQuote}
              </pre>
            </div>
          )}

          {/* Validator Consensus Explanation */}
          {reasonText && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-slate-400">Why Validators Agreed on This Verdict</div>
              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-sm text-slate-300 leading-relaxed">
                {reasonText}
              </div>
            </div>
          )}

          {/* Primary Action Links */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <a
              href={`https://explorer-studio.genlayer.com/tx/${activeScenario.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-medium transition flex items-center gap-1.5"
            >
              View Transaction on Explorer
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {activeScenario.evidenceUrl && (
              <a
                href={activeScenario.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition flex items-center gap-1.5"
              >
                <FileCode className="w-3.5 h-3.5 text-slate-400" />
                View Pinned Source File
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {activeScenario.withdrawTx && (
              <a
                href={`https://explorer-studio.genlayer.com/tx/${activeScenario.withdrawTx}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition flex items-center gap-1.5"
              >
                Refund Withdrawal Tx
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {activeScenario.expireTx && (
              <a
                href={`https://explorer-studio.genlayer.com/tx/${activeScenario.expireTx}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition flex items-center gap-1.5"
              >
                Bond Expiry Refund Tx
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Collapsible Technical Receipt */}
          <div className="pt-3 border-t border-slate-800/80">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 transition"
            >
              <span>Cryptographic Hashes & Raw On-Chain Receipt</span>
              <span className="flex items-center gap-1 font-mono text-[11px]">
                {showRaw ? 'Hide' : 'Show details'}
                {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </span>
            </button>

            {showRaw && (
              <div className="mt-3 space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 font-mono">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">Transaction Hash:</span>
                    <button
                      onClick={() => copyTxHash(activeScenario.txHash)}
                      className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
                    >
                      {copiedHash ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedHash ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="text-slate-200 break-all text-[11px]">{activeScenario.txHash}</div>

                  {activeScenario.extractedDigest && (
                    <>
                      <div className="text-slate-400 pt-1">SHA-256 Evidence / Clause Digest:</div>
                      <div className="text-slate-300 break-all text-[11px]">{activeScenario.extractedDigest}</div>
                    </>
                  )}
                </div>

                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                  {JSON.stringify(activeScenario.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
