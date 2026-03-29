import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Bot, User, Cpu, BrainCircuit, Database,
  Zap, ShieldCheck, Loader, ChevronDown, Sparkles
} from 'lucide-react';

const agents = [
  { id: 'orchestrator', name: 'Nexus Orchestrator', icon: Cpu, color: 'cyan', desc: 'Manages workflows & routing' },
  { id: 'intel', name: 'MeetIntel Core', icon: BrainCircuit, color: 'purple', desc: 'Analyzes meetings & docs' },
  { id: 'retrieval', name: 'Data Fetcher v4', icon: Database, color: 'blue', desc: 'Retrieves data & context' },
  { id: 'executor', name: 'Action Exec Alpha', icon: Zap, color: 'yellow', desc: 'Executes tasks & actions' },
  { id: 'verifier', name: 'Shield Verifier', icon: ShieldCheck, color: 'green', desc: 'Validates & audits' },
];

const colorClasses = {
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', ring: 'ring-cyan-500/20' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', ring: 'ring-purple-500/20' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', ring: 'ring-blue-500/20' },
  yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', ring: 'ring-yellow-500/20' },
  green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', ring: 'ring-green-500/20' },
};

// Simulated agent responses based on keywords
function generateResponse(agentId, message) {
  const msg = message.toLowerCase();
  const responses = {
    orchestrator: [
      { keywords: ['workflow', 'process', 'start', 'create'], response: "I've analyzed the request and initiated a new workflow. Here's the plan:\n\n1. ✅ Request received and validated\n2. 🔄 Routing to appropriate agents\n3. ⏳ Awaiting data retrieval\n4. ⏳ Execution pending\n\nEstimated completion: 15 minutes. I'll coordinate all agents automatically." },
      { keywords: ['status', 'update', 'progress'], response: "Current system status:\n\n• **Active Workflows:** 142\n• **Pending Approvals:** 3\n• **SLA At-Risk:** 1 (Globex Contract - 2h remaining)\n\nAll agents are online and operational. Shall I escalate the at-risk workflow?" },
      { keywords: ['assign', 'delegate', 'route'], response: "Task routing analysis complete. Based on the request type and current agent workloads:\n\n• **Primary:** Action Exec Alpha (97.4% success rate, currently idle)\n• **Backup:** Data Fetcher v4 (if data retrieval needed first)\n\nShall I proceed with the assignment?" },
      { keywords: ['help', 'what can you do'], response: "I'm the Nexus Orchestrator — I manage and coordinate all enterprise workflows.\n\nI can help you with:\n• 🔄 Starting new workflows (procurement, onboarding, contracts)\n• 📊 Checking workflow status and SLA health\n• 🚦 Routing tasks to specialized agents\n• ⚡ Escalating stalled processes\n• 📋 Generating workflow reports\n\nWhat would you like to do?" },
    ],
    intel: [
      { keywords: ['meeting', 'transcript', 'analyze'], response: "I've processed the latest meeting recordings:\n\n📋 **Q3 Strategy Sync** (47 min)\n• 3 decisions extracted\n• 5 action items identified\n• 1 escalation flagged\n\nKey finding: API migration deadline needs resource adjustment. I've already created tasks for the relevant owners." },
      { keywords: ['summary', 'summarize', 'brief'], response: "Here's today's intelligence brief:\n\n**Decisions Made:**\n• Redis selected over Memcached for caching\n• Dashboard feature → Sprint 24 kickoff\n\n**Outstanding Actions:**\n• Billing API parallelization (Due: Mar 29) ⚠️\n• Staging deployment (Due: Mar 31)\n• Redis ADR document (Due: Apr 4)\n\nAll items have been synced to Jira automatically." },
      { keywords: ['extract', 'action', 'decision'], response: "Running NLP extraction on the latest documents...\n\n✅ Analysis complete. Found:\n• **4 decisions** requiring documentation\n• **7 action items** with assigned owners\n• **2 risks** flagged for review\n\nI've auto-created tickets in Jira and sent Slack notifications to all owners. Shall I generate a detailed report?" },
    ],
    retrieval: [
      { keywords: ['find', 'search', 'look', 'get', 'fetch'], response: "Searching across all connected data sources...\n\n🔍 **Sources queried:** NetSuite, Salesforce, Workday, Google Drive, Confluence\n⏱️ **Query time:** 1.2 seconds\n📊 **Results found:** 23 relevant records\n\nTop results are ready. Would you like me to filter by a specific source or time period?" },
      { keywords: ['vendor', 'supplier'], response: "Vendor lookup results:\n\n**Acme Cloud Inc.** (ID: V-2291)\n• DUNS Verified ✅\n• SOC2 Type II: Valid until Dec 2026 ✅\n• GDPR DPA: On file ✅\n• Risk Score: 12/100 (Low) ✅\n• Payment History: 100% on-time\n\nThis vendor is pre-approved for procurement workflows." },
      { keywords: ['report', 'data', 'analytics'], response: "Compiling data from enterprise systems...\n\n📈 **Q3 Metrics Dashboard:**\n• Revenue: $4.2M (+12% QoQ)\n• Customer Retention: 96.3%\n• Support Tickets: 47 (avg resolution: 3.2h)\n• Agent Automation Rate: 99.92%\n\nFull report has been generated and saved to your shared drive." },
    ],
    executor: [
      { keywords: ['send', 'email', 'notify', 'message'], response: "Action executed successfully! ✅\n\n📧 **Email sent** to the specified recipients\n• Template: Professional notification\n• Tracking ID: EX-2026-4493\n• Delivery status: Confirmed\n\nI've logged this action in the audit trail for compliance." },
      { keywords: ['create', 'setup', 'provision', 'deploy'], response: "Executing provisioning sequence...\n\n1. ✅ Account created in system\n2. ✅ Permissions configured\n3. ✅ Welcome notification sent\n4. ✅ Verification email dispatched\n\nAll resources provisioned successfully. Total execution time: 4.2 seconds." },
      { keywords: ['update', 'change', 'modify'], response: "Processing update request...\n\n✅ **Update applied successfully**\n• Records modified: 1\n• Verification: Passed\n• Rollback point: Created (ID: RB-8891)\n\nChanges are live. I've created an automatic rollback point in case you need to revert." },
    ],
    verifier: [
      { keywords: ['check', 'verify', 'validate', 'audit'], response: "Running comprehensive verification...\n\n🔒 **Compliance Check Results:**\n• Data integrity: ✅ Passed\n• Access controls: ✅ Verified\n• Regulatory compliance: ✅ SOC2, GDPR, HIPAA\n• Audit trail: ✅ Complete (142 entries)\n\nNo anomalies detected. System is fully compliant." },
      { keywords: ['security', 'risk', 'threat'], response: "Security assessment complete:\n\n🛡️ **Risk Analysis:**\n• Overall risk score: 8/100 (Very Low)\n• Active threats: 0\n• Last vulnerability scan: 2h ago\n• Patches pending: None\n\nAll security protocols are operating within normal parameters." },
      { keywords: ['compliance', 'policy', 'regulation'], response: "Policy compliance dashboard:\n\n📋 **Active Policies:** 24\n• Fully compliant: 23 ✅\n• Needs review: 1 ⚠️ (Data retention policy — update due in 30 days)\n\nI've scheduled an automatic review reminder and notified the compliance team." },
    ],
  };

  const agentResponses = responses[agentId] || responses.orchestrator;
  
  for (const resp of agentResponses) {
    if (resp.keywords.some(kw => msg.includes(kw))) {
      return resp.response;
    }
  }

  // Default response
  const defaults = {
    orchestrator: "I understand your request. Let me analyze the best approach and coordinate with the appropriate agents. Could you provide a bit more detail about what you'd like to accomplish?",
    intel: "I'll process that through our intelligence pipeline. Could you specify which meetings, documents, or data sources you'd like me to analyze?",
    retrieval: "I'm ready to search our connected data sources. What specific information are you looking for? I can query NetSuite, Salesforce, Workday, and more.",
    executor: "I can execute that action for you. Please confirm the specific task you'd like me to perform, and I'll handle it with full audit logging.",
    verifier: "I'll run a verification check on that. Please specify what you'd like me to validate — I can check compliance, data integrity, security, or process adherence.",
  };

  return defaults[agentId] || defaults.orchestrator;
}

export function AgentChat() {
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'agent', text: "Hello! I'm the **Nexus Orchestrator**. I manage and coordinate all enterprise workflows.\n\nI can help you with:\n• Starting new workflows\n• Checking system status\n• Routing tasks to specialized agents\n• Escalating stalled processes\n\nWhat would you like to do?", agentId: 'orchestrator' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const switchAgent = (agent) => {
    setSelectedAgent(agent);
    setShowAgentPicker(false);
    setMessages([{
      sender: 'agent',
      text: `Switched to **${agent.name}**. ${agent.desc}. How can I assist you?`,
      agentId: agent.id
    }]);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    // Simulate agent thinking
    const delay = 1000 + Math.random() * 1500;
    setTimeout(() => {
      const response = generateResponse(selectedAgent.id, userMsg);
      setMessages(prev => [...prev, { sender: 'agent', text: response, agentId: selectedAgent.id }]);
      setIsTyping(false);
    }, delay);
  };

  const c = colorClasses[selectedAgent.color];
  const AgentIcon = selectedAgent.icon;

  // Simple markdown-like rendering
  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');
      if (line.startsWith('•')) {
        return <li key={i} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: processed }} />;
      }
      return <p key={i} className={line === '' ? 'h-2' : ''} dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-light text-white">Agent <span className="font-bold text-cyan-400">Chat</span></h1>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Agent Selector Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-2">
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3 px-1">Select Agent</p>
          {agents.map(agent => {
            const ac = colorClasses[agent.color];
            const isActive = selectedAgent.id === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => switchAgent(agent)}
                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all text-left ${
                  isActive ? `${ac.bg} ${ac.border} border ${ac.ring} ring-2` : 'glass-panel hover:border-zinc-600'
                }`}
              >
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${ac.bg}`}>
                  <agent.icon className={`h-5 w-5 ${ac.text}`} />
                </div>
                <div>
                  <h4 className={`text-sm font-medium ${isActive ? ac.text : 'text-zinc-300'}`}>{agent.name}</h4>
                  <p className="text-[10px] text-zinc-500">{agent.desc}</p>
                </div>
              </button>
            );
          })}

          {/* Quick Actions */}
          <div className="mt-6 pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3 px-1">Quick Prompts</p>
            {[
              'Check system status',
              'Start a new workflow',
              'Find vendor info',
              'Run compliance check',
              'Summarize meetings'
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => { setInput(prompt); }}
                className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800/50 rounded-lg transition-colors"
              >
                <Sparkles className="h-3 w-3 inline mr-2 opacity-50" />{prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className={`p-4 border-b border-zinc-800 flex items-center gap-3 ${c.bg}`}>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${c.bg} border ${c.border}`}>
              <AgentIcon className={`h-4 w-4 ${c.text}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{selectedAgent.name}</h3>
              <p className="text-[10px] text-green-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span> Online
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                {msg.sender === 'agent' && (
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center mr-2 mt-1 flex-shrink-0 ${c.bg}`}>
                    <AgentIcon className={`h-3.5 w-3.5 ${c.text}`} />
                  </div>
                )}
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-cyan-600/20 text-cyan-100 rounded-br-none border border-cyan-500/20'
                    : 'bg-zinc-800/80 text-zinc-300 rounded-bl-none border border-zinc-700'
                }`}>
                  {renderText(msg.text)}
                </div>
                {msg.sender === 'user' && (
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center ml-2 mt-1 flex-shrink-0 bg-zinc-800">
                    <User className="h-3.5 w-3.5 text-zinc-400" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center mr-2 mt-1 flex-shrink-0 ${c.bg}`}>
                  <AgentIcon className={`h-3.5 w-3.5 ${c.text}`} />
                </div>
                <div className="bg-zinc-800/80 px-4 py-3 rounded-2xl rounded-bl-none border border-zinc-700 text-sm text-zinc-400 flex items-center gap-2">
                  <Loader className="h-3 w-3 animate-spin" /> Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-zinc-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder={`Ask ${selectedAgent.name} anything...`}
                className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl text-sm font-semibold text-white hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-30"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
