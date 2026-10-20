import React from 'react';
import { ArrowRight, CheckCircle2, Clock, AlertCircle, ShieldAlert } from 'lucide-react';

export const TxLifecycleTracker: React.FC = () => {
  const stages = [
    { name: '1. Submitted', desc: 'Signed tx broadcast to StudioNet RPC' },
    { name: '2. Pending', desc: 'Leader validator executes & proposes receipt' },
    { name: '3. Accepted', desc: 'Validators agree on quote & verdict; Appeal Window opens' },
    { name: '4. Finalized', desc: 'Consensus sealed in contract state & balances moved' },
  ];

  return (
    <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
      <div>
        <h3 className="font-semibold text-slate-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          GenLayer Protocol Lifecycle & Deterministic Fallback
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Money moves only upon finality. Every waiting state is bounded by a deadline to prevent stranded capital.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
        {stages.map((st, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="text-xs font-semibold text-indigo-400">{st.name}</div>
              <p className="text-xs text-slate-400 mt-1">{st.desc}</p>
            </div>
            <div className="mt-3 flex items-center text-[10px] text-emerald-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-300 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold">Deterministic Timeout Guard (Rule 6 Compliance):</span> If any claim
          remains unjudged or stuck past <code className="bg-indigo-900/50 px-1 py-0.5 rounded">expires_at + grace_period</code>,
          calling <code className="bg-indigo-900/50 px-1 py-0.5 rounded">resolve_expired_pledge()</code> automatically classifies
          it as <code className="bg-indigo-900/50 px-1 py-0.5 rounded">INSUFFICIENT_EVIDENCE</code> and unlocks the maintainer's bond.
          Zero tokens can ever be permanently locked.
        </div>
      </div>
    </div>
  );
};
