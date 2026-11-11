import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ShieldPlus,
  FileWarning,
  RotateCcw,
  ExternalLink,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import {
  getBrowserSessionClient,
  getInjectedWalletClient,
  validateImmutableEvidenceUrl,
  validateRepoAndPath,
  STUDIONET_EXPLORER_URL
} from '../lib/genlayerClient';

interface Props {
  contractAddress: string;
}

type TxLifecycleState = 'idle' | 'submitted' | 'pending' | 'accepted' | 'finalized-success' | 'finalized-error';
type WalletMode = 'burner' | 'injected';

export const WalletActionPanel: React.FC<Props> = ({ contractAddress }) => {
  const [walletMode, setWalletMode] = useState<WalletMode>('burner');
  const [displayedAccount, setDisplayedAccount] = useState<string>('');
  const [mode, setMode] = useState<'pledge' | 'claim'>('pledge');

  // Pledge inputs (Pledge-Bound Repo & Path)
  const [packageName, setPackageName] = useState('express');
  const [repoFullName, setRepoFullName] = useState('expressjs/express');
  const [targetFilePath, setTargetFilePath] = useState('lib/response.js');
  const [baselineTag, setBaselineTag] = useState('4.17.1');
  const [clauseText, setClauseText] = useState(
    'In Express.js lib/response.js, res.sendFile(path, options, callback) must exist and accept (path, options, callback) arguments without being removed.'
  );

  // Claim inputs (Pledge-Bound Release & Evidence)
  const [claimPledgeId, setClaimPledgeId] = useState('3');
  const [releaseTag, setReleaseTag] = useState('4.18.2');
  const [commitSha, setCommitSha] = useState('8368dc178af16b91b576c4c1d135f701a0007e5d');
  const [releaseEvidenceUrl, setReleaseEvidenceUrl] = useState(
    'https://raw.githubusercontent.com/expressjs/express/8368dc178af16b91b576c4c1d135f701a0007e5d/History.md'
  );
  const [evidenceUrl, setEvidenceUrl] = useState(
    'https://raw.githubusercontent.com/expressjs/express/8368dc178af16b91b576c4c1d135f701a0007e5d/lib/response.js'
  );
  const [anchorSymbol, setAnchorSymbol] = useState('res.sendfile =');

  // Transaction state
  const [txState, setTxState] = useState<TxLifecycleState>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txMessage, setTxMessage] = useState<string | null>(null);

  // Initialize wallet display
  useEffect(() => {
    initBurnerWallet();
  }, []);

  const initBurnerWallet = () => {
    const session = getBrowserSessionClient();
    setWalletMode('burner');
    setDisplayedAccount(session.address);
  };

  const handleConnectInjected = async () => {
    try {
      const injected = await getInjectedWalletClient();
      setWalletMode('injected');
      setDisplayedAccount(injected.address);
      setTxMessage(`Connected to injected wallet: ${injected.address.slice(0, 8)}...`);
    } catch (err: any) {
      alert(`Could not connect browser wallet: ${err.message}. Falling back to embedded burner wallet.`);
      initBurnerWallet();
    }
  };

  const getActiveClient = async () => {
    if (walletMode === 'injected') {
      const injected = await getInjectedWalletClient();
      // Strict steward check: displayed account MUST equal signing account
      if (injected.address.toLowerCase() !== displayedAccount.toLowerCase()) {
        throw new Error(`Wallet mismatch! Displayed ${displayedAccount} differs from signer ${injected.address}`);
      }
      return { client: injected.client, address: injected.address };
    } else {
      const session = getBrowserSessionClient();
      if (session.address.toLowerCase() !== displayedAccount.toLowerCase()) {
        throw new Error(`Wallet mismatch! Displayed ${displayedAccount} differs from signer ${session.address}`);
      }
      return { client: session.client, address: session.address };
    }
  };

  const pollLiveTransaction = async (hash: string) => {
    const { client } = await getActiveClient();
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
          setTxMessage(`Validators agreed on outcome (${readable}). Waiting for finality...`);
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
    const repoCheck = validateRepoAndPath(repoFullName, targetFilePath);
    if (!repoCheck.valid) {
      setTxState('finalized-error');
      setTxMessage(repoCheck.message);
      return;
    }

    try {
      const { client, address: signerAddr } = await getActiveClient();
      setTxState('submitted');
      setTxMessage(`Signing from active account ${signerAddr.slice(0, 8)}... Submitting stability pledge...`);
      const hash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: 'create_pledge',
        args: [
          packageName,
          repoFullName,
          targetFilePath,
          baselineTag,
          clauseText,
          2592000,
          86400
        ],
        value: 1n
      });
      setTxHash(hash);
      setTxMessage('Transaction submitted. Validators checking pledge clarity and observable boundaries...');
      await pollLiveTransaction(hash);
    } catch (err: any) {
      setTxState('finalized-error');
      setTxMessage(err?.message || 'Could not submit pledge');
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    const evidenceCheck = validateImmutableEvidenceUrl(evidenceUrl);
    if (!evidenceCheck.valid) {
      setTxState('finalized-error');
      setTxMessage(evidenceCheck.message);
      return;
    }
    const releaseCheck = validateImmutableEvidenceUrl(releaseEvidenceUrl);
    if (!releaseCheck.valid) {
      setTxState('finalized-error');
      setTxMessage(releaseCheck.message);
      return;
    }

    try {
      const { client, address: signerAddr } = await getActiveClient();
      setTxState('submitted');
      setTxMessage(`Signing from active account ${signerAddr.slice(0, 8)}... Submitting claim...`);
      const hash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: 'submit_and_judge_claim',
        args: [
          Number(claimPledgeId),
          releaseTag,
          commitSha,
          releaseEvidenceUrl,
          evidenceUrl,
          anchorSymbol
        ]
      });
      setTxHash(hash);
      setTxMessage('Claim submitted. Validators verifying pledge-bound repository and release evidence...');
      await pollLiveTransaction(hash);
    } catch (err: any) {
      setTxState('finalized-error');
      setTxMessage(err?.message || 'Could not submit claim');
    }
  };

  const handleWithdrawRefundable = async () => {
    try {
      const { client, address: signerAddr } = await getActiveClient();
      setTxState('submitted');
      setTxMessage(`Signing from active account ${signerAddr.slice(0, 8)}... Requesting real native transfer...`);
      const hash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: 'withdraw_refundable',
        args: []
      });
      setTxHash(hash);
      setTxMessage('Withdrawal submitted. Contract executing real native transfer via gl.get_contract_at(caller).emit_transfer...');
      await pollLiveTransaction(hash);
    } catch (err: any) {
      setTxState('finalized-error');
      setTxMessage(err?.message || 'Withdrawal failed');
    }
  };

  const isBusy = txState === 'submitted' || txState === 'pending' || txState === 'accepted';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Wallet Bar with Strict Signer Display */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              Live StudioNet Transactions (Chain 61999)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict Signer Guarantee: The displayed wallet address is the exact account signing each transaction.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={initBurnerWallet}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                walletMode === 'burner'
                  ? 'bg-sky-500 text-slate-950 shadow-sm shadow-sky-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Embedded Burner
            </button>
            <button
              onClick={handleConnectInjected}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                walletMode === 'injected'
                  ? 'bg-sky-500 text-slate-950 shadow-sm shadow-sky-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              MetaMask
            </button>
          </div>
        </div>

        {/* Displayed Signing Account Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs text-slate-400">Signing Account:</span>
            <span className="font-mono text-xs text-emerald-300 font-bold">
              {displayedAccount || 'Loading...'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase font-mono">
              {walletMode}
            </span>
          </div>

          <button
            onClick={handleWithdrawRefundable}
            disabled={isBusy}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Withdraw Native Tokens (Real Transfer)
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
          1. Create Stability Pledge (Pledge-Bound)
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
          2. File Breaking Claim (Release-Bound)
        </button>
      </div>

      {/* Transaction Progress Banner */}
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
                href={`${STUDIONET_EXPLORER_URL}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-sky-400 hover:underline flex items-center gap-1"
              >
                View on StudioNet Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          {txMessage && <p className="text-xs text-slate-300 font-mono">{txMessage}</p>}
        </div>
      )}

      {/* Form Section */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
        {mode === 'pledge' ? (
          <form onSubmit={handleCreatePledge} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Package Name</label>
                <input
                  type="text"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pledge-Bound Repository (<span className="text-sky-400">owner/repo</span>)
                </label>
                <input
                  type="text"
                  value={repoFullName}
                  onChange={(e) => setRepoFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                  placeholder="expressjs/express"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target File Path (Bound Relative Path)
                </label>
                <input
                  type="text"
                  value={targetFilePath}
                  onChange={(e) => setTargetFilePath(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                  placeholder="lib/response.js"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Baseline Version / Tag</label>
                <input
                  type="text"
                  value={baselineTag}
                  onChange={(e) => setBaselineTag(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                  placeholder="4.17.1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                API Compatibility Clause (RuleGate Validated)
              </label>
              <textarea
                rows={3}
                value={clauseText}
                onChange={(e) => setClauseText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <ShieldPlus className="w-4 h-4" />
              Sign & Create Stability Pledge (Signs with {displayedAccount.slice(0, 8)}...)
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmitClaim} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Pledge ID</label>
                <input
                  type="number"
                  value={claimPledgeId}
                  onChange={(e) => setClaimPledgeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Release Version / Tag</label>
                <input
                  type="text"
                  value={releaseTag}
                  onChange={(e) => setReleaseTag(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                  placeholder="4.18.2"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Commit SHA (40-hex)</label>
                <input
                  type="text"
                  value={commitSha}
                  onChange={(e) => setCommitSha(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                  placeholder="8368dc178af16b91b576c4c1d135f701a0007e5d"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Release Evidence Artifact URL (<span className="text-sky-400">Changelog/Tag</span>)
              </label>
              <input
                type="url"
                value={releaseEvidenceUrl}
                onChange={(e) => setReleaseEvidenceUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Target Source Code Evidence URL (<span className="text-sky-400">Must match pledge repo & file</span>)
              </label>
              <input
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Anchor Symbol</label>
              <input
                type="text"
                value={anchorSymbol}
                onChange={(e) => setAnchorSymbol(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                placeholder="res.sendfile ="
                required
              />
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <FileWarning className="w-4 h-4" />
              Sign & Submit Breaking Claim (Signs with {displayedAccount.slice(0, 8)}...)
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
