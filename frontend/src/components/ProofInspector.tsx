import React, { useState } from 'react';
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  FileCode2,
  GitCommitHorizontal
} from 'lucide-react';
import { ScenarioProof } from '../types';
import {
  CodeEvidenceFrame,
  CopyButton,
  getOutcomeMeta,
  truncateHash
} from './ui';
import { STUDIONET_EXPLORER_URL } from '../lib/genlayerClient';

interface Props {
  scenarios: ScenarioProof[];
  mainContractAddress: string;
  invalidInputProof?: {
    invalidRepoTx: string;
    invalidRepoReturn: string;
    invalidPathTx: string;
    invalidPathReturn: string;
    invalidTagTx: string;
    invalidTagReturn: string;
    accumulatedBalanceWei: number;
    withdrawTx: string;
    withdrawReturn: string;
    postWithdrawBalanceWei: number;
  };
}

function parseGitHubRawUrl(url?: string): { repo?: string; sha?: string; path?: string } {
  if (!url) return {};
  const match = url.match(
    /^https:\/\/raw\.githubusercontent\.com\/([^/]+\/[^/]+)\/([0-9a-fA-F]{40})\/(.+)$/
  );
  if (!match) return {};
  return { repo: match[1], sha: match[2], path: match[3] };
}

export const ProofInspector: React.FC<Props> = ({ scenarios, invalidInputProof }) => {
  const [selectedId, setSelectedId] = useState<number>(scenarios[0]?.id ?? 1);
  const [showRaw, setShowRaw] = useState(false);

  const activeScenario: any = scenarios.find((s) => s.id === selectedId) || scenarios[0];
  const meta = getOutcomeMeta(activeScenario.outcome);
  const details: any = activeScenario.details || {};
  const parsedEvidence = parseGitHubRawUrl(activeScenario.evidenceUrl);

  const repoName = details.repo_full_name || parsedEvidence.repo || 'expressjs/express';
  const targetFilePath = details.target_file_path || parsedEvidence.path || 'lib/response.js';
  const commitSha = details.commit_sha || parsedEvidence.sha;
  const reasonText = details.reason || details.rule_gate_reason || '';

  const versionWindow =
    details.baseline_tag && details.release_tag
      ? `${details.baseline_tag} → ${details.release_tag}`
      : details.release_tag
      ? `release ${details.release_tag}`
      : details.baseline_tag
      ? `baseline ${details.baseline_tag}`
      : 'Pinned Commit';

  const hasSettlementDetail =
    Boolean(activeScenario.withdrawTx || activeScenario.withdrawReturn) ||
    Boolean(activeScenario.directPayoutTransferredWei) ||
    Boolean(activeScenario.expireTx) ||
    Boolean(activeScenario.mismatchedTx);

  return (
    <div className="space-y-6">
      {/* Main Case Ledger Split-Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols): Vertical Ledger List */}
        <aside
          aria-label="Case Ledger List"
          className="lg:col-span-4 border border-white/[0.08] bg-[#0a0b0e] rounded-lg overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-white/[0.07] bg-[#07080b] flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Case Ledger
            </span>
            <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
              {String(scenarios.length).padStart(2, '0')} Finalized
            </span>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {scenarios.map((sc) => {
              const isSelected = sc.id === activeScenario.id;
              const itemMeta = getOutcomeMeta(sc.outcome);
              const itemDetails: any = sc.details || {};
              const itemParsed = parseGitHubRawUrl(sc.evidenceUrl);
              const itemRepo = itemDetails.repo_full_name || itemParsed.repo || 'expressjs/express';
              const itemPath = itemDetails.target_file_path || itemParsed.path || 'lib/response.js';
              const shortPath = itemPath.split('/').slice(-1)[0] || itemPath;

              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(sc.id);
                    setShowRaw(false);
                  }}
                  className={`w-full text-left px-4 py-3.5 transition-colors border-l-2 ${
                    isSelected
                      ? 'border-l-white bg-white/[0.04]'
                      : 'border-l-transparent hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-mono text-zinc-500 tabular-nums">
                      #{String(sc.id).padStart(2, '0')}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded border ${itemMeta.pillClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${itemMeta.dotClass}`} />
                      {itemMeta.shortLabel}
                    </span>
                  </div>

                  <div
                    className={`text-[13px] font-medium leading-snug ${
                      isSelected ? 'text-zinc-50' : 'text-zinc-200'
                    }`}
                  >
                    {sc.title}
                  </div>

                  <div className="mt-1.5 text-[11px] font-mono text-zinc-500 truncate">
                    {itemRepo} · {shortPath}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Column (8 cols): Adjudication Dossier */}
        <section
          aria-label="Adjudication Dossier"
          className="lg:col-span-8 border border-white/[0.08] bg-[#0a0b0e] rounded-lg overflow-hidden"
        >
          {/* Dossier Header */}
          <div className="p-5 sm:p-6 border-b border-white/[0.07] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono text-zinc-500 tabular-nums">
                  CASE #{String(activeScenario.id).padStart(2, '0')}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-xs font-medium ${meta.pillClass}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                  {meta.fullLabel}
                </span>
              </div>

              <span className="text-[11px] font-mono text-zinc-400 bg-[#101217] border border-white/[0.07] px-2 py-0.5 rounded">
                {activeScenario.outcome}
              </span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-50 tracking-[-0.02em]">
                {activeScenario.title}
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">{activeScenario.description}</p>
            </div>

            {/* 4-Cell Dossier Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border border-white/[0.07] bg-[#050507] rounded-md divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07]">
              <div className="px-3.5 py-2.5 space-y-0.5 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                  Repository
                </div>
                <div className="text-xs font-mono text-zinc-200 truncate" title={repoName}>
                  {repoName}
                </div>
              </div>

              <div className="px-3.5 py-2.5 space-y-0.5 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                  Target File
                </div>
                <div className="text-xs font-mono text-zinc-200 truncate" title={targetFilePath}>
                  {targetFilePath}
                </div>
              </div>

              <div className="px-3.5 py-2.5 space-y-0.5 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                  Baseline / Release
                </div>
                <div className="text-xs font-mono text-zinc-200 truncate tabular-nums">
                  {versionWindow}
                </div>
              </div>

              <div className="px-3.5 py-2.5 space-y-0.5 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                  Finalized Tx
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`${STUDIONET_EXPLORER_URL}/tx/${activeScenario.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-zinc-200 hover:text-white inline-flex items-center gap-1 tabular-nums"
                  >
                    {truncateHash(activeScenario.txHash, 6, 4)}
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>
                  <CopyButton text={activeScenario.txHash} />
                </div>
              </div>
            </div>
          </div>

          {/* Dossier Body */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* Pledge Clause (for Pledge Scenarios) */}
            {details.clause_text && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-400">
                    Frozen Stability Clause (Pledge-Bound)
                  </span>
                  {details.baseline_tag && (
                    <span className="font-mono text-[11px] text-zinc-500">
                      baseline: {details.baseline_tag}
                    </span>
                  )}
                </div>
                <div className="p-3.5 rounded-md bg-[#050507] border border-white/[0.07] text-[13px] font-mono text-zinc-200 leading-relaxed">
                  “{details.clause_text}”
                </div>
              </div>
            )}

            {/* IDE Code Evidence Frame */}
            {activeScenario.verbatimQuote && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-400">
                    {details.clause_text
                      ? 'Validator Rule Check / Verbatim Reference'
                      : 'Verbatim Code Evidence Verified by Consensus'}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Bounded Slice Extraction
                  </span>
                </div>
                <CodeEvidenceFrame
                  filePath={targetFilePath}
                  code={activeScenario.verbatimQuote}
                  commitSha={commitSha}
                  anchorSymbol={details.anchor_symbol}
                  evidenceUrl={activeScenario.evidenceUrl}
                />
              </div>
            )}

            {/* Validator Consensus & On-Chain Settlement */}
            <div
              className={`grid grid-cols-1 ${
                hasSettlementDetail ? 'md:grid-cols-2' : ''
              } gap-4`}
            >
              {reasonText && (
                <div className="p-4 rounded-md bg-[#101217] border border-white/[0.07] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-300">
                      Why Validators Agreed
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/[0.08] border border-emerald-500/20 px-1.5 py-0.5 rounded">
                      MAJORITY_AGREE
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{reasonText}</p>
                </div>
              )}

              {hasSettlementDetail && (
                <div className="p-4 rounded-md bg-[#101217] border border-white/[0.07] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-300">
                      On-Chain Settlement Receipt
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      Native Transfer
                    </span>
                  </div>

                  {activeScenario.directPayoutTransferredWei && (
                    <div className="space-y-1">
                      <div className="text-xs text-zinc-200 font-mono tabular-nums">
                        Direct Push Bounty: {activeScenario.directPayoutTransferredWei} wei
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Settled immediately via{' '}
                        <code className="text-zinc-200">gl.get_contract_at(claimant).emit_transfer</code>{' '}
                        upon finalization.
                      </p>
                    </div>
                  )}

                  {activeScenario.expireTx && (
                    <div className="space-y-1 pt-1 border-t border-white/[0.06] first:pt-0 first:border-t-0">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-zinc-400">Trusted-Time Expiry</span>
                        <a
                          href={`${STUDIONET_EXPLORER_URL}/tx/${activeScenario.expireTx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-200 hover:text-white inline-flex items-center gap-1"
                        >
                          {truncateHash(activeScenario.expireTx)}
                          <ExternalLink className="w-3 h-3 text-zinc-500" />
                        </a>
                      </div>
                      {activeScenario.expireReturn && (
                        <div className="text-[11px] font-mono text-amber-300/90 break-all">
                          {activeScenario.expireReturn}
                        </div>
                      )}
                    </div>
                  )}

                  {(activeScenario.withdrawTx || activeScenario.withdrawReturn) && (
                    <div className="space-y-1 pt-1 border-t border-white/[0.06] first:pt-0 first:border-t-0">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-zinc-400">Pull Refund (emit_transfer)</span>
                        {activeScenario.withdrawTx && (
                          <a
                            href={`${STUDIONET_EXPLORER_URL}/tx/${activeScenario.withdrawTx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                          >
                            {truncateHash(activeScenario.withdrawTx)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      {activeScenario.withdrawReturn && (
                        <div className="text-[11px] font-mono text-zinc-300 break-all">
                          {activeScenario.withdrawReturn}
                        </div>
                      )}
                    </div>
                  )}

                  {activeScenario.mismatchedTx && (
                    <div className="space-y-1 pt-1 border-t border-white/[0.06] first:pt-0 first:border-t-0">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-zinc-400">Repo-Boundary Guard Tx</span>
                        <a
                          href={`${STUDIONET_EXPLORER_URL}/tx/${activeScenario.mismatchedTx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-300 hover:text-amber-200 inline-flex items-center gap-1"
                        >
                          {truncateHash(activeScenario.mismatchedTx)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {activeScenario.mismatchedReturn && (
                        <div className="text-[11px] font-mono text-amber-300/90 break-all">
                          {activeScenario.mismatchedReturn}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Evidence & Explorer Action Strip */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href={`${STUDIONET_EXPLORER_URL}/tx/${activeScenario.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-md bg-white text-black hover:bg-zinc-200 text-xs font-medium transition-colors inline-flex items-center gap-1.5"
              >
                View Finalized Tx
                <ExternalLink className="w-3 h-3" />
              </a>

              {activeScenario.evidenceUrl && (
                <a
                  href={activeScenario.evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-md bg-[#101217] hover:bg-[#161920] text-zinc-200 border border-white/[0.08] hover:border-white/[0.14] text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-zinc-400" />
                  Code Evidence
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </a>
              )}

              {activeScenario.releaseEvidenceUrl && (
                <a
                  href={activeScenario.releaseEvidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-md bg-[#101217] hover:bg-[#161920] text-zinc-200 border border-white/[0.08] hover:border-white/[0.14] text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <GitCommitHorizontal className="w-3.5 h-3.5 text-zinc-400" />
                  Release Artifact
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </a>
              )}

              {activeScenario.withdrawTx && (
                <a
                  href={`${STUDIONET_EXPLORER_URL}/tx/${activeScenario.withdrawTx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-md bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14] text-emerald-300 border border-emerald-500/25 text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  Native Transfer Tx
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {activeScenario.expireTx && (
                <a
                  href={`${STUDIONET_EXPLORER_URL}/tx/${activeScenario.expireTx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-md bg-amber-500/[0.08] hover:bg-amber-500/[0.14] text-amber-300 border border-amber-500/25 text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  Trusted-Time Expiry Tx
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Collapsible Cryptographic Proof Drawer */}
            <div className="pt-3 border-t border-white/[0.07]">
              <button
                type="button"
                onClick={() => setShowRaw(!showRaw)}
                className="w-full flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-100 py-1 transition-colors"
              >
                <span className="font-medium">
                  Cryptographic Digests &amp; Raw On-Chain State
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
                  {showRaw ? 'Collapse' : 'Expand'}
                  {showRaw ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </span>
              </button>

              {showRaw && (
                <div className="mt-3 space-y-3">
                  <div className="p-3.5 rounded-md bg-[#050507] border border-white/[0.07] space-y-3 font-mono text-[11px]">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-zinc-500">
                        <span>Transaction Hash</span>
                        <CopyButton text={activeScenario.txHash} label="Copy" />
                      </div>
                      <div className="text-zinc-200 break-all">{activeScenario.txHash}</div>
                    </div>

                    {activeScenario.extractedDigest && (
                      <div className="space-y-1 pt-2 border-t border-white/[0.06]">
                        <div className="flex items-center justify-between text-zinc-500">
                          <span>SHA-256 Combined Evidence / Clause Digest</span>
                          <CopyButton text={activeScenario.extractedDigest} label="Copy" />
                        </div>
                        <div className="text-zinc-300 break-all">
                          {activeScenario.extractedDigest}
                        </div>
                      </div>
                    )}
                  </div>

                  <pre className="p-3.5 rounded-md bg-[#050507] border border-white/[0.07] text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                    {JSON.stringify(activeScenario.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Payable Input Guard Proof: 4-Step Pipeline Table */}
      {invalidInputProof && (
        <section
          aria-label="Payable Input Guard Proof"
          className="border border-white/[0.08] bg-[#0a0b0e] rounded-lg overflow-hidden"
        >
          <div className="px-5 py-3.5 border-b border-white/[0.07] bg-[#07080b] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-xs font-semibold text-zinc-100">
                  Payable Input Guard Proof · Deposit Safety Invariant
                </h3>
                <p className="text-[11px] text-zinc-400">
                  `create_pledge` credits `refundable_balances[caller]` before validation so malformed
                  inputs never strand funds.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-500/[0.08] border border-emerald-500/25 text-emerald-300 tabular-nums">
                {invalidInputProof.accumulatedBalanceWei} wei credited →{' '}
                {invalidInputProof.postWithdrawBalanceWei} wei stranded
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07]">
            {[
              {
                step: '01',
                title: 'Invalid Repo (+1 wei)',
                ret: invalidInputProof.invalidRepoReturn,
                tx: invalidInputProof.invalidRepoTx,
                accent: 'text-amber-300'
              },
              {
                step: '02',
                title: 'Invalid Path (+1 wei)',
                ret: invalidInputProof.invalidPathReturn,
                tx: invalidInputProof.invalidPathTx,
                accent: 'text-amber-300'
              },
              {
                step: '03',
                title: 'Invalid Tag (+1 wei)',
                ret: invalidInputProof.invalidTagReturn,
                tx: invalidInputProof.invalidTagTx,
                accent: 'text-amber-300'
              },
              {
                step: '04',
                title: `Lump-Sum Native Refund (${invalidInputProof.accumulatedBalanceWei} wei withdrawn)`,
                ret: invalidInputProof.withdrawReturn,
                tx: invalidInputProof.withdrawTx,
                accent: 'text-emerald-300'
              }
            ].map((item, idx) => (
              <div key={item.step} className="p-4 space-y-2 relative">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    Step {item.step}
                  </span>
                  {idx < 3 && (
                    <ArrowRight className="hidden lg:block w-3 h-3 text-zinc-600" />
                  )}
                </div>

                <div className="text-xs font-medium text-zinc-100">{item.title}</div>

                <div className={`text-[11px] font-mono break-all ${item.accent}`}>
                  {item.ret}
                </div>

                <div className="pt-1 flex items-center justify-between border-t border-white/[0.05]">
                  <a
                    href={`${STUDIONET_EXPLORER_URL}/tx/${item.tx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-zinc-400 hover:text-white inline-flex items-center gap-1 tabular-nums"
                  >
                    {truncateHash(item.tx, 6, 4)}
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>
                  <CopyButton text={item.tx} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
