import React, { useState } from 'react';
import { Wallet, PlusCircle, ArrowUpRight, Check, Send, RotateCcw, ExternalLink, AlertTriangle } from 'lucide-react';
import { getBrowserSessionClient, validateImmutableEvidenceUrl } from '../lib/genlayerClient';

interface Props {
  contractAddress: string;
}

type TxLifecycleState = 'idle' | 'submitted' | 'pending' | 'accepted' | 'finalized-success' | 'finalized-error';

export const WalletActionPanel: React.FC<Props> = ({ contractAddress }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [packageName, setPackageName] = useState('express');
  const [clauseText, setClauseText] = useState(
    'In Express.js lib/response.js, res.sendFile(path, options, callback) must exist and accept (path, options, callback) arguments.'
  );
  const [claimPledgeId, setClaimPledgeId] = useState('3');
  const [evidenceUrl, setEvidenceUrl] = useState(
    'https://raw.githubusercontent.com/expressjs/express/8368dc178af16b91b576c4c1d135f701a0007e5d/lib/response.js'
  );
  const [anchorSymbol, setAnchorSymbol] = useState('res.sendfile =');
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
        // Fallback to StudioNet session signer
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
          setTxMessage(`Consensus ACCEPTED (Appeal Window Open): ${readable}`);
        } else if (statusName === 'FINALIZED') {
          if (execResult === 'ERROR' || readable.includes('ERROR:')) {
            setTxState('finalized-error');
            setTxMessage(`Finalized with error: ${readable || 'execution error'}`);
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
      setTxMessage('Broadcasting create_pledge transaction to StudioNet (Chain 61999)...');
      const hash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: 'create_pledge',
        args: [packageName, clauseText, 2592000, 86400],
        value: 1n
      });
      setTxHash(hash);
      setTxMessage(`Tx submitted (${hash.slice(0, 12)}...). Waiting for RuleGate validator consensus...`);
      await pollLiveTransaction(hash);
    } catch (err: any) {
      setTxState('finalized-error');
      setTxMessage(err?.message || 'Transaction submission failed');
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
      setTxMessage('Broadcasting submit_and_judge_claim to StudioNet...');
      const hash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: 'submit_and_judge_claim',
        args: [Number(claimPledgeId), evidenceUrl, anchorSymbol]
      });
      setTxHash(hash);
      setTxMessage(`Claim submitted (${hash.slice(0, 12)}...). Validators fetching artifact & checking quote...`);
      await pollLiveTransaction(hash);
    } catch (err: any) {
      setTxState('finalized-error');
      setTxMessage(err?.message || 'Claim submission failed');
    }
  };

  const handleWithdrawRefundable = async () => {
    try {
      const { client, account: sessionAcc } = getBrowserSessionClient();
      if (!account) setAccount(sessionAcc.address);
      setTxState('submitted');
      setTxMessage('Broadcasting withdraw_refundable() to StudioNet...');
      const hash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: 'withdraw_refundable',
        args: []
      });
      setTxHash(hash);
      await pollLiveTransaction(hash);
    } catch (err: any) {
      setTxState('finalized-error');
      setTxMessage(err?.message || 'Withdraw failed');
    }
  };

  const urlCheck = validateImmutableEvidenceUrl(evidenceUrl);

  return (
    <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-100 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-400" />
            End-to-End Interactive StudioNet Wallet Flows
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Fund & Create Pledge (RuleGate), Submit Breaking-Change Claim, or Withdraw Refundable Balance on Chain 61999.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {account ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              Connect StudioNet Wallet
            </button>
          )}
          <button
            onClick={handleWithdrawRefundable}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            Withdraw Refundable
          </button>
        </div>
      </div>

      {/* Accurate 5-State Transaction Status Banner */}
      {txState !== 'idle' && (
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-400">Tx State:</span>
              <span
                className={`px-2 py-0.5 rounded font-semibold uppercase ${
                  txState === 'finalized-success'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : txState === 'finalized-error'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-indigo-500/20 text-indigo-300'
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
                className="font-mono text-xs text-indigo-400 hover:underline flex items-center gap-1"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          {txMessage && <p className="text-xs text-slate-300 font-mono">{txMessage}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Pledge Form */}
        <form onSubmit={handleCreatePledge} className="space-y-3 p-4 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-indigo-400" />
            1. Fund & Create Stability Pledge (Payable + RuleGate)
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Package / API Name</label>
            <input
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">
              Frozen Compatibility Clause (Rejected if vague/subjective)
            </label>
            <textarea
              rows={3}
              value={clauseText}
              onChange={(e) => setClauseText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-xs transition flex items-center justify-center gap-1.5"
          >
            Lock 1 wei Bond & Run RuleGate Check
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Submit Claim Form */}
        <form onSubmit={handleSubmitClaim} className="space-y-3 p-4 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Send className="w-4 h-4 text-indigo-400" />
            2. Submit Breaking-Change Claim (Pinned Evidence)
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Pledge ID</label>
              <input
                type="text"
                value={claimPledgeId}
                onChange={(e) => setClaimPledgeId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Target Anchor Symbol</label>
              <input
                type="text"
                value={anchorSymbol}
                onChange={(e) => setAnchorSymbol(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">
              Immutable Evidence URL (40-hex GitHub SHA or Archive.org id_)
            </label>
            <input
              type="text"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-mono">
              {urlCheck.valid ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> {urlCheck.message}
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {urlCheck.message}
                </span>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-medium text-xs transition flex items-center justify-center gap-1.5"
          >
            Submit Claim for Validator Consensus
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
