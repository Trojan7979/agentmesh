import React, { useState } from 'react';
import { useSimulation } from './useSimulation';
import { WorkflowSimulator } from './components/WorkflowSimulator';
import { MeetingIntelView } from './components/MeetingIntelView';
import { MeetingsView } from './components/MeetingsView';
import { AgentCollabGraph } from './components/AgentCollabGraph';
import { SLAMonitor } from './components/SLAMonitor';
import { OnboardingView } from './components/OnboardingView';
import { AgentChat } from './components/AgentChat';
import { LoginPage } from './components/LoginPage';
import { RBACView } from './components/RBACView';
import {
  LayoutDashboard, GitMerge, Cpu, ShieldCheck,
  Network, Bot, Activity, AlertTriangle, Zap,
  BrainCircuit, Database, Check, RefreshCw, AlertCircle, Hexagon,
  Play, MessageSquare, Gauge, Users, UserPlus, Video, BotMessageSquare,
  Lock, LogOut
} from 'lucide-react';

const iconMap = {
  'Cpu': Cpu,
  'BrainCircuit': BrainCircuit,
  'Database': Database,
  'Zap': Zap,
  'ShieldCheck': ShieldCheck
};

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const liveData = useSimulation();

  if (!user) {
    return <LoginPage onLogin={(u) => setUser(u)} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'simulator', label: 'Live Simulator', icon: Play },
    { id: 'onboarding', label: 'Onboarding', icon: UserPlus },
    { id: 'workflows', label: 'Workflows', icon: GitMerge },
    { id: 'agents', label: 'Swarm Agents', icon: Cpu },
    { id: 'collab', label: 'Agent Collab', icon: Users },
    { id: 'meetings', label: 'Meetings', icon: Video },
    { id: 'sla', label: 'SLA Monitor', icon: Gauge },
    { id: 'chat', label: 'Agent Chat', icon: BotMessageSquare },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheck },
    { id: 'rbac', label: 'Access Control', icon: Lock },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100 antialiased selection:bg-cyan-500/30">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 glass-panel border-r border-zinc-800/50 flex flex-col pt-8 pb-4 relative z-50 shadow-2xl flex-shrink-0">
        <div className="px-6 mb-10 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Hexagon className="h-5 w-5 opacity-90" fill="currentColor" />
          </div>
          <h1 className="text-xl font-bold tracking-wide text-white">NEXUS<span className="font-light text-cyan-400">Core</span></h1>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id 
                  ? 'bg-zinc-800 text-cyan-400' 
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-cyan-400'
              }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-4 mt-auto space-y-3">
          <div className="p-3 rounded-xl border border-zinc-800/50 bg-black/40">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center text-[10px] text-white font-bold border border-zinc-700">
                {user.name.split(' ').map(w => w[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate font-medium">{user.name}</p>
                <p className="text-[10px] text-zinc-500 truncate">{user.role}</p>
              </div>
            </div>
            <button onClick={() => setUser(null)}
              className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/80 text-zinc-400 hover:text-red-400 text-[10px] transition-colors">
              <LogOut className="h-3 w-3" /> Sign Out
            </button>
          </div>
          <div className="p-3 rounded-xl border border-zinc-800/50 bg-black/40">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
              <span className="text-[10px] text-zinc-400 font-medium">System Online</span>
            </div>
            <div className="text-[10px] text-zinc-600 font-mono tracking-widest mt-1">NODE: US-EAST-1</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none"></div>
        <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none"></div>
        
        <div className="p-10 max-w-7xl mx-auto relative z-10 w-full min-h-full">
          <div key={activeTab} className="animate-fade-in">
            {activeTab === 'dashboard' && <DashboardView data={liveData} />}
            {activeTab === 'simulator' && <WorkflowSimulator />}
            {activeTab === 'onboarding' && <OnboardingView />}
            {activeTab === 'workflows' && <WorkflowsView data={liveData} />}
            {activeTab === 'agents' && <AgentsView data={liveData} />}
            {activeTab === 'collab' && <AgentCollabGraph />}
            {activeTab === 'meetings' && <MeetingsView />}
            {activeTab === 'sla' && <SLAMonitor />}
            {activeTab === 'chat' && <AgentChat />}
            {activeTab === 'audit' && <AuditTrailView data={liveData} />}
            {activeTab === 'rbac' && <RBACView currentUser={user} />}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- SUBVIEWS ---

function DashboardView({ data }) {
  const m = data.systemMetrics;
  return (
    <>
      <h1 className="text-3xl font-light mb-8 text-white">System <span className="font-bold text-cyan-400">Command Center</span></h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <MetricCard title="Active Workflows" value={m.activeWorkflows} icon={Network} colorClass="text-cyan-400" />
        <MetricCard title="Automated Tasks (24h)" value={m.tasksAutomated.toLocaleString()} icon={Bot} colorClass="text-green-400" />
        <MetricCard title="System Autonomy" value={m.autonomyRate} icon={Activity} colorClass="text-purple-400" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <MetricCard title="Self-Corrections" value={m.selfCorrections} icon={RefreshCw} colorClass="text-yellow-400" />
        <MetricCard title="Human Escalations" value={m.humanEscalations} icon={AlertTriangle} colorClass="text-red-400" />
        <MetricCard title="System Uptime" value={m.uptime} icon={ShieldCheck} colorClass="text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6 rounded-2xl">
          <h2 className="text-xl text-white mb-6 flex items-center gap-2">
            <AlertTriangle className="text-yellow-400 h-5 w-5" /> Self-Corrections & Escalations
          </h2>
          <div className="space-y-4">
            {data.workflows.filter(w => w.status !== 'completed').map(w => (
              <div key={w.id} className="p-4 bg-black/40 rounded-xl border border-zinc-700/50 flex justify-between items-center">
                <div>
                  <h4 className="text-white text-sm font-medium">{w.name}</h4>
                  <p className="text-zinc-400 text-xs mt-1">Health: {w.health}% | Progress: {w.progress}%</p>
                </div>
                {w.status === 'warning' 
                  ? <span className="px-3 py-1 bg-yellow-400/10 text-yellow-400 text-xs rounded-full border border-yellow-400/20">SLA Risk</span>
                  : <span className="px-3 py-1 bg-green-400/10 text-green-400 text-xs rounded-full border border-green-400/20">Stable</span>
                }
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <h2 className="text-xl text-white mb-6 flex items-center gap-2">
            <Cpu className="text-cyan-400 h-5 w-5" /> Agent Swarm Status
          </h2>
          <div className="space-y-4">
            {data.agents.map(a => {
              const IconComp = iconMap[a.avatar] || Cpu;
              return (
                <div key={a.id} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm text-white font-medium">{a.name}</h4>
                    <p className="text-xs text-zinc-500 truncate max-w-[250px]">{a.currentTask}</p>
                  </div>
                  <div className={`text-xs font-mono ${
                    a.status === 'self-correcting' ? 'text-yellow-400' :
                    a.status === 'active' || a.status === 'processing' ? 'text-cyan-400' :
                    'text-green-400'
                  }`}>{a.successRate}% SR</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function MetricCard({ title, value, icon: Icon, colorClass }) {
  return (
    <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
      <div>
        <h3 className="text-zinc-400 text-sm font-semibold mb-1 uppercase tracking-wider">{title}</h3>
        <div className="text-4xl text-white font-bold">{value}</div>
      </div>
      <div className={`p-4 bg-zinc-800/50 rounded-xl ${colorClass}`}>
        <Icon />
      </div>
    </div>
  );
}

function WorkflowsView({ data }) {
  return (
    <>
      <h1 className="text-3xl font-light mb-8 text-white">Process <span className="font-bold text-cyan-400">Orchestration</span></h1>
      <div className="space-y-8">
        {data.workflows.map(wf => (
          <div key={wf.id} className="glass-panel p-6 rounded-2xl">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-cyan-400 text-xs uppercase tracking-widest font-bold mb-1">{wf.type}</p>
                <h2 className="text-2xl text-white font-medium">{wf.name}</h2>
              </div>
              <div className="text-right">
                <span className="text-white text-3xl font-bold">{wf.progress}%</span>
                <p className="text-zinc-400 text-sm">Completion</p>
              </div>
            </div>
            
            <div className="w-full bg-zinc-800 rounded-full h-2 mb-8 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-1000" style={{width: `${wf.progress}%`}}></div>
            </div>

            <div className="relative pl-8 space-y-6">
              <div className="timeline-stem"></div>
              {wf.steps.map((step) => (
                <div key={step.id} className="relative z-10 flex gap-4">
                  <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center border-2 bg-black flex-shrink-0 ${
                    step.status === 'completed' ? 'border-cyan-500 text-cyan-500' :
                    step.status === 'self-corrected' ? 'border-yellow-500 text-yellow-500' :
                    step.status === 'escalated' ? 'border-red-500 text-red-500' :
                    'border-zinc-600 text-zinc-600'
                  }`}>
                    {step.status === 'completed' && <Check className="h-4 w-4" />}
                    {step.status === 'self-corrected' && <RefreshCw className="h-4 w-4" />}
                    {step.status === 'escalated' && <AlertCircle className="h-4 w-4" />}
                    {step.status === 'pending' && <span className="h-2 w-2 rounded-full bg-zinc-600 flex-shrink-0"></span>}
                    {step.status === 'in-progress' && <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0"></span>}
                  </div>
                  <div className="flex-1 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium text-white">{step.name}</h4>
                      <span className="text-xs text-zinc-500">{step.time}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-2">Agent: <span className="text-cyan-300 font-mono">{step.agent}</span></p>
                    {step.detail && (
                      <div className={`bg-black/50 p-2 rounded text-xs border-l-2 ${
                        step.status === 'self-corrected' ? 'border-yellow-500 text-yellow-200' :
                        step.status === 'escalated' ? 'border-red-500 text-red-200' :
                        'border-cyan-500 text-cyan-200'
                      }`}>{step.detail}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function AgentsView({ data }) {
  return (
    <>
      <h1 className="text-3xl font-light mb-8 text-white">Swarm <span className="font-bold text-cyan-400">Intelligence</span></h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.agents.map(a => {
          let statusClass = 'dot-blue';
          let cardClass = 'agent-active';
          if (a.status === 'idle') { statusClass = 'dot-green'; cardClass = ''; }
          if (a.status === 'self-correcting') { statusClass = 'dot-yellow'; cardClass = 'agent-self-correcting'; }
          
          const IconComp = iconMap[a.avatar] || Cpu;

          return (
            <div key={a.id} className={`glass-panel p-6 rounded-2xl flex flex-col items-center text-center ${cardClass}`}>
              <div className="relative mb-4">
                <div className="avatar-ring absolute inset-0 rounded-full border-2 opacity-50"></div>
                <div className="h-20 w-20 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-200 relative z-10 border border-zinc-700">
                  <IconComp className="h-10 w-10" />
                </div>
                <div className={`absolute bottom-0 right-0 ${statusClass} status-dot border-2 border-[#18181b] z-20`}></div>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-1">{a.name}</h3>
              <p className="text-xs text-cyan-400 uppercase tracking-wider font-semibold mb-4">{a.role}</p>
              
              <div className="w-full bg-black/40 rounded-xl p-4 border border-zinc-800 flex-1 flex flex-col justify-center">
                <p className="text-xs text-zinc-400 mb-2">Current Task:</p>
                <p className="text-sm text-zinc-200">{a.currentTask}</p>
              </div>

              <div className="w-full flex justify-between items-center mt-6 pt-4 border-t border-zinc-800/50">
                <span className="text-xs text-zinc-500">Success Rate</span>
                <span className="text-sm text-green-400 font-mono">{a.successRate}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function AuditTrailView({ data }) {
  return (
    <>
      <h1 className="text-3xl font-light mb-8 text-white">System <span className="font-bold text-cyan-400">Audit Trail</span></h1>
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="bg-zinc-900/80 p-4 border-b border-zinc-800 grid grid-cols-12 gap-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <div className="col-span-2">Time</div>
          <div className="col-span-1">Level</div>
          <div className="col-span-3">Agent</div>
          <div className="col-span-6">Action / Detail</div>
        </div>
        <div className="divide-y divide-zinc-800/50 max-h-[600px] overflow-y-auto">
          {data.auditLogs.map(log => {
            let Icon = Activity;
            let typeColor = 'text-cyan-400';
            
            if (log.type === 'warning' || log.type === 'escalation') {
                Icon = AlertTriangle;
                typeColor = 'text-yellow-400';
            } else if (log.type === 'action') {
                Icon = Zap;
                typeColor = 'text-purple-400';
            }

            return (
              <div key={log.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-zinc-800/20 transition-colors">
                <div className="col-span-2 font-mono text-xs text-zinc-500">{log.time}</div>
                <div className={`col-span-1 flex items-center ${typeColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className={`col-span-3 font-mono text-xs font-semibold ${typeColor}`}>
                  {log.agent}
                </div>
                <div className="col-span-6 text-sm text-zinc-300">{log.message}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
