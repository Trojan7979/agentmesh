import React, { useState } from 'react';
import {
  UserPlus, Users, Search, Upload, Check, ChevronRight,
  Mail, Phone, Building, Briefcase, Calendar, MapPin,
  Bot, Loader, CheckCircle2, Clock, Eye, X, Camera
} from 'lucide-react';

const existingEmployees = [
  { id: 'emp-1', name: 'Sarah Connor', role: 'Senior Engineer', department: 'Engineering', email: 'sarah.connor@nexuscore.ai', phone: '+1 (555) 234-5678', location: 'San Francisco, CA', startDate: 'Apr 15, 2026', status: 'onboarding', progress: 75, avatar: 'SC' },
  { id: 'emp-2', name: 'James Rodriguez', role: 'Product Manager', department: 'Product', email: 'james.rodriguez@nexuscore.ai', phone: '+1 (555) 345-6789', location: 'New York, NY', startDate: 'Mar 01, 2026', status: 'active', progress: 100, avatar: 'JR' },
  { id: 'emp-3', name: 'Priya Patel', role: 'UX Designer', department: 'Design', email: 'priya.patel@nexuscore.ai', phone: '+1 (555) 456-7890', location: 'Austin, TX', startDate: 'Feb 15, 2026', status: 'active', progress: 100, avatar: 'PP' },
  { id: 'emp-4', name: 'Alex Kim', role: 'Backend Lead', department: 'Engineering', email: 'alex.kim@nexuscore.ai', phone: '+1 (555) 567-8901', location: 'Seattle, WA', startDate: 'Jan 10, 2026', status: 'active', progress: 100, avatar: 'AK' },
];

const onboardingAgentSteps = [
  { question: "Welcome! I'm the Onboarding Agent. Let's get started. What is the new employee's full name?", field: 'name', type: 'text' },
  { question: "Great! What role will they be joining as?", field: 'role', type: 'text' },
  { question: "Which department?", field: 'department', type: 'select', options: ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Finance', 'HR', 'Legal'] },
  { question: "What's their email address?", field: 'email', type: 'text' },
  { question: "Phone number?", field: 'phone', type: 'text' },
  { question: "Office location?", field: 'location', type: 'text' },
  { question: "What is their start date?", field: 'startDate', type: 'date' },
  { question: "Please upload their profile photo.", field: 'photo', type: 'file' },
];

const automationSteps = [
  { name: 'Identity Verification', agent: 'Shield Verifier', duration: 2000 },
  { name: 'Background Check Initiated', agent: 'Data Fetcher v4', duration: 2500 },
  { name: 'Google Workspace Account Created', agent: 'Action Exec Alpha', duration: 1500 },
  { name: 'Slack & GitHub Provisioned', agent: 'Action Exec Alpha', duration: 1800 },
  { name: 'Hardware Request Submitted', agent: 'Nexus Orchestrator', duration: 1200 },
  { name: 'Manager Notification Sent', agent: 'Action Exec Alpha', duration: 1000 },
  { name: 'Day 1 Calendar Created', agent: 'Action Exec Alpha', duration: 1500 },
  { name: 'Onboarding Complete ✓', agent: 'Shield Verifier', duration: 1000 },
];

export function OnboardingView() {
  const [view, setView] = useState('portal'); // portal | new | detail
  const [employees, setEmployees] = useState(existingEmployees);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Onboarding form state
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [automationPhase, setAutomationPhase] = useState(false);
  const [automationIdx, setAutomationIdx] = useState(-1);
  const [photoPreview, setPhotoPreview] = useState(null);

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startOnboarding = () => {
    setView('new');
    setCurrentStep(0);
    setFormData({});
    setChatHistory([{ sender: 'agent', text: onboardingAgentSteps[0].question }]);
    setUserInput('');
    setAutomationPhase(false);
    setAutomationIdx(-1);
    setPhotoPreview(null);
  };

  const handleSubmitAnswer = () => {
    if (!userInput.trim() && onboardingAgentSteps[currentStep].type !== 'file') return;

    const step = onboardingAgentSteps[currentStep];
    const answer = userInput;

    setChatHistory(prev => [...prev, { sender: 'user', text: answer }]);
    setFormData(prev => ({ ...prev, [step.field]: answer }));
    setUserInput('');
    setIsAgentTyping(true);

    setTimeout(() => {
      setIsAgentTyping(false);
      if (currentStep < onboardingAgentSteps.length - 1) {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        setChatHistory(prev => [...prev, { sender: 'agent', text: onboardingAgentSteps[nextStep].question }]);
      } else {
        setChatHistory(prev => [...prev, {
          sender: 'agent',
          text: `Excellent! I have all the details for ${formData.name || answer}. Initiating automated onboarding sequence now...`
        }]);
        setTimeout(() => startAutomation(), 1500);
      }
    }, 800);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreview(ev.target.result);
        setFormData(prev => ({ ...prev, photo: ev.target.result }));
        setChatHistory(prev => [...prev, { sender: 'user', text: '📷 Photo uploaded', isPhoto: true, photoUrl: ev.target.result }]);
        setIsAgentTyping(true);
        setTimeout(() => {
          setIsAgentTyping(false);
          setChatHistory(prev => [...prev, {
            sender: 'agent',
            text: `Perfect! I have all the information. Let me now run the automated onboarding sequence for ${formData.name || 'the new employee'}...`
          }]);
          setTimeout(() => startAutomation(), 1500);
        }, 800);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAutomation = () => {
    setAutomationPhase(true);
    setAutomationIdx(0);
  };

  React.useEffect(() => {
    if (!automationPhase || automationIdx < 0 || automationIdx >= automationSteps.length) return;

    const timer = setTimeout(() => {
      if (automationIdx >= automationSteps.length - 1) {
        // Done — add employee to list
        const newEmp = {
          id: `emp-new-${Date.now()}`,
          name: formData.name || 'New Employee',
          role: formData.role || 'Team Member',
          department: formData.department || 'Engineering',
          email: formData.email || 'new@nexuscore.ai',
          phone: formData.phone || '',
          location: formData.location || '',
          startDate: formData.startDate || 'TBD',
          status: 'onboarding',
          progress: 100,
          avatar: (formData.name || 'NE').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
          photo: formData.photo || null
        };
        setEmployees(prev => [newEmp, ...prev]);
        setAutomationIdx(prev => prev + 1);
      } else {
        setAutomationIdx(prev => prev + 1);
      }
    }, automationSteps[automationIdx]?.duration || 1500);

    return () => clearTimeout(timer);
  }, [automationPhase, automationIdx]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-light text-white">Employee <span className="font-bold text-cyan-400">
          {view === 'portal' ? 'Management' : view === 'new' ? 'Onboarding' : 'Profile'}
        </span></h1>
        <div className="flex gap-2">
          {view !== 'portal' && (
            <button onClick={() => setView('portal')} className="px-4 py-2 bg-zinc-800 rounded-xl text-sm text-zinc-400 hover:text-white transition-colors">
              ← Back to Portal
            </button>
          )}
          {view === 'portal' && (
            <button onClick={startOnboarding} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all">
              <UserPlus className="h-4 w-4" /> New Employee
            </button>
          )}
        </div>
      </div>

      {/* === PORTAL VIEW === */}
      {view === 'portal' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-panel p-4 rounded-2xl text-center">
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Total Employees</p>
              <p className="text-3xl font-bold text-white">{employees.length}</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl text-center">
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Active</p>
              <p className="text-3xl font-bold text-green-400">{employees.filter(e => e.status === 'active').length}</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl text-center">
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Onboarding</p>
              <p className="text-3xl font-bold text-cyan-400">{employees.filter(e => e.status === 'onboarding').length}</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl text-center">
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Departments</p>
              <p className="text-3xl font-bold text-purple-400">{new Set(employees.map(e => e.department)).size}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search employees by name, role, or department..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>

          {/* Employee Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map(emp => (
              <div
                key={emp.id}
                onClick={() => { setSelectedEmployee(emp); setView('detail'); }}
                className="glass-panel p-5 rounded-2xl cursor-pointer hover:border-cyan-500/30 transition-all group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center text-white font-bold text-sm border border-zinc-700 overflow-hidden">
                    {emp.photo ? <img src={emp.photo} alt="" className="h-full w-full object-cover" /> : emp.avatar}
                  </div>
                  <div>
                    <h3 className="text-white font-medium group-hover:text-cyan-400 transition-colors">{emp.name}</h3>
                    <p className="text-xs text-zinc-500">{emp.role}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 flex items-center gap-1"><Building className="h-3 w-3" /> {emp.department}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    emp.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-cyan-400/10 text-cyan-400'
                  }`}>{emp.status}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* === DETAIL VIEW === */}
      {view === 'detail' && selectedEmployee && (
        <div className="glass-panel p-8 rounded-2xl max-w-2xl mx-auto">
          <div className="flex items-center gap-6 mb-8">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center text-white font-bold text-2xl border border-zinc-700 overflow-hidden">
              {selectedEmployee.photo ? <img src={selectedEmployee.photo} alt="" className="h-full w-full object-cover" /> : selectedEmployee.avatar}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{selectedEmployee.name}</h2>
              <p className="text-cyan-400 text-sm">{selectedEmployee.role}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                selectedEmployee.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-cyan-400/10 text-cyan-400'
              }`}>{selectedEmployee.status}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { icon: Mail, label: 'Email', value: selectedEmployee.email },
              { icon: Phone, label: 'Phone', value: selectedEmployee.phone },
              { icon: Building, label: 'Department', value: selectedEmployee.department },
              { icon: MapPin, label: 'Location', value: selectedEmployee.location },
              { icon: Calendar, label: 'Start Date', value: selectedEmployee.startDate },
              { icon: Briefcase, label: 'Onboarding', value: `${selectedEmployee.progress}% Complete` },
            ].map((item, i) => (
              <div key={i} className="bg-black/30 p-4 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                  <item.icon className="h-3 w-3" /> {item.label}
                </div>
                <p className="text-white">{item.value}</p>
              </div>
            ))}
          </div>
          {selectedEmployee.progress < 100 && (
            <div className="mt-6">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-zinc-400">Onboarding Progress</span>
                <span className="text-cyan-400">{selectedEmployee.progress}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full" style={{ width: `${selectedEmployee.progress}%` }}></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === ONBOARDING CHAT VIEW === */}
      {view === 'new' && (
        <div className="max-w-3xl mx-auto">
          <div className="glass-panel rounded-2xl overflow-hidden">
            {/* Chat Header */}
            <div className="bg-zinc-900/80 p-4 border-b border-zinc-800 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Onboarding Agent</h3>
                <p className="text-[10px] text-green-400">Online • Step {Math.min(currentStep + 1, onboardingAgentSteps.length)} of {onboardingAgentSteps.length}</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="p-6 max-h-[400px] overflow-y-auto space-y-4">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                    msg.sender === 'user'
                      ? 'bg-cyan-600/20 text-cyan-100 rounded-br-none border border-cyan-500/20'
                      : 'bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700'
                  }`}>
                    {msg.isPhoto && msg.photoUrl ? (
                      <div>
                        <img src={msg.photoUrl} alt="uploaded" className="h-16 w-16 rounded-lg object-cover mb-1" />
                        <p className="text-xs opacity-70">Photo uploaded</p>
                      </div>
                    ) : msg.text}
                  </div>
                </div>
              ))}
              {isAgentTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-zinc-800 px-4 py-3 rounded-2xl rounded-bl-none border border-zinc-700 text-sm text-zinc-400 flex items-center gap-2">
                    <Loader className="h-3 w-3 animate-spin" /> Typing...
                  </div>
                </div>
              )}
            </div>

            {/* Automation Panel */}
            {automationPhase && (
              <div className="px-6 pb-4">
                <div className="bg-black/40 rounded-xl p-4 border border-zinc-800">
                  <h4 className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-1">
                    <Bot className="h-3 w-3" /> Automated Onboarding Sequence
                  </h4>
                  <div className="space-y-2">
                    {automationSteps.map((step, idx) => (
                      <div key={idx} className={`flex items-center gap-3 text-sm transition-all duration-500 ${idx <= automationIdx ? 'opacity-100' : 'opacity-20'}`}>
                        <span className="flex-shrink-0">
                          {idx < automationIdx ? <CheckCircle2 className="h-4 w-4 text-green-400" /> :
                           idx === automationIdx ? <Loader className="h-4 w-4 text-cyan-400 animate-spin" /> :
                           <Clock className="h-4 w-4 text-zinc-600" />}
                        </span>
                        <span className="text-zinc-300 flex-1">{step.name}</span>
                        <span className="text-[10px] text-cyan-400 font-mono">{step.agent}</span>
                      </div>
                    ))}
                  </div>
                  {automationIdx >= automationSteps.length && (
                    <div className="mt-4 pt-3 border-t border-zinc-800 text-center">
                      <p className="text-green-400 text-sm font-bold">✓ Employee Successfully Onboarded!</p>
                      <button onClick={() => setView('portal')} className="mt-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-lg text-xs hover:bg-cyan-500/20">
                        View in Employee Portal →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Input Area */}
            {!automationPhase && (
              <div className="p-4 border-t border-zinc-800">
                {onboardingAgentSteps[currentStep]?.type === 'file' ? (
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-cyan-500/50 transition-colors">
                    <Camera className="h-5 w-5 text-zinc-400" />
                    <span className="text-sm text-zinc-400">Click to upload photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                ) : onboardingAgentSteps[currentStep]?.type === 'select' ? (
                  <div className="flex flex-wrap gap-2">
                    {onboardingAgentSteps[currentStep].options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => { setUserInput(opt); setTimeout(() => { setUserInput(opt); }, 0); }}
                        className={`px-4 py-2 rounded-xl text-sm border transition-all ${
                          userInput === opt ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                    {userInput && (
                      <button onClick={handleSubmitAnswer} className="px-4 py-2 bg-cyan-600 rounded-xl text-sm font-semibold text-white ml-auto">
                        Confirm →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type={onboardingAgentSteps[currentStep]?.type === 'date' ? 'date' : 'text'}
                      value={userInput}
                      onChange={e => setUserInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSubmitAnswer()}
                      placeholder="Type your answer..."
                      className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
                    />
                    <button onClick={handleSubmitAnswer} className="px-5 py-3 bg-cyan-600 rounded-xl text-sm font-semibold text-white hover:bg-cyan-500 transition-colors">
                      Send
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
