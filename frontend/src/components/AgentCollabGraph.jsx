import React, { useState, useEffect } from 'react';
import { mockData } from '../mockData';
import {
  ArrowRight, Cpu, BrainCircuit, Database, Zap, ShieldCheck, Activity
} from 'lucide-react';

const agentNodes = [
  { id: 'orchestrator', name: 'Nexus Orchestrator', icon: Cpu, role: 'Routes & Manages', color: 'cyan' },
  { id: 'retrieval', name: 'Data Fetcher v4', icon: Database, role: 'Retrieves Context', color: 'blue' },
  { id: 'intel', name: 'MeetIntel Core', icon: BrainCircuit, role: 'Analyzes & Extracts', color: 'purple' },
  { id: 'executor', name: 'Action Exec Alpha', icon: Zap, role: 'Executes Actions', color: 'yellow' },
  { id: 'verifier', name: 'Shield Verifier', icon: ShieldCheck, role: 'Validates & Audits', color: 'green' },
];

const collaborationFlow = [
  { from: 'orchestrator', to: 'retrieval', message: 'Fetch vendor profile for PR-4492', delay: 0 },
  { from: 'retrieval', to: 'orchestrator', message: 'Vendor data retrieved: Acme Corp (Verified)', delay: 2500 },
  { from: 'orchestrator', to: 'verifier', message: 'Run compliance checks on Acme Corp', delay: 4000 },
  { from: 'verifier', to: 'orchestrator', message: 'SOC2 valid ✓, GDPR DPA ✓, Risk: Low', delay: 6500 },
  { from: 'orchestrator', to: 'intel', message: 'Analyze approval chain for $48K request', delay: 8000 },
  { from: 'intel', to: 'orchestrator', message: 'Requires VP approval (threshold: $25K)', delay: 10000 },
  { from: 'orchestrator', to: 'executor', message: 'Send approval request to VP Sarah Chen', delay: 11500 },
  { from: 'executor', to: 'orchestrator', message: 'Approval received via Slack. PO generated.', delay: 14000 },
  { from: 'orchestrator', to: 'verifier', message: 'Final verification: three-way match', delay: 16000 },
  { from: 'verifier', to: 'orchestrator', message: 'Verification PASSED. Workflow complete.', delay: 18000 },
];

const colorMap = {
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', dot: 'bg-purple-400' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', dot: 'bg-green-400' },
};

export function AgentCollabGraph() {
  const [activeMessages, setActiveMessages] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (currentIdx >= collaborationFlow.length) {
      // Loop
      const timer = setTimeout(() => {
        setActiveMessages([]);
        setCurrentIdx(0);
      }, 3000);
      return () => clearTimeout(timer);
    }

    const flow = collaborationFlow[currentIdx];
    const timer = setTimeout(() => {
      setActiveMessages(prev => [...prev.slice(-6), flow]); // Keep last 6 messages
      setCurrentIdx(prev => prev + 1);
    }, currentIdx === 0 ? 1000 : 2000);

    return () => clearTimeout(timer);
  }, [currentIdx]);

  const lastMsg = activeMessages[activeMessages.length - 1];

  return (
    <div>
      <h1 className="text-3xl font-light mb-8 text-white">Agent <span className="font-bold text-cyan-400">Collaboration</span></h1>

      {/* Agent Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {agentNodes.map(node => {
          const c = colorMap[node.color];
          const isActive = lastMsg && (lastMsg.from === node.id || lastMsg.to === node.id);
          const isSender = lastMsg && lastMsg.from === node.id;

          return (
            <div key={node.id}
              className={`glass-panel p-4 rounded-2xl text-center transition-all duration-500 ${isActive ? `${c.border} border shadow-lg` : 'border-transparent'}`}
            >
              <div className="relative mx-auto mb-3 h-14 w-14 rounded-full bg-zinc-800 flex items-center justify-center">
                <node.icon className={`h-7 w-7 ${c.text} transition-all ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <div className={`absolute -top-1 -right-1 h-4 w-4 rounded-full ${c.dot} ${isSender ? 'animate-ping' : 'animate-pulse'}`}></div>
                )}
              </div>
              <h4 className="text-xs font-bold text-white truncate">{node.name}</h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">{node.role}</p>
            </div>
          );
        })}
      </div>

      {/* Message Feed */}
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-cyan-400" /> Inter-Agent Communication
        </h2>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {activeMessages.map((msg, idx) => {
            const fromNode = agentNodes.find(n => n.id === msg.from);
            const toNode = agentNodes.find(n => n.id === msg.to);
            const c = colorMap[fromNode?.color || 'cyan'];

            return (
              <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-zinc-800 animate-fade-in ${idx === activeMessages.length - 1 ? 'ring-1 ring-cyan-500/20' : ''}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${c.bg}`}>
                  {fromNode && <fromNode.icon className={`h-4 w-4 ${c.text}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold ${c.text}`}>{fromNode?.name}</span>
                    <ArrowRight className="h-3 w-3 text-zinc-600" />
                    <span className="text-xs font-bold text-zinc-400">{toNode?.name}</span>
                  </div>
                  <p className="text-sm text-zinc-300">{msg.message}</p>
                </div>
              </div>
            );
          })}

          {activeMessages.length === 0 && (
            <div className="text-center py-8 text-zinc-600">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Initializing agent swarm...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
