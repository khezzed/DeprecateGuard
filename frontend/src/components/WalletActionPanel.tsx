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
  ShieldCheck,
  Clock,
  Sparkles
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
type ActionMode = 'pledge' | 'claim' | 'expire';

export const WalletActionPanel: React.FC<Props> = ({ contractAddress }) => {
  const [walletMode, setWalletMode] = useState<WalletMode>('burner');
  const [displayedAccount, setDisplayedAccount] = useState<string>('');
  const [mode, setMode] = useState<ActionMode>('pledge');

  // Pledge inputs (Pledge-Bound Repo & Path)
  const [packageName, setPackageName] = useState('express');
  const [repoFullName, setRepoFullName] = useState('expressjs/express');
  const [targetFilePath, setTargetFilePath] = useState('lib/response.js');
  const [baselineTag, setBaselineTag] = useState('4.17.1');
  const [clauseText, setClauseText] = useState(
    'In Express.js lib/response.js, the res.sendFile(path, options, callback) method must exist and accept (path, options, callback) arguments without being removed.'
  );
  const [pledgeDuration, setPledgeDuration] = useState('2592000');
  const [gracePeriod, setGracePeriod] = useState('86400');

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

  // Expiration inputs
  const [expirePledgeId, setExpirePledgeId] = useState('5');

  // Transaction state
  const [txState, setTxState] = useState<TxLifecycleState>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txMessage, setTxMessage] = useState<string | null>(null);

  // Initialize wallet display
  useEffect(() => {
    initBurnerWallet();
  }, []);

  // Strict Steward Fix: accountsChanged listener for MetaMask / injected provider
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const eth = (window as any).ethereum;
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          if (walletMode === 'injected') {
            setDisplayedAccount(accounts[0]);
            setTxMessage(`Switched active MetaMask account to ${accounts[0].slice(0, 8)}...`);
          }
        } else {
          initBurnerWallet();
        }
      };
      eth.on?.('accountsChanged', handleAccountsChanged);
      return () => {
        eth.removeListener?.('accountsChanged', handleAccountsChanged);
      };
    }
  }, [walletMode]);

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
    setTxState('pending');
    let attempts = 0;
    const maxAttempts = 50;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const { client } = await getActiveClient();
        const tx = await client.getTransaction({ hash: hash as `0x${string}` });
        const statusName =
          tx.statusName ||
          (tx.consensus_history?.current_status_changes?.includes('FINALIZED') ? 'FINALIZED' : 'PENDING');
        const execResult = tx.consensus_data?.leader_receipt?.[0]?.execution_result;
        const readableReturn = tx.consensus_data?.leader_receipt?.[0]?.result?.payload?.readable || '';

        if (statusName === 'ACCEPTED') {
          setTxState('accepted');
          setTxMessage(`Transaction accepted by leader. Waiting for decentralized validator finality...`);
        }

        if (statusName === 'FINALIZED') {
          clearInterval(interval);
          if (execResult === 'SUCCESS') {
            setTxState('finalized-success');
            setTxMessage(`Transaction FINALIZED on StudioNet! Result: ${readableReturn}`);
          } else {
            setTxState('finalized-error');
            setTxMessage(`Transaction finalized with status ${execResult}: ${readableReturn}`);
          }
        }
      } catch (err) {
        console.warn('Polling check error:', err);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setTxState('pending');
        setTxMessage('Polling timed out. Transaction is still processing on StudioNet.');
      }
    }, 4000);
  };

  // 1-Click Preset Loaders
  const loadPresetValidPledge = () => {
    setPackageName('express');
    setRepoFullName('expressjs/express');
    setTargetFilePath('lib/response.js');
    setBaselineTag('4.17.1');
    setClauseText(
      'In Express.js lib/response.js, the res.sendFile(path, options, callback) method must exist and accept (path, options, callback) arguments without being removed.'
    );
    setPledgeDuration('2592000');
    setGracePeriod('86400');
    setTxMessage('Loaded valid Express.js res.sendFile preset.');
  };

  const loadPresetVaguePledge = () => {
    setPackageName('express-vague');
    setRepoFullName('expressjs/express');
    setTargetFilePath('lib/response.js');
    setBaselineTag('4.17.1');
    setClauseText(
      'We promise our API will always stay modern, ergonomic, fast, and developer-friendly for everyone.'
    );
    setPledgeDuration('86400');
    setGracePeriod('3600');
    setTxMessage('Loaded subjective/vague marketing pledge preset (triggers RuleGate REJECTED_VAGUE).');
  };

  const loadPresetBreakingClaim = () => {
    setClaimPledgeId('3');
    setReleaseTag('4.18.2');
    setCommitSha('8368dc178af16b91b576c4c1d135f701a0007e5d');
    setReleaseEvidenceUrl('https://raw.githubusercontent.com/expressjs/express/8368dc178af16b91b576c4c1d135f701a0007e5d/History.md');
    setEvidenceUrl('https://raw.githubusercontent.com/expressjs/express/8368dc178af16b91b576c4c1d135f701a0007e5d/lib/response.js');
    setAnchorSymbol('res.sendfile =');
    setTxMessage('Loaded breaking deprecation claim preset (res.sendfile = deprecate.function).');
  };

  const loadPresetNonBreakingClaim = () => {
    setClaimPledgeId('1');
    setReleaseTag('4.18.2');
    setCommitSha('8368dc178af16b91b576c4c1d135f701a0007e5d');
    setReleaseEvidenceUrl('https://raw.githubusercontent.com/expressjs/express/8368dc178af16b91b576c4c1d135f701a0007e5d/History.md');
    setEvidenceUrl('https://raw.githubusercontent.com/expressjs/express/8368dc178af16b91b576c4c1d135f701a0007e5d/lib/response.js');
    setAnchorSymbol('res.sendFile = function sendFile');
    setTxMessage('Loaded intact non-breaking claim preset (res.sendFile preserved).');
  };

  const loadPresetInjectionClaim = () => {
    setClaimPledgeId('4');
    setReleaseTag('torch==2.3.1');
    setCommitSha('fbed5cca347488f88363790ae3ae97c56116da6a');
    setReleaseEvidenceUrl('https://raw.githubusercontent.com/liu00222/Open-Prompt-Injection/fbed5cca347488f88363790ae3ae97c56116da6a/environment.yml');
    setEvidenceUrl('https://raw.githubusercontent.com/liu00222/Open-Prompt-Injection/fbed5cca347488f88363790ae3ae97c56116da6a/OpenPromptInjection/attackers/CombineAttacker.py');
    setAnchorSymbol('def inject(self, clean_data, idx, target_task):');
    setTxMessage('Loaded prompt-injection defense preset (CombineAttacker.py with untrusted tags).');
  };

  const loadPresetMismatchedClaim = () => {
    setClaimPledgeId('1');
    setReleaseTag('4.18.2');
    setCommitSha('8368dc178af16b91b576c4c1d135f701a0007e5d');
    setReleaseEvidenceUrl('https://raw.githubusercontent.com/expressjs/express/8368dc178af16b91b576c4c1d135f701a0007e5d/History.md');
    setEvidenceUrl('https://raw.githubusercontent.com/unauthorized/other-repo/8368dc178af16b91b576c4c1d135f701a0007e5d/lib/response.js');
    setAnchorSymbol('res.sendFile');
    setTxMessage('Loaded mismatched repository preset (triggers on-chain repo-boundary rejection).');
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
      setTxMessage(`Signing from active account ${signerAddr.slice(0, 8)}... Broadcasting to StudioNet...`);
      const hash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        account: signerAddr as `0x${string}`,
        functionName: 'create_pledge',
        args: [
          packageName,
          repoFullName,
          targetFilePath,
          baselineTag,
          clauseText,
          parseInt(pledgeDuration, 10),
          parseInt(gracePeriod, 10)
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
        account: signerAddr as `0x${string}`,
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

  const handleResolveExpired = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { client, address: signerAddr } = await getActiveClient();
      setTxState('submitted');
      setTxMessage(`Signing from active account ${signerAddr.slice(0, 8)}... Resolving expired pledge...`);
      const hash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        account: signerAddr as `0x${string}`,
        functionName: 'resolve_expired_pledge',
        args: [Number(expirePledgeId)]
      });
      setTxHash(hash);
      setTxMessage('Expiration resolution submitted. Contract evaluating trusted runtime timestamp...');
      await pollLiveTransaction(hash);
    } catch (err: any) {
      setTxState('finalized-error');
      setTxMessage(err?.message || 'Could not resolve expired pledge');
    }
  };

  const handleWithdrawRefundable = async () => {
    try {
      const { client, address: signerAddr } = await getActiveClient();
      setTxState('submitted');
      setTxMessage(`Signing from active account ${signerAddr.slice(0, 8)}... Requesting real native transfer...`);
      const hash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        account: signerAddr as `0x${string}`,
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
              Strict Signer Guarantee: The displayed wallet address is the exact account signing each write.
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
      <div className="grid grid-cols-3 gap-3 p-1.5 rounded-xl bg-slate-900 border border-slate-800">
        <button
          onClick={() => setMode('pledge')}
          className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 ${
            mode === 'pledge'
              ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldPlus className="w-4 h-4" />
          1. Create Pledge Bond
        </button>
        <button
          onClick={() => setMode('claim')}
          className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 ${
            mode === 'claim'
              ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileWarning className="w-4 h-4" />
          2. Submit Claim
        </button>
        <button
          onClick={() => setMode('expire')}
          className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 ${
            mode === 'expire'
              ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          3. Resolve Expiration
        </button>
      </div>

      {/* Mode Form 1: Create Pledge */}
      {mode === 'pledge' && (
        <form onSubmit={handleCreatePledge} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-5">
          {/* 1-Click Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" /> 1-Click Presets:
            </span>
            <button
              type="button"
              onClick={loadPresetValidPledge}
              className="px-2.5 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 text-[11px] font-medium transition"
            >
              Load Valid Express.js Pledge
            </button>
            <button
              type="button"
              onClick={loadPresetVaguePledge}
              className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[11px] font-medium transition"
            >
              Load Vague Pledge (RuleGate Rejection)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Package Name</label>
              <input
                type="text"
                value={packageName}
                onChange={e => setPackageName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Repository (owner/repo)</label>
              <input
                type="text"
                value={repoFullName}
                onChange={e => setRepoFullName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target File Path</label>
              <input
                type="text"
                value={targetFilePath}
                onChange={e => setTargetFilePath(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Baseline Version / Tag</label>
              <input
                type="text"
                value={baselineTag}
                onChange={e => setBaselineTag(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Stability Clause Text (Evaluated by Decentralized RuleGate)
            </label>
            <textarea
              rows={3}
              value={clauseText}
              onChange={e => setClauseText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Duration (Seconds)</label>
              <input
                type="number"
                value={pledgeDuration}
                onChange={e => setPledgeDuration(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Grace Period (Seconds)</label>
              <input
                type="number"
                value={gracePeriod}
                onChange={e => setGracePeriod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isBusy}
            className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldPlus className="w-4 h-4" />}
            Deposit Stability Bond & Open Pledge (1 wei)
          </button>
        </form>
      )}

      {/* Mode Form 2: Submit Claim */}
      {mode === 'claim' && (
        <form onSubmit={handleSubmitClaim} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-5">
          {/* 1-Click Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" /> Presets:
            </span>
            <button
              type="button"
              onClick={loadPresetBreakingClaim}
              className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[11px] font-medium transition"
            >
              Breaking Change (Bounty Payout)
            </button>
            <button
              type="button"
              onClick={loadPresetNonBreakingClaim}
              className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[11px] font-medium transition"
            >
              Non-Breaking Claim
            </button>
            <button
              type="button"
              onClick={loadPresetInjectionClaim}
              className="px-2.5 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-[11px] font-medium transition"
            >
              Prompt-Injection Defense
            </button>
            <button
              type="button"
              onClick={loadPresetMismatchedClaim}
              className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[11px] font-medium transition"
            >
              Mismatched Repo (Rejected)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Pledge ID</label>
              <input
                type="number"
                value={claimPledgeId}
                onChange={e => setClaimPledgeId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Breaking Release Tag</label>
              <input
                type="text"
                value={releaseTag}
                onChange={e => setReleaseTag(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">40-Hex Commit SHA</label>
              <input
                type="text"
                value={commitSha}
                onChange={e => setCommitSha(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Release Evidence Artifact URL (e.g. History.md, package.json, or environment.yml)
            </label>
            <input
              type="url"
              value={releaseEvidenceUrl}
              onChange={e => setReleaseEvidenceUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Pledge-Bound Code Evidence URL (raw.githubusercontent.com pinned to commit SHA)
            </label>
            <input
              type="url"
              value={evidenceUrl}
              onChange={e => setEvidenceUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Anchor Symbol for Bounded Extraction</label>
            <input
              type="text"
              value={anchorSymbol}
              onChange={e => setAnchorSymbol(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isBusy}
            className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileWarning className="w-4 h-4" />}
            Submit Claim for Decentralized LLM Adjudication
          </button>
        </form>
      )}

      {/* Mode Form 3: Resolve Expiration */}
      {mode === 'expire' && (
        <form onSubmit={handleResolveExpired} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-5">
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" /> Presets:
            </span>
            <button
              type="button"
              onClick={() => {
                setExpirePledgeId('5');
                setTxMessage('Loaded expired Pledge #5 preset.');
              }}
              className="px-2.5 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 text-[11px] font-medium transition"
            >
              Load Expired Pledge #5
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Pledge ID to Resolve</label>
            <input
              type="number"
              value={expirePledgeId}
              onChange={e => setExpirePledgeId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-sky-500"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              The contract reads trusted runtime time from <code className="text-sky-400 font-mono">gl.message_raw["datetime"]</code>.
              If <code className="text-sky-400 font-mono">now_ts &gt;= expires_at + grace_period</code>, the bond unlocks to the maintainer.
            </p>
          </div>

          <button
            type="submit"
            disabled={isBusy}
            className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
            Resolve Expired Pledge (resolve_expired_pledge)
          </button>
        </form>
      )}

      {/* Transaction Feedback Banner */}
      {txState !== 'idle' && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition ${
            txState === 'finalized-success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : txState === 'finalized-error'
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              : 'bg-slate-900 border-sky-500/30 text-sky-300'
          }`}
        >
          {isBusy && <Loader2 className="w-5 h-5 animate-spin flex-shrink-0 mt-0.5 text-sky-400" />}
          {txState === 'finalized-success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />}
          {txState === 'finalized-error' && <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />}

          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">
                Status: {txState}
              </span>
              {txHash && (
                <a
                  href={`${STUDIONET_EXPLORER_URL}/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs underline flex items-center gap-1 hover:text-white"
                >
                  View on Explorer <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <p className="text-xs font-mono break-all">{txMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};
