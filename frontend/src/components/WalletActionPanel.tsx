import React, { useState } from 'react';
import {
  Wallet,
  ShieldPlus,
  FileWarning,
  ArrowUpRight,
  Check,
  RotateCcw,
  ExternalLink,
  AlertTriangle,
  Sparkles,
  Loader2
} from 'lucide-react';
import { getBrowserSessionClient, validateImmutableEvidenceUrl } from '../lib/genlayerClient';

interface Props {
  contractAddress: string;
}

type TxLifecycleState = 'idle' | 'submitted' | 'pending' | 'accepted' | 'finalized-success' | 'finalized-error';

export const WalletActionPanel: React.FC<Props> = ({ contractAddress }) => {
  const [mode, setMode] = useState<'pledge' | 'claim'>('pledge');
  const [account, setAccount] = useState<string | null>(null);

  // Pledge inputs
  const [packageName, setPackageName] = useState('express');
  const [clauseText, setClauseText] = useState(
    'In Express.js lib/response.js, res.sendFile(path, options, callback) must exist and accept (path, options, callback) arguments.'
  );

  // Claim inputs
  const [claimPledgeId, setClaimPledgeId] = useState('3');
  const [evidenceUrl, setEvidenceUrl] = useState(
    'https://raw.githubusercontent.com/expressjs/express/8368dc178af16b91b576c4c1d135f701a0007e5d/lib/response.js'
  );
  const [anchorSymbol, setAnchorSymbol] = useState('res.sendfile =');

  // Transaction state
  const [txState, setTxState] = useState<TxLifecycleState>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txMessage, setTxMessage] = useState<string | null>(null);

  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts[0]) {
          setAccount(accounts[0]);
          return;
        }
      } catch {
        // Fallback to StudioNet burner session
      }
    }
    const { account: sessionAccount } = getBrowserSessionClient();
    setAccount(sessionAccount.address);
  };

  const pollLiveTransaction = async (hash: string) => {
    const { client } = getBrowserSessionClient();
    setTxState('pending');
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 8000));
      try {
        const tx: any = await client.getTransaction({ hash: hash as `0x${string}` });
        const statusName = tx.statusName || 'PENDING';
        const lr = tx.consensus_data?.leader_receipt?.[0];
        const execResult = lr?.execution_result;
        const readable = lr?.result?.payload?.readable || '';

        if (statusName === 'ACCEPTED') {
          setTxState('accepted');
          setTxMessage(`Validators agreed on verdict (${readable}). Waiting for finality...`);
        } else if (statusName === 'FINALIZED') {
          if (execResult === 'ERROR' || readable.includes('ERROR:')) {
            setTxState('finalized-error');
            setTxMessage(`Transaction finalized with error: ${readable || 'execution error'}`);
          } else {
            setTxState('finalized-success');
            setTxMessage(`Finalized on StudioNet: ${readable}`);
          }
          return;
        }
      } catch {
        // Continue polling every 8s
      }
    }
  };

  const handleCreatePledge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { client, account: sessionAcc } = getBrowserSessionClient();
      if (!account) setAccount(sessionAcc.address);
      setTxState('submitted');
      setTxMessage('Submitting stability pledge to GenLayer StudioNet...');
      const hash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: 'create_pledge',
        args: [packageName, clauseText, 2592000, 86400],
        value: 1n
      });
      setTxHash(hash);
      setTxMessage('Transaction submitted. Validators are checking whether your compatibility rule is testable...');
      await pollLiveTransaction(hash);
    } catch (err: any) {
      setTxState('finalized-error');
      setTxMessage(err?.message || 'Could not submit transaction');
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    const urlCheck = validateImmutableEvidenceUrl(evidenceUrl);
    if (!urlCheck.valid) {
      setTxState('finalized-error');
      setTxMessage(urlCheck.message);
      return;
    }
    try {
      const { client, account: sessionAcc } = getBrowserSessionClient();
      if (!account) setAccount(sessionAcc.address);
      setTxState('submitted');
      setTxMessage('Submitting claim to GenLayer StudioNet...');
      const hash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: 'submit_and_judge_claim',
        args: [Number(claimPledgeId), evidenceUrl, anchorSymbol]
      });
      setTxHash(hash);
      setTxMessage('Claim submitted. Validators are fetching the source commit and verifying the code...');
      await pollLiveTransaction(hash);
    } catch (err: any) {
      setTxState('finalized-error');
      setTxMessage(err?.message || 'Could not submit claim');
    }
  };

  const handleWithdrawRefundable = async () => {
    try {
      const { client, account: sessionAcc } = getBrowserSessionClient();
      if (!account) setAccount(sessionAcc.address);
      setTxState('submitted');
      setTxMessage('Requesting refund withdrawal on StudioNet...');
      const hash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: 'withdraw_refundable',
        args: []
      });
      setTxHash(hash);
      await pollLiveTransaction(hash);
    } catch (err: any) {
      setTxState('finalized-error');
      setTxMessage(err?.message || 'Withdrawal failed');
    }
  };

  const urlCheck = validateImmutableEvidenceUrl(evidenceUrl);
  const isBusy = txState === 'submitted' || txState === 'pending' || txState === 'accepted';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Wallet Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Submit a Live Transaction on StudioNet</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test creating a stability bond or filing a breaking-change claim directly on Chain 61999.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {account ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs text-emerald-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition flex items-center gap-1.5"
            >
              <Wallet className="w-3.5 h-3.5" />
              Connect Wallet
            </button>
          )}
          <button
            onClick={handleWithdrawRefundable}
            disabled={isBusy}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            Withdraw Refunds
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 gap-3 p-1.5 rounded-xl bg-slate-900 border border-slate-800">
        <button
          onClick={() => setMode('pledge')}
          className={`py-2.5 px-4 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 ${
            mode === 'pledge'
              ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldPlus className="w-4 h-4" />
          1. Create a Stability Pledge
        </button>
        <button
          onClick={() => setMode('claim')}
          className={`py-2.5 px-4 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 ${
            mode === 'claim'
              ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileWarning className="w-4 h-4" />
          2. File a Breaking-Change Claim
        </button>
      </div>

      {/* Live Transaction Progress Banner */}
      {txState !== 'idle' && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              {isBusy && <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />}
              <span
                className={`px-2.5 py-0.5 rounded-full font-mono font-medium uppercase text-[11px] ${
                  txState === 'finalized-success'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : txState === 'finalized-error'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                }`}
              >
                {txState}
              </span>
            </div>
            {txHash && (
              <a
                href={`https://explorer-studio.genlayer.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-sky-400 hover:underline flex items-center gap-1"
              >
                View on StudioNet Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          {txMessage && <p className="text-xs text-slate-300 leading-relaxed">{txMessage}</p>}
        </div>
      )}

      {/* Form 1: Create Pledge */}
      {mode === 'pledge' ? (
        <form
          onSubmit={handleCreatePledge}
          className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-semibold text-white">New API Compatibility Pledge</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Validators check that your rule names a specific file, function, or signature before opening the bond.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setPackageName('express');
                  setClauseText(
                    'In Express.js lib/response.js, res.sendFile(path, options, callback) must exist and accept (path, options, callback) arguments.'
                  );
                }}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] text-sky-300 border border-slate-700 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Load Valid Example
              </button>
              <button
                type="button"
                onClick={() => {
                  setPackageName('express-vague');
                  setClauseText(
                    'We promise our API will always remain modern, fast, and developer-friendly for everyone.'
                  );
                }}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] text-amber-300 border border-slate-700"
              >
                Load Vague Example (Rejected)
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Package or Library Name</label>
              <input
                type="text"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="e.g. express"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Backward-Compatibility Promise
              </label>
              <textarea
                rows={3}
                value={clauseText}
                onChange={(e) => setClauseText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 leading-relaxed"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                If validators reject your rule as too vague, your deposit is automatically credited to your refundable balance.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isBusy}
            className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2"
          >
            Create Stability Pledge on StudioNet
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </form>
      ) : (
        /* Form 2: Submit Claim */
        <form
          onSubmit={handleSubmitClaim}
          className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-semibold text-white">File a Breaking-Change Claim</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Provide a commit-pinned GitHub link showing the code change that violated the pledge.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setClaimPledgeId('3');
                  setAnchorSymbol('res.sendfile =');
                  setEvidenceUrl(
                    'https://raw.githubusercontent.com/expressjs/express/8368dc178af16b91b576c4c1d135f701a0007e5d/lib/response.js'
                  );
                }}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] text-rose-300 border border-slate-700"
              >
                Preset: Breaking Change
              </button>
              <button
                type="button"
                onClick={() => {
                  setClaimPledgeId('1');
                  setAnchorSymbol('res.sendFile = function sendFile');
                  setEvidenceUrl(
                    'https://raw.githubusercontent.com/expressjs/express/8368dc178af16b91b576c4c1d135f701a0007e5d/lib/response.js'
                  );
                }}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] text-sky-300 border border-slate-700"
              >
                Preset: Non-Breaking
              </button>
              <button
                type="button"
                onClick={() => {
                  setClaimPledgeId('4');
                  setAnchorSymbol('def inject(self, clean_data, idx, target_task):');
                  setEvidenceUrl(
                    'https://raw.githubusercontent.com/liu00222/Open-Prompt-Injection/fbed5cca347488f88363790ae3ae97c56116da6a/OpenPromptInjection/attackers/CombineAttacker.py'
                  );
                }}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] text-purple-300 border border-slate-700"
              >
                Preset: Prompt Injection
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Pledge ID</label>
              <input
                type="number"
                min={1}
                value={claimPledgeId}
                onChange={(e) => setClaimPledgeId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Function or Symbol to Inspect
              </label>
              <input
                type="text"
                value={anchorSymbol}
                onChange={(e) => setAnchorSymbol(e.target.value)}
                placeholder="e.g. res.sendfile ="
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Pinned Source File URL (GitHub 40-char Commit SHA)
            </label>
            <input
              type="text"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
            />
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {urlCheck.valid ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Immutable commit-pinned URL ready for validator fetch
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {urlCheck.message}
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isBusy || !urlCheck.valid}
            className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2"
          >
            Submit Claim for Validator Judgment
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
};
