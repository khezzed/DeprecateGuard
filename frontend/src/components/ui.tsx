import React, { useState } from 'react';
import { Check, Copy, ExternalLink, FileCode2 } from 'lucide-react';

export const SURFACE_CARD =
  'border border-white/[0.08] bg-[#0a0b0e] rounded-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]';

export function truncateHash(hash?: string | null, start = 6, end = 4): string {
  if (!hash) return '';
  if (hash.length <= start + end + 3) return hash;
  return `${hash.slice(0, start)}…${hash.slice(-end)}`;
}

/**
 * Unwraps double-encoded contract return strings from StudioNet receipts
 * into clean, human-scannable protocol status strings.
 */
export function formatContractReturn(raw?: string | null): string {
  if (!raw) return '';
  let text = raw.trim();
  for (let i = 0; i < 2; i++) {
    if (text.startsWith('"') && text.endsWith('"')) {
      try {
        const parsed = JSON.parse(text);
        if (typeof parsed === 'string') {
          text = parsed.trim();
          continue;
        }
      } catch {
        text = text.slice(1, -1);
      }
    }
    break;
  }
  text = text.replace(/\\"/g, '"');

  const withdrawnMatch = text.match(/^WITHDRAWN:Address\("?(0x[a-fA-F0-9]+)"?\):(\d+)$/);
  if (withdrawnMatch) {
    const [, addr, amount] = withdrawnMatch;
    return `WITHDRAWN · ${amount} wei → ${truncateHash(addr, 6, 4)}`;
  }

  const errorMatch = text.match(/^ERROR:([A-Z0-9_]+)$/);
  if (errorMatch) {
    return `ERROR · ${errorMatch[1]}`;
  }

  const expiredMatch = text.match(/^PLEDGE_EXPIRED_REFUNDED:PLEDGE_(\d+)$/);
  if (expiredMatch) {
    return `EXPIRED_REFUNDED · Pledge #${expiredMatch[1]}`;
  }

  return text;
}

export const CopyButton: React.FC<{
  text: string;
  label?: string;
  className?: string;
}> = ({ text, label, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copy ${text}`}
      className={`inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-100 transition-colors ${className}`}
    >
      {copied ? (
        <Check className="w-3 h-3 text-emerald-400" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
      {label && <span>{copied ? 'Copied' : label}</span>}
    </button>
  );
};

export interface OutcomeMeta {
  shortLabel: string;
  fullLabel: string;
  dotClass: string;
  pillClass: string;
}

export const OUTCOME_CONFIG: Record<string, OutcomeMeta> = {
  BREAKING_CONFIRMED: {
    shortLabel: 'Breach Paid',
    fullLabel: 'Breaking Change Confirmed — Bounty Paid',
    dotClass: 'bg-rose-400',
    pillClass: 'text-rose-300 border-rose-500/25 bg-rose-500/[0.07]'
  },
  NON_BREAKING: {
    shortLabel: 'Non-Breaking',
    fullLabel: 'No Breaking Change — Claim Dismissed',
    dotClass: 'bg-sky-400',
    pillClass: 'text-sky-300 border-sky-500/25 bg-sky-500/[0.07]'
  },
  ACCEPTED: {
    shortLabel: 'Approved',
    fullLabel: 'Pledge Approved & Active',
    dotClass: 'bg-emerald-400',
    pillClass: 'text-emerald-300 border-emerald-500/25 bg-emerald-500/[0.07]'
  },
  OPEN: {
    shortLabel: 'Open',
    fullLabel: 'Stability Pledge Open',
    dotClass: 'bg-emerald-400',
    pillClass: 'text-emerald-300 border-emerald-500/25 bg-emerald-500/[0.07]'
  },
  REJECTED_VAGUE: {
    shortLabel: 'Vague Refund',
    fullLabel: 'Vague Pledge Rejected — Native Refund',
    dotClass: 'bg-amber-400',
    pillClass: 'text-amber-300 border-amber-500/25 bg-amber-500/[0.07]'
  },
  INSUFFICIENT_EVIDENCE: {
    shortLabel: 'Expired Refund',
    fullLabel: 'Symbol Not Found — Trusted-Time Expiry',
    dotClass: 'bg-amber-400',
    pillClass: 'text-amber-300 border-amber-500/25 bg-amber-500/[0.07]'
  },
  EXPIRED_REFUNDED: {
    shortLabel: 'Expired Refund',
    fullLabel: 'Expired & Refunded',
    dotClass: 'bg-amber-400',
    pillClass: 'text-amber-300 border-amber-500/25 bg-amber-500/[0.07]'
  }
};

export function getOutcomeMeta(outcome?: string): OutcomeMeta {
  if (outcome && OUTCOME_CONFIG[outcome]) {
    return OUTCOME_CONFIG[outcome];
  }
  return {
    shortLabel: outcome || 'Unknown',
    fullLabel: outcome || 'Unknown Outcome',
    dotClass: 'bg-zinc-400',
    pillClass: 'text-zinc-300 border-white/[0.1] bg-white/[0.04]'
  };
}

/**
 * Lightweight token highlighter for JS/Python code quotes.
 * Preserves exact character content inside each line.
 */
function highlightCodeLine(line: string): React.ReactNode {
  const tokenRegex =
    /('[^']*'|"[^"]*"|\b(?:function|def|const|let|var|return|self|res|deprecate)\b|[A-Za-z_][A-Za-z0-9_]*(?=\s*\()|#.*$|\/\/.*$)/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(line.slice(lastIndex, match.index));
    }
    const token = match[0];
    let cls = 'text-zinc-200';
    if (token.startsWith("'") || token.startsWith('"')) {
      cls = 'text-emerald-300';
    } else if (token.startsWith('#') || token.startsWith('//')) {
      cls = 'text-zinc-500 italic';
    } else if (
      token === 'function' ||
      token === 'def' ||
      token === 'const' ||
      token === 'let' ||
      token === 'var' ||
      token === 'return'
    ) {
      cls = 'text-sky-300';
    } else if (token === 'self' || token === 'res' || token === 'deprecate') {
      cls = 'text-amber-200';
    } else {
      cls = 'text-white font-medium';
    }
    nodes.push(
      <span key={keyIdx++} className={cls}>
        {token}
      </span>
    );
    lastIndex = match.index + token.length;
  }

  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }
  return nodes.length > 0 ? nodes : line;
}

export const CodeEvidenceFrame: React.FC<{
  filePath: string;
  code: string;
  commitSha?: string;
  anchorSymbol?: string;
  evidenceUrl?: string;
  subtitle?: string;
}> = ({ filePath, code, commitSha, anchorSymbol, evidenceUrl, subtitle }) => {
  const lines = code.split('\n');

  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#07080b] overflow-hidden">
      {/* Editor Tab Bar */}
      <div className="px-3.5 py-2 bg-[#101217] border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="text-xs font-mono text-zinc-200 truncate">{filePath}</span>
          {commitSha && (
            <span className="text-[11px] font-mono text-zinc-400 bg-[#161920] border border-white/[0.07] px-1.5 py-0.5 rounded tabular-nums">
              {commitSha.slice(0, 8)}
            </span>
          )}
          {subtitle && (
            <span className="hidden sm:inline text-[11px] text-zinc-500">· {subtitle}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {anchorSymbol && (
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400">
              <span className="text-zinc-500">anchor:</span>
              <code className="text-zinc-200">{anchorSymbol}</code>
            </span>
          )}
          <CopyButton text={code} label="Copy" />
          {evidenceUrl && (
            <a
              href={evidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Raw
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Code Viewport with Line Numbers */}
      <div className="p-3 overflow-x-auto">
        <table className="w-full border-collapse font-mono text-[12px] leading-6">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02]">
                <td className="select-none text-right pr-4 pl-1 text-zinc-600 w-8 align-top tabular-nums border-r border-white/[0.05]">
                  {idx + 1}
                </td>
                <td className="pl-4 pr-2 text-zinc-200 whitespace-pre-wrap break-words">
                  {highlightCodeLine(line)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
