import React from 'react';
import { X, BrainCircuit, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';

export function DecisionPanel({ step, onClose }) {
  if (!step) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div
        className="relative w-full max-w-lg bg-zinc-900 border-l border-zinc-800 h-full overflow-y-auto shadow-2xl animate-slide-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-cyan-400 text-xs uppercase tracking-widest font-bold mb-1">Decision Audit</p>
              <h2 className="text-xl font-bold text-white">{step.name}</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Agent Info */}
          <div className="glass-panel p-4 rounded-xl mb-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Executing Agent</p>
            <p className="text-cyan-300 font-mono text-sm font-bold">{step.agent}</p>
          </div>

          {/* Confidence Score */}
          <div className="glass-panel p-4 rounded-xl mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <BarChart3 className="h-3 w-3" /> Confidence Score
              </p>
              <span className={`text-lg font-bold font-mono ${step.confidence >= 95 ? 'text-green-400' : step.confidence >= 85 ? 'text-yellow-400' : 'text-red-400'}`}>
                {step.confidence}%
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${step.confidence >= 95 ? 'bg-green-500' : step.confidence >= 85 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${step.confidence}%` }}
              ></div>
            </div>
          </div>

          {/* Reasoning Chain */}
          <div className="glass-panel p-4 rounded-xl mb-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1">
              <BrainCircuit className="h-3 w-3" /> Reasoning Chain
            </p>
            <div className="bg-black/40 p-4 rounded-lg border-l-2 border-cyan-500">
              <p className="text-sm text-zinc-200 leading-relaxed">{step.reasoning}</p>
            </div>
          </div>

          {/* Alternatives Considered */}
          {step.alternatives && step.alternatives.length > 0 && (
            <div className="glass-panel p-4 rounded-xl mb-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Alternatives Considered</p>
              <div className="space-y-2">
                {step.alternatives.map((alt, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-zinc-400">{alt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Self-Correction Details */}
          {step.canFail && step.failureScenario && (
            <div className="glass-panel p-4 rounded-xl border-yellow-500/20">
              <p className="text-xs text-yellow-400 uppercase tracking-wider mb-3 font-bold">Failure Recovery Log</p>
              <p className="text-xs text-zinc-400 mb-3">{step.failureScenario.detection}</p>
              <div className="space-y-2">
                {step.failureScenario.recovery.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-zinc-300">{r.action}</span>
                      <span className="text-cyan-500 font-mono ml-1">— {r.agent}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
