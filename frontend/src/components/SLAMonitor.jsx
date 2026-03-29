import React, { useState, useEffect } from 'react';
import {
  Clock, AlertTriangle, TrendingUp, ArrowUpRight,
  CheckCircle2, Shield, Activity
} from 'lucide-react';

const slaWorkflows = [
  {
    id: 'sla-1', name: 'Acme Corp Invoice Processing', type: 'Procure-to-Pay',
    slaHours: 4, elapsedHours: 2.8, status: 'on-track',
    currentStep: 'Manager Approval', agent: 'Nexus Orchestrator',
    prediction: 'Will complete 45 min before SLA deadline',
    health: 92
  },
  {
    id: 'sla-2', name: 'Globex Contract Renewal', type: 'Contract Lifecycle',
    slaHours: 48, elapsedHours: 46, status: 'at-risk',
    currentStep: 'Legal Review', agent: 'Human (Legal)',
    prediction: 'SLA breach in 2h 00m — auto-escalation triggered',
    health: 28,
    autoAction: 'Reassigned to Senior Legal Counsel + sent executive notification'
  },
  {
    id: 'sla-3', name: 'Sarah Connor Onboarding', type: 'Employee Onboarding',
    slaHours: 24, elapsedHours: 3.5, status: 'on-track',
    currentStep: 'IT Provisioning', agent: 'Action Exec Alpha',
    prediction: 'On track — 85% of steps already automated',
    health: 98
  },
  {
    id: 'sla-4', name: 'Q3 Vendor Audit', type: 'Compliance',
    slaHours: 72, elapsedHours: 68, status: 'breached',
    currentStep: 'Document Collection', agent: 'Data Fetcher v4',
    prediction: 'SLA breached 4h ago — root cause: vendor non-responsive',
    health: 5,
    autoAction: 'Escalated to VP Procurement + vendor penalty clause activated'
  },
];

const bottlenecks = [
  { area: 'Legal Review', avgDelay: '18h', frequency: '3x this week', risk: 'high', suggestion: 'Implement parallel legal review with 2nd counsel' },
  { area: 'Vendor Response', avgDelay: '36h', frequency: '5x this month', risk: 'high', suggestion: 'Auto-send follow-ups at 12h and 24h marks' },
  { area: 'Manager Approval', avgDelay: '4h', frequency: '8x this week', risk: 'medium', suggestion: 'Enable Slack one-click approval for amounts < $50K' },
  { area: 'Document Upload', avgDelay: '2h', frequency: '12x this week', risk: 'low', suggestion: 'Deploy OCR auto-parser for common document types' },
];

export function SLAMonitor() {
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTicks(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-light mb-8 text-white">SLA Health <span className="font-bold text-cyan-400">Monitor</span></h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-4 rounded-2xl text-center">
          <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">On Track</p>
          <p className="text-3xl font-bold text-green-400">2</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl text-center">
          <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">At Risk</p>
          <p className="text-3xl font-bold text-yellow-400">1</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl text-center">
          <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Breached</p>
          <p className="text-3xl font-bold text-red-400">1</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl text-center">
          <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Auto-Resolutions</p>
          <p className="text-3xl font-bold text-cyan-400">47</p>
        </div>
      </div>

      {/* SLA Workflow Cards */}
      <div className="space-y-4 mb-8">
        {slaWorkflows.map(wf => {
          const pct = Math.min((wf.elapsedHours / wf.slaHours) * 100, 100);
          const remaining = Math.max(wf.slaHours - wf.elapsedHours, 0);
          const hrs = Math.floor(remaining);
          const mins = Math.round((remaining - hrs) * 60);
          // Simulate countdown
          const displayMins = Math.max(mins - (ticks % 60), 0);

          return (
            <div key={wf.id} className={`glass-panel p-5 rounded-2xl border ${
              wf.status === 'breached' ? 'border-red-500/30' :
              wf.status === 'at-risk' ? 'border-yellow-500/30' :
              'border-transparent'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium">{wf.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      wf.status === 'on-track' ? 'bg-green-400/10 text-green-400' :
                      wf.status === 'at-risk' ? 'bg-yellow-400/10 text-yellow-400' :
                      'bg-red-400/10 text-red-400'
                    }`}>{wf.status.replace('-', ' ')}</span>
                  </div>
                  <p className="text-xs text-zinc-500">{wf.type} • Step: {wf.currentStep} • Agent: <span className="text-cyan-300 font-mono">{wf.agent}</span></p>
                </div>
                <div className="text-right">
                  <div className={`font-mono text-lg font-bold ${
                    wf.status === 'breached' ? 'text-red-400' :
                    wf.status === 'at-risk' ? 'text-yellow-400 animate-pulse' :
                    'text-green-400'
                  }`}>
                    {wf.status === 'breached' ? 'BREACHED' : `${hrs}h ${displayMins}m`}
                  </div>
                  <p className="text-[10px] text-zinc-600">remaining</p>
                </div>
              </div>

              {/* SLA Progress Bar */}
              <div className="w-full bg-zinc-800 rounded-full h-2 mb-2 overflow-hidden">
                <div className={`h-2 rounded-full transition-all duration-1000 ${
                  wf.status === 'breached' ? 'bg-red-500' :
                  wf.status === 'at-risk' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} style={{ width: `${pct}%` }}></div>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-xs text-zinc-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> {wf.prediction}
                </p>
                {wf.autoAction && (
                  <p className="text-xs text-cyan-400 flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3" /> {wf.autoAction}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottleneck Predictions */}
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-400" /> Bottleneck Predictions & Auto-Routing
        </h2>
        <div className="space-y-3">
          {bottlenecks.map((b, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4 bg-black/40 rounded-xl border border-zinc-800">
              <div className={`p-2 rounded-lg flex-shrink-0 ${
                b.risk === 'high' ? 'bg-red-500/10 text-red-400' :
                b.risk === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-green-500/10 text-green-400'
              }`}>
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-white">{b.area}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    b.risk === 'high' ? 'bg-red-400/10 text-red-400' :
                    b.risk === 'medium' ? 'bg-yellow-400/10 text-yellow-400' :
                    'bg-green-400/10 text-green-400'
                  }`}>{b.risk} risk</span>
                </div>
                <p className="text-xs text-zinc-500 mb-1">Avg delay: {b.avgDelay} • Frequency: {b.frequency}</p>
                <p className="text-xs text-cyan-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Agent suggestion: {b.suggestion}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
