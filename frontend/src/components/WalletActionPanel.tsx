import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  KeyRound,
  RotateCcw,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import {
  getBrowserSessionClient,
  getInjectedWalletClient,
  validateImmutableEvidenceUrl,
  validateRepoAndPath,
  STUDIONET_EXPLORER_URL
} from '../lib/genlayerClient';
import { CopyButton, truncateHash } from './ui';

interface Props {
  contractAddress: string;
}

type TxLifecycleState =
  | 'idle'
  | 'submitted'
  | 'pending'
  | 'accepted'
  | 'finalized-success'
  | 'finalized-error';
type WalletMode = 'burner' | 'injected';
type ActionMode = 'pledge' | 'claim' | 'expire';

const INPUT_CLASS =
  'w-full px-3 py-2 bg-[#161920] border border-white/[0.08] rounded-md text-xs sm:text-[13px] font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors';

export const WalletActionPanel: React.FC<Props> = ({ contractAddress }) => {
  const [walletMode, setWalletMode] = useState<WalletMode>('burner');
  const [displayedAccount, setDisplayedAccount] = useState<string>('');
  const [mode, setMode] = useState<ActionMode>('pledge');
  const [activePresetId, setActivePresetId] = useState<string>('valid-pledge');

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

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize wallet display
  useEffect(() => {
    initBurnerWallet();
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
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
      alert(
        `Could not connect browser wallet: ${err.message}. Falling back to embedded burner wallet.`
      );
      initBurnerWallet();
    }
  };

  const getActiveClient = async () => {
    if (walletMode === 'injected') {
      const injected = await getInjectedWalletClient();
      if (injected.address.toLowerCase() !== displayedAccount.toLowerCase()) {
        throw new Error(
          `Wallet mismatch! Displayed ${displayedAccount} differs from signer ${injected.address}`
        );
      }
      return { client: injected.client, address: injected.address };
    } else {
      const session = getBrowserSessionClient();
      if (session.address.toLowerCase() !== displayedAccount.toLowerCase()) {
        throw new Error(
          `Wallet mismatch! Displayed ${displayedAccount} differs from signer ${session.address}`
        );
      }
      return { client: session.client, address: session.address };
    }
  };

  const pollLiveTransaction = async (hash: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    setTxState('pending');
    let attempts = 0;
    const maxAttempts = 50;

    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      try {
        const { client } = await getActiveClient();
        const tx: any = await client.getTransaction({ hash: hash as any });
        const statusName =
          tx.statusName ||
          (tx.consensus_history?.current_status_changes?.includes('FINALIZED')
            ? 'FINALIZED'
            : 'PENDING');
        const execResult = tx.consensus_data?.leader_receipt?.[0]?.execution_result;
        const readableReturn =
          tx.consensus_data?.leader_receipt?.[0]?.result?.payload?.readable || '';

        if (statusName === 'ACCEPTED') {
          setTxState('accepted');
          setTxMessage(
            'Transaction accepted by leader. Waiting for decentralized validator finality...'
          );
        }

        if (statusName === 'FINALIZED') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
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
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setTxState('pending');
        setTxMessage('Polling timed out. Transaction is still processing on StudioNet.');
      }
    }, 4000);
  };

  // 1-Click Preset Loaders
  const loadPresetValidPledge = () => {
    setMode('pledge');
    setActivePresetId('valid-pledge');
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
    setMode('pledge');
    setActivePresetId('vague-pledge');
    setPackageName('express-vague');
    setRepoFullName('expressjs/express');
    setTargetFilePath('lib/response.js');
    setBaselineTag('4.17.1');
    setClauseText(
      'We promise our API will always stay modern, ergonomic, fast, and developer-friendly for everyone.'
    );
    setPledgeDuration('86400');
    setGracePeriod('3600');
    setTxMessage(
      'Loaded subjective/vague marketing pledge preset (triggers RuleGate REJECTED_VAGUE).'
    );
  };

  const loadPresetBreakingClaim = () => {
    setMode('claim');
    setActivePresetId('breaking-claim');
    setClaimPledgeId('3');
    setReleaseTag('4.18.2');
    setCommitSha('8368dc178af16b91b576c4c1d135f701a0007e5d');
    setReleaseEvidenceUrl(
      'https://raw.githubusercontent.com/expressjs/express/8368dc178af16b91b576c4c1d135f701a0007e5d/History.md'
    );
    setEvidenceUrl(
      'https://raw.githubusercontent.com/expressjs/express/8368dc178af16b91b576c4c1d135f701a0007e5d/lib/response.js'
    );
    setAnchorSymbol('res.sendfile =');
    setTxMessage('Loaded breaking deprecation claim preset (res.sendfile = deprecate.function).');
  };

  const loadPresetNonBreakingClaim = () => {
    setMode('claim');
    setActivePresetId('non-breaking-claim');
    setClaimPledgeId('1');
    setReleaseTag('4.18.2');
    setCommitSha('8368dc178af16b91b576c4c1d135f701a0007e5d');
    setReleaseEvidenceUrl(
      'https://raw.githubusercontent.com/expressjs/express/8368dc178af16b91b576c4c1d135f701a0007e5d/History.md'
    );
    setEvidenceUrl(
      'https://raw.githubusercontent.com/expressjs/express/8368dc178af16b91b576c4c1d135f701a0007e5d/lib/response.js'
    );
    setAnchorSymbol('res.sendFile = function sendFile');
    setTxMessage('Loaded intact non-breaking claim preset (res.sendFile preserved).');
  };

  const loadPresetInjectionClaim = () => {
    setMode('claim');
    setActivePresetId('injection-claim');
    setClaimPledgeId('4');
    setReleaseTag('torch==2.3.1');
    setCommitSha('fbed5cca347488f88363790ae3ae97c56116da6a');
    setReleaseEvidenceUrl(
      'https://raw.githubusercontent.com/liu00222/Open-Prompt-Injection/fbed5cca347488f88363790ae3ae97c56116da6a/environment.yml'
    );
    setEvidenceUrl(
      'https://raw.githubusercontent.com/liu00222/Open-Prompt-Injection/fbed5cca347488f88363790ae3ae97c56116da6a/OpenPromptInjection/attackers/CombineAttacker.py'
    );
    setAnchorSymbol('def inject(self, clean_data, idx, target_task):');
    setTxMessage('Loaded prompt-injection defense preset (CombineAttacker.py with untrusted tags).');
  };

  const loadPresetMismatchedClaim = () => {
    setMode('claim');
    setActivePresetId('mismatched-claim');
    setClaimPledgeId('1');
    setReleaseTag('4.18.2');
    setCommitSha('8368dc178af16b91b576c4c1d135f701a0007e5d');
    setReleaseEvidenceUrl(
      'https://raw.githubusercontent.com/expressjs/express/8368dc178af16b91b576c4c1d135f701a0007e5d/History.md'
    );
    setEvidenceUrl(
      'https://raw.githubusercontent.com/unauthorized/other-repo/8368dc178af16b91b576c4c1d135f701a0007e5d/lib/response.js'
    );
    setAnchorSymbol('res.sendFile');
    setTxMessage('Loaded mismatched repository preset (triggers on-chain repo-boundary rejection).');
  };

  const loadPresetExpirePledge5 = () => {
    setMode('expire');
    setActivePresetId('expire-pledge-5');
    setExpirePledgeId('5');
    setTxMessage('Loaded expired Pledge #5 preset.');
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
      setTxMessage(
        `Signing from active account ${signerAddr.slice(0, 8)}... Broadcasting to StudioNet...`
      );
      const hash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        account: signerAddr as any,
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
      setTxMessage(
        'Transaction submitted. Validators checking pledge clarity and observable boundaries...'
      );
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
        account: signerAddr as any,
        functionName: 'submit_and_judge_claim',
        args: [
          Number(claimPledgeId),
          releaseTag,
          commitSha,
          releaseEvidenceUrl,
          evidenceUrl,
          anchorSymbol
        ]
      } as any);
      setTxHash(hash);
      setTxMessage(
        'Claim submitted. Validators verifying pledge-bound repository and release evidence...'
      );
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
      setTxMessage(
        `Signing from active account ${signerAddr.slice(0, 8)}... Resolving expired pledge...`
      );
      const hash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        account: signerAddr as any,
        functionName: 'resolve_expired_pledge',
        args: [Number(expirePledgeId)]
      } as any);
      setTxHash(hash);
      setTxMessage(
        'Expiration resolution submitted. Contract evaluating trusted runtime timestamp...'
      );
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
      setTxMessage(
        `Signing from active account ${signerAddr.slice(0, 8)}... Requesting real native transfer...`
      );
      const hash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        account: signerAddr as any,
        functionName: 'withdraw_refundable',
        args: []
      } as any);
      setTxHash(hash);
      setTxMessage(
        'Withdrawal submitted. Contract executing real native transfer via gl.get_contract_at(caller).emit_transfer...'
      );
      await pollLiveTransaction(hash);
    } catch (err: any) {
      setTxState('finalized-error');
      setTxMessage(err?.message || 'Withdrawal failed');
    }
  };

  const isBusy = txState === 'submitted' || txState === 'pending' || txState === 'accepted';
  const repoValidation = validateRepoAndPath(repoFullName, targetFilePath);
  const releaseUrlValidation = validateImmutableEvidenceUrl(releaseEvidenceUrl);
  const codeUrlValidation = validateImmutableEvidenceUrl(evidenceUrl);

  const presets = [
    {
      id: 'valid-pledge',
      title: 'Valid Express.js Pledge',
      tag: 'ACCEPTED',
      dot: 'bg-emerald-400',
      desc: 'Locks concrete res.sendFile() signature clause for expressjs/express.',
      onClick: loadPresetValidPledge
    },
    {
      id: 'vague-pledge',
      title: 'Vague Marketing Pledge',
      tag: 'REJECTED_VAGUE',
      dot: 'bg-amber-400',
      desc: 'Tests RuleGate rejection and credits 1 wei refundable balance.',
      onClick: loadPresetVaguePledge
    },
    {
      id: 'breaking-claim',
      title: 'Breaking Deprecation Claim',
      tag: 'BREAKING_CONFIRMED',
      dot: 'bg-rose-400',
      desc: 'Proves res.sendfile() deprecation in v4.18.2 for direct bounty payout.',
      onClick: loadPresetBreakingClaim
    },
    {
      id: 'non-breaking-claim',
      title: 'Intact Method Claim',
      tag: 'NON_BREAKING',
      dot: 'bg-sky-400',
      desc: 'Verifies res.sendFile() remains intact; dismisses claim cleanly.',
      onClick: loadPresetNonBreakingClaim
    },
    {
      id: 'injection-claim',
      title: 'Prompt-Injection Defense',
      tag: 'SECURITY',
      dot: 'bg-sky-400',
      desc: 'Tests CombineAttacker.py untrusted-tag sandbox against LLM injection.',
      onClick: loadPresetInjectionClaim
    },
    {
      id: 'mismatched-claim',
      title: 'Mismatched Repo Boundary',
      tag: 'REPO_GUARD',
      dot: 'bg-amber-400',
      desc: 'Submits unauthorized repo URL; tests deterministic on-chain guard.',
      onClick: loadPresetMismatchedClaim
    },
    {
      id: 'expire-pledge-5',
      title: 'Expired Pledge #5 Refund',
      tag: 'EXPIRY',
      dot: 'bg-amber-400',
      desc: 'Resolves Pledge #5 via trusted gl.message_raw["datetime"] clock.',
      onClick: loadPresetExpirePledge5
    }
  ];

  // Stepper progression helper
  const stepIndex =
    txState === 'submitted'
      ? 0
      : txState === 'pending'
      ? 1
      : txState === 'accepted'
      ? 2
      : txState === 'finalized-success' || txState === 'finalized-error'
      ? 3
      : -1;

  const signerShort = displayedAccount ? truncateHash(displayedAccount, 6, 4) : '…';

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-50 tracking-[-0.025em]">
            Transaction Studio
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Execute live StudioNet transactions on Chain 61999 with strict displayed-to-signer
            account parity.
          </p>
        </div>
        <div className="text-[11px] font-mono text-zinc-400 border border-white/[0.08] bg-[#0a0b0e] px-2.5 py-1 rounded-md self-start sm:self-auto">
          Contract: {truncateHash(contractAddress, 6, 4)}
        </div>
      </div>

      {/* 2-Column Workbench Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols): Signer & 1-Click Test Scenarios */}
        <div className="lg:col-span-4 space-y-5">
          {/* Active Signer Card */}
          <section className="border border-white/[0.08] bg-[#0a0b0e] rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  Active Signer
                </h2>
              </div>
              <span className="text-[11px] font-mono text-zinc-500 tabular-nums">Chain 61999</span>
            </div>

            {/* Segmented Wallet Mode Control */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-md bg-[#050507] border border-white/[0.07]">
              <button
                type="button"
                onClick={initBurnerWallet}
                className={`py-1.5 px-2.5 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  walletMode === 'burner'
                    ? 'bg-[#161920] text-zinc-50 border border-white/[0.12]'
                    : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                Embedded Burner
              </button>
              <button
                type="button"
                onClick={handleConnectInjected}
                className={`py-1.5 px-2.5 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  walletMode === 'injected'
                    ? 'bg-[#161920] text-zinc-50 border border-white/[0.12]'
                    : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                MetaMask
              </button>
            </div>

            {/* Signing Account Parity Box */}
            <div className="p-3 rounded-md bg-[#101217] border border-white/[0.07] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-medium text-zinc-400">Signing Account</span>
                </div>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#161920] border border-white/[0.07] text-zinc-400">
                  {walletMode === 'burner' ? 'BURNER' : 'EIP-1193'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span
                  className="font-mono text-xs text-zinc-100 truncate tabular-nums"
                  title={displayedAccount}
                >
                  {displayedAccount || 'Loading...'}
                </span>
                {displayedAccount && <CopyButton text={displayedAccount} />}
              </div>

              <p className="text-[11px] text-zinc-500 leading-snug">
                Strict parity enforced: exact address passed to{' '}
                <code className="text-zinc-400">writeContract(&#123; account &#125;)</code>.
              </p>
            </div>

            {/* Withdraw Refundable Action */}
            <button
              type="button"
              onClick={handleWithdrawRefundable}
              disabled={isBusy}
              className="w-full py-2 px-3 rounded-md bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14] border border-emerald-500/25 text-emerald-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Withdraw Refundable Balance
            </button>
          </section>

          {/* 1-Click Test Scenarios */}
          <section className="border border-white/[0.08] bg-[#0a0b0e] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.07] bg-[#07080b] flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                1-Click Test Scenarios
              </span>
              <span className="text-[11px] font-mono text-zinc-500 tabular-nums">
                {presets.length} Presets
              </span>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {presets.map((preset) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={preset.onClick}
                    className={`w-full text-left px-4 py-3 transition-colors border-l-2 ${
                      isSelected
                        ? 'border-l-white bg-white/[0.04]'
                        : 'border-l-transparent hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-medium text-zinc-100 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${preset.dot}`} />
                        {preset.title}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">{preset.tag}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">{preset.desc}</p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column (8 cols): Operation Specification Form */}
        <div className="lg:col-span-8 space-y-5">
          <div className="border border-white/[0.08] bg-[#0a0b0e] rounded-lg overflow-hidden">
            {/* Top Segmented Operation Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-white/[0.07] bg-[#07080b] divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07]">
              {[
                { id: 'pledge' as ActionMode, label: '01. Create Stability Pledge' },
                { id: 'claim' as ActionMode, label: '02. Submit Breaking Claim' },
                { id: 'expire' as ActionMode, label: '03. Resolve Expired Bond' }
              ].map((tab) => {
                const isActive = mode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMode(tab.id)}
                    className={`py-3 px-4 text-xs font-medium text-left sm:text-center transition-colors border-b-2 ${
                      isActive
                        ? 'border-b-white bg-[#0a0b0e] text-zinc-50'
                        : 'border-b-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Form 1: Create Stability Pledge */}
            {mode === 'pledge' && (
              <form onSubmit={handleCreatePledge} className="p-5 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">
                      Lock Stability Bond (`create_pledge`)
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Deposits 1 wei bond; RuleGate validates clause specificity and binds repository
                      &amp; file path.
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                      repoValidation.valid
                        ? 'text-emerald-300 border-emerald-500/25 bg-emerald-500/[0.07]'
                        : 'text-rose-300 border-rose-500/25 bg-rose-500/[0.07]'
                    }`}
                  >
                    {repoValidation.valid ? 'Repo & Path Valid' : 'Invalid Repo/Path'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">Package Name</label>
                    <input
                      type="text"
                      value={packageName}
                      onChange={(e) => setPackageName(e.target.value)}
                      className={INPUT_CLASS}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      Repository <span className="text-zinc-500 font-mono">(owner/repo)</span>
                    </label>
                    <input
                      type="text"
                      value={repoFullName}
                      onChange={(e) => setRepoFullName(e.target.value)}
                      className={INPUT_CLASS}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      Target File Path
                    </label>
                    <input
                      type="text"
                      value={targetFilePath}
                      onChange={(e) => setTargetFilePath(e.target.value)}
                      className={INPUT_CLASS}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      Baseline Version / Tag
                    </label>
                    <input
                      type="text"
                      value={baselineTag}
                      onChange={(e) => setBaselineTag(e.target.value)}
                      className={INPUT_CLASS}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Stability Clause Text{' '}
                    <span className="text-zinc-500 font-normal">
                      (Evaluated by Decentralized RuleGate)
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    value={clauseText}
                    onChange={(e) => setClauseText(e.target.value)}
                    className={INPUT_CLASS}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      Duration (Seconds)
                    </label>
                    <input
                      type="number"
                      value={pledgeDuration}
                      onChange={(e) => setPledgeDuration(e.target.value)}
                      className={`${INPUT_CLASS} tabular-nums`}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      Grace Period (Seconds)
                    </label>
                    <input
                      type="number"
                      value={gracePeriod}
                      onChange={(e) => setGracePeriod(e.target.value)}
                      className={`${INPUT_CLASS} tabular-nums`}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full py-2.5 px-4 rounded-md bg-white hover:bg-zinc-200 text-black font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>
                    Deposit Stability Bond (1 wei) · Sign as {signerShort}
                  </span>
                </button>
              </form>
            )}

            {/* Form 2: Submit Breaking Claim */}
            {mode === 'claim' && (
              <form onSubmit={handleSubmitClaim} className="p-5 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">
                      Submit Breaking-Change Claim (`submit_and_judge_claim`)
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Submits 40-hex commit SHA pinned artifacts for consensus adjudication against
                      the frozen clause.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      Target Pledge ID
                    </label>
                    <input
                      type="number"
                      value={claimPledgeId}
                      onChange={(e) => setClaimPledgeId(e.target.value)}
                      className={`${INPUT_CLASS} tabular-nums`}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      Breaking Release Tag
                    </label>
                    <input
                      type="text"
                      value={releaseTag}
                      onChange={(e) => setReleaseTag(e.target.value)}
                      className={INPUT_CLASS}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      40-Hex Commit SHA
                    </label>
                    <input
                      type="text"
                      value={commitSha}
                      onChange={(e) => setCommitSha(e.target.value)}
                      className={INPUT_CLASS}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-xs font-medium text-zinc-300">
                      Release Evidence URL
                    </label>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        releaseUrlValidation.valid
                          ? 'text-emerald-300 border-emerald-500/25 bg-emerald-500/[0.07]'
                          : 'text-rose-300 border-rose-500/25 bg-rose-500/[0.07]'
                      }`}
                    >
                      {releaseUrlValidation.sourceType}
                    </span>
                  </div>
                  <input
                    type="url"
                    value={releaseEvidenceUrl}
                    onChange={(e) => setReleaseEvidenceUrl(e.target.value)}
                    className={INPUT_CLASS}
                    required
                  />
                  <p className="text-[11px] text-zinc-500">{releaseUrlValidation.message}</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-xs font-medium text-zinc-300">
                      Pledge-Bound Code Evidence URL
                    </label>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        codeUrlValidation.valid
                          ? 'text-emerald-300 border-emerald-500/25 bg-emerald-500/[0.07]'
                          : 'text-rose-300 border-rose-500/25 bg-rose-500/[0.07]'
                      }`}
                    >
                      {codeUrlValidation.sourceType}
                    </span>
                  </div>
                  <input
                    type="url"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    className={INPUT_CLASS}
                    required
                  />
                  <p className="text-[11px] text-zinc-500">{codeUrlValidation.message}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Anchor Symbol for Bounded Extraction
                  </label>
                  <input
                    type="text"
                    value={anchorSymbol}
                    onChange={(e) => setAnchorSymbol(e.target.value)}
                    className={INPUT_CLASS}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full py-2.5 px-4 rounded-md bg-white hover:bg-zinc-200 text-black font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Submit Claim for Consensus Adjudication · Sign as {signerShort}</span>
                </button>
              </form>
            )}

            {/* Form 3: Resolve Expiration */}
            {mode === 'expire' && (
              <form onSubmit={handleResolveExpired} className="p-5 sm:p-6 space-y-5">
                <div className="pb-3 border-b border-white/[0.06]">
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Resolve Expired Bond (`resolve_expired_pledge`)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Unlocks an unbreached bond after its duration and grace period elapse on
                    GenLayer runtime clock.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Pledge ID to Resolve
                  </label>
                  <input
                    type="number"
                    value={expirePledgeId}
                    onChange={(e) => setExpirePledgeId(e.target.value)}
                    className={`${INPUT_CLASS} tabular-nums`}
                    required
                  />
                  <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
                    Contract reads trusted runtime time from{' '}
                    <code className="text-zinc-200 font-mono">gl.message_raw["datetime"]</code>. If{' '}
                    <code className="text-zinc-200 font-mono">
                      now_ts &gt;= expires_at + grace_period
                    </code>
                    , bond credits to maintainer for immediate native withdrawal.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full py-2.5 px-4 rounded-md bg-white hover:bg-zinc-200 text-black font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Resolve Expired Pledge · Sign as {signerShort}</span>
                </button>
              </form>
            )}
          </div>

          {/* 4-Step Transaction Finality Stepper & Status Log */}
          {(txState !== 'idle' || txMessage) && (
            <section
              aria-label="Transaction Finality Status"
              className="border border-white/[0.08] bg-[#0a0b0e] rounded-lg p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isBusy && <Loader2 className="w-4 h-4 animate-spin text-sky-400" />}
                  {txState === 'finalized-success' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  {txState === 'finalized-error' && (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                    {txState === 'idle' ? 'Preset Loaded' : `Lifecycle: ${txState}`}
                  </span>
                </div>

                {txHash && (
                  <div className="flex items-center gap-2">
                    <a
                      href={`${STUDIONET_EXPLORER_URL}/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono text-zinc-200 hover:text-white inline-flex items-center gap-1"
                    >
                      {truncateHash(txHash, 8, 6)}
                      <ExternalLink className="w-3 h-3 text-zinc-500" />
                    </a>
                    <CopyButton text={txHash} />
                  </div>
                )}
              </div>

              {txState !== 'idle' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    'Submitted',
                    'Leader Proposing',
                    'Validators Agreeing',
                    'Finalized on StudioNet'
                  ].map((label, idx) => {
                    const isDone =
                      stepIndex > idx ||
                      (stepIndex === 3 && idx === 3 && txState === 'finalized-success');
                    const isError = stepIndex === 3 && idx === 3 && txState === 'finalized-error';
                    const isCurrent = stepIndex === idx && isBusy;

                    return (
                      <div
                        key={label}
                        className={`p-2.5 rounded-md border text-[11px] font-medium transition-colors ${
                          isError
                            ? 'bg-rose-500/[0.08] border-rose-500/30 text-rose-300'
                            : isDone
                            ? 'bg-emerald-500/[0.08] border-emerald-500/25 text-emerald-300'
                            : isCurrent
                            ? 'bg-[#161920] border-white/25 text-zinc-100'
                            : 'bg-[#050507] border-white/[0.06] text-zinc-500'
                        }`}
                      >
                        <div className="font-mono text-[10px] opacity-70 mb-0.5 tabular-nums">
                          0{idx + 1}
                        </div>
                        <div>{label}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {txMessage && (
                <div className="p-3 rounded-md bg-[#050507] border border-white/[0.07] text-xs font-mono text-zinc-300 break-words leading-relaxed">
                  {txMessage}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
