import React, { useState, useEffect, useRef } from 'react';
import { scenarios as mockScenarios } from '../mockScenarios';
import { DecisionPanel } from './DecisionPanel';
import {
  fetchScenarios,
  startSimulation as apiStartSimulation,
  fetchWorkflow,
  pauseWorkflow,
  resumeWorkflow,
  connectWebSocket,
} from '../api';
import {
  Play, Pause, RotateCcw, AlertTriangle, Check, RefreshCw,
  Loader, ChevronRight, Zap, ShieldAlert, Clock
} from 'lucide-react';

export function WorkflowSimulator() {
  const [scenarios, setScenarios] = useState(mockScenarios);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [workflowId, setWorkflowId] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [chaosMode, setChaosMode] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]);
  const [failureInfo, setFailureInfo] = useState(null);
  const [recoverySteps, setRecoverySteps] = useState([]);
  const [recoveryIdx, setRecoveryIdx] = useState(-1);
  const wsRef = useRef(null);
  const pollRef = useRef(null);

  // Load scenarios from backend (fallback to mock)
  useEffect(() => {
    (async () => {
      const data = await fetchScenarios();
      if (data && data.length > 0) {
        // Merge backend scenario metadata with mock step details for display
        // Backend scenarios are used for the API call; mock for rich UI data
        setScenarios(mockScenarios);
      }
    })();
  }, []);

  const reset = () => {
    setIsRunning(false);
    setWorkflowId(null);
    setWorkflow(null);
    setLiveEvents([]);
    setFailureInfo(null);
    setRecoverySteps([]);
    setRecoveryIdx(-1);
    setSelectedStep(null);
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const startSimulation = async (scenario) => {
    setSelectedScenario(scenario);
    reset();
    setIsRunning(true);
    setLiveEvents([]);

    // Map mockScenario id to backend scenario id
    const scenarioIdMap = {
      'procure-to-pay': 'sc-p2p',
      'employee-onboarding': 'sc-onboard',
      'contract-lifecycle': 'sc-contract',
    };
    const backendId = scenarioIdMap[scenario.id] || scenario.id;

    // Call backend to start the simulation
    const wf = await apiStartSimulation(backendId, chaosMode, 2500);

    if (wf && wf.id) {
      setWorkflowId(wf.id);
      setWorkflow(wf);

      // Start polling for workflow state
      pollRef.current = setInterval(async () => {
        const updated = await fetchWorkflow(wf.id);
        if (updated) {
          setWorkflow(updated);
          if (updated.status === 'completed' || updated.status === 'failed') {
            setIsRunning(false);
            clearInterval(pollRef.current);
          }
        }
      }, 1500);

      // Connect WebSocket for live events
      const ws = connectWebSocket((event) => {
        if (event.workflow_id !== wf.id) return;

        setLiveEvents(prev => [...prev, event]);

        // Handle failure detection
        if (event.type === 'WORKFLOW_FAILURE_DETECTED') {
          setFailureInfo(event);
          setRecoverySteps([]);
          setRecoveryIdx(0);
        }
        if (event.type === 'WORKFLOW_RECOVERY_STEP') {
          setRecoverySteps(prev => [...prev, event]);
          setRecoveryIdx(prev => prev + 1);
        }
        if (event.type === 'WORKFLOW_SELF_CORRECTED') {
          // After a brief pause, clear the failure display
          setTimeout(() => {
            setFailureInfo(null);
            setRecoverySteps([]);
            setRecoveryIdx(-1);
          }, 1000);
        }
      });
      wsRef.current = ws;
    } else {
      // Backend not available — fall back to client-side simulation
      fallbackClientSimulation(scenario);
    }
  };

  // Client-side fallback (original behavior)
  const [clientStepIdx, setClientStepIdx] = useState(-1);
  const [clientCompleted, setClientCompleted] = useState([]);
  const [clientFailure, setClientFailure] = useState(false);
  const [clientRecovery, setClientRecovery] = useState([]);
  const [clientRecoveryIdx, setClientRecoveryIdx] = useState(-1);
  const clientTimerRef = useRef(null);

  const fallbackClientSimulation = (scenario) => {
    setClientStepIdx(0);
    setClientCompleted([]);
    setClientFailure(false);
    setClientRecovery([]);
    setClientRecoveryIdx(-1);
  };

  // Client-side step progression
  useEffect(() => {
    if (workflowId || !isRunning || !selectedScenario || clientStepIdx < 0) return;
    const steps = selectedScenario.steps;
    if (clientStepIdx >= steps.length) { setIsRunning(false); return; }

    const step = steps[clientStepIdx];

    if (chaosMode && step.canFail && !clientFailure && !clientCompleted.find(s => s.id === step.id && s.recovered)) {
      clientTimerRef.current = setTimeout(() => {
        setClientFailure(true);
        setClientRecovery(step.failureScenario.recovery);
        setClientRecoveryIdx(0);
      }, step.duration / 2);
      return;
    }

    clientTimerRef.current = setTimeout(() => {
      setClientCompleted(prev => [...prev, { ...step, recovered: false }]);
      setClientStepIdx(prev => prev + 1);
    }, step.duration);

    return () => clearTimeout(clientTimerRef.current);
  }, [isRunning, clientStepIdx, selectedScenario, chaosMode, clientFailure, workflowId]);

  // Client-side recovery progression
  useEffect(() => {
    if (workflowId) return;
    if (!clientFailure || clientRecoveryIdx < 0 || clientRecoveryIdx >= clientRecovery.length) return;

    clientTimerRef.current = setTimeout(() => {
      if (clientRecoveryIdx >= clientRecovery.length - 1) {
        const step = selectedScenario.steps[clientStepIdx];
        setClientCompleted(prev => [...prev, { ...step, recovered: true }]);
        setClientFailure(false);
        setClientRecovery([]);
        setClientRecoveryIdx(-1);
        setClientStepIdx(prev => prev + 1);
      } else {
        setClientRecoveryIdx(prev => prev + 1);
      }
    }, 1800);

    return () => clearTimeout(clientTimerRef.current);
  }, [clientFailure, clientRecoveryIdx, clientRecovery, workflowId]);

  const handlePause = async () => {
    if (workflowId) {
      await pauseWorkflow(workflowId);
    }
    setIsRunning(false);
  };

  const handleResume = async () => {
    if (workflowId) {
      await resumeWorkflow(workflowId);
    }
    setIsRunning(true);
  };

  // Determine display state: prefer backend workflow, fallback to client state
  const useBackend = !!workflowId && !!workflow;

  const displaySteps = useBackend
    ? workflow.steps.map(s => ({
        id: s.id,
        name: s.name,
        agent: s.agent,
        status: s.status,
        reasoning: s.reasoning,
        confidence: s.confidence,
        alternatives: s.alternatives || [],
        duration: s.duration_ms || 2500,
        canFail: s.can_fail,
        failureScenario: s.failure_scenario,
      }))
    : selectedScenario?.steps || [];

  const completedSteps = useBackend
    ? workflow.steps.filter(s => s.status === 'completed' || s.status === 'self-corrected')
    : clientCompleted;

  const currentStepIdx = useBackend
    ? workflow.current_step_idx
    : clientStepIdx;

  const progress = useBackend
    ? workflow.progress
    : selectedScenario ? Math.round((clientCompleted.length / selectedScenario.steps.length) * 100) : 0;

  const isComplete = useBackend
    ? workflow.status === 'completed'
    : selectedScenario && clientCompleted.length === selectedScenario.steps.length;

  const selfCorrections = useBackend
    ? workflow.self_corrections
    : clientCompleted.filter(s => s.recovered).length;

  const isRecoveringBackend = failureInfo !== null;
  const isRecoveringClient = !workflowId && clientFailure;
  const activeFailure = isRecoveringBackend || isRecoveringClient;

  const activeRecoverySteps = isRecoveringBackend
    ? recoverySteps.map(e => ({ action: e.message?.replace(/^Recovery \d+\/\d+: /, '') || e.message, agent: e.metadata?.recovery_agent || e.agent }))
    : clientRecovery;

  const activeRecoveryIdx = isRecoveringBackend ? recoveryIdx : clientRecoveryIdx;
  const failureDetection = isRecoveringBackend
    ? failureInfo?.metadata?.detection || failureInfo?.message
    : clientFailure && selectedScenario?.steps[clientStepIdx]?.failureScenario?.detection;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-light text-white">Workflow <span className="font-bold text-cyan-400">Simulator</span></h1>
        <div className="flex items-center gap-3">
          {useBackend && (
            <span className="px-3 py-1.5 bg-green-500/10 text-green-400 text-xs font-mono rounded-lg border border-green-500/20">
              LIVE BACKEND
            </span>
          )}
          <button
            onClick={() => setChaosMode(!chaosMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              chaosMode
                ? 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:border-red-500/30 hover:text-red-400'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            {chaosMode ? 'Chaos Mode ON' : 'Chaos Mode'}
          </button>
        </div>
      </div>

      {/* Scenario Selection */}
      {!selectedScenario && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {scenarios.map(sc => (
            <button
              key={sc.id}
              onClick={() => startSimulation(sc)}
              className="glass-panel p-6 rounded-2xl text-left hover:border-cyan-500/30 transition-all group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                  <Play className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">{sc.name}</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-4">{sc.description}</p>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Clock className="h-3 w-3" />
                <span>{sc.steps.length} autonomous steps</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Running Simulation */}
      {selectedScenario && (
        <div>
          {/* Header with controls */}
          <div className="glass-panel p-6 rounded-2xl mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-cyan-400 text-xs uppercase tracking-widest font-bold mb-1">{selectedScenario.name}</p>
                <p className="text-zinc-400 text-sm">{selectedScenario.description}</p>
              </div>
              <div className="flex gap-2">
                {isRunning && (
                  <button onClick={handlePause} className="p-2 bg-zinc-800 rounded-lg text-yellow-400 hover:bg-zinc-700">
                    <Pause className="h-4 w-4" />
                  </button>
                )}
                {!isRunning && !isComplete && currentStepIdx > 0 && (
                  <button onClick={handleResume} className="p-2 bg-zinc-800 rounded-lg text-green-400 hover:bg-zinc-700">
                    <Play className="h-4 w-4" />
                  </button>
                )}
                <button onClick={reset} className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:bg-zinc-700">
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button onClick={() => { reset(); setSelectedScenario(null); setClientStepIdx(-1); setClientCompleted([]); }} className="px-3 py-2 bg-zinc-800 rounded-lg text-zinc-400 hover:bg-zinc-700 text-xs">
                  Back
                </button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${isComplete ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-cyan-500 to-purple-500'}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-zinc-500">
              <span>{completedSteps.length} / {displaySteps.length} steps</span>
              <span className={isComplete ? 'text-green-400 font-bold' : ''}>{isComplete ? 'WORKFLOW COMPLETE' : `${progress}%`}</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative pl-8 space-y-4">
            <div className="timeline-stem"></div>
            {displaySteps.map((step, idx) => {
              const isStepCompleted = step.status === 'completed' || step.status === 'self-corrected';
              const isCurrent = idx === currentStepIdx;
              const isSelfCorrected = step.status === 'self-corrected';
              const isRecovering = isCurrent && activeFailure;

              return (
                <div key={step.id} className={`relative z-10 flex gap-4 transition-all duration-300 ${idx > currentStepIdx && !isStepCompleted ? 'opacity-30' : 'opacity-100'}`}>
                  {/* Node */}
                  <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center border-2 bg-black flex-shrink-0 ${
                    isRecovering ? 'border-red-500 text-red-500 animate-pulse' :
                    isSelfCorrected ? 'border-yellow-500 text-yellow-500' :
                    isStepCompleted ? 'border-cyan-500 text-cyan-500' :
                    isCurrent ? 'border-cyan-400 text-cyan-400' :
                    'border-zinc-700 text-zinc-700'
                  }`}>
                    {isRecovering ? <AlertTriangle className="h-4 w-4" /> :
                     isSelfCorrected ? <RefreshCw className="h-4 w-4" /> :
                     isStepCompleted ? <Check className="h-4 w-4" /> :
                     isCurrent ? <Loader className="h-4 w-4 animate-spin" /> :
                     <span className="h-2 w-2 rounded-full bg-zinc-700"></span>}
                  </div>

                  {/* Content */}
                  <div
                    className={`flex-1 p-4 rounded-xl border cursor-pointer transition-all ${
                      isRecovering ? 'bg-red-950/30 border-red-500/30' :
                      isCurrent ? 'bg-cyan-950/20 border-cyan-500/30' :
                      isStepCompleted ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600' :
                      'bg-zinc-900/20 border-zinc-800/50'
                    }`}
                    onClick={() => isStepCompleted && setSelectedStep(step)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-medium text-white">{step.name}</h4>
                      <span className="text-xs font-mono text-cyan-300">{step.agent}</span>
                    </div>

                    {isCurrent && !isRecovering && (
                      <p className="text-xs text-cyan-400 mt-2 flex items-center gap-1">
                        <Loader className="h-3 w-3 animate-spin" /> Processing...
                      </p>
                    )}

                    {isStepCompleted && !isRecovering && (
                      <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                        <ChevronRight className="h-3 w-3" /> Click for decision reasoning
                      </p>
                    )}

                    {/* Failure & Recovery Display */}
                    {isRecovering && (
                      <div className="mt-3 space-y-2">
                        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                          <p className="text-red-400 text-xs font-bold flex items-center gap-1 mb-1">
                            <AlertTriangle className="h-3 w-3" /> FAILURE DETECTED
                          </p>
                          <p className="text-red-200 text-xs">{failureDetection}</p>
                        </div>

                        {activeRecoverySteps.length > 0 && (
                          <div className="bg-yellow-500/5 border border-yellow-500/20 p-3 rounded-lg">
                            <p className="text-yellow-400 text-xs font-bold mb-2 flex items-center gap-1">
                              <RefreshCw className="h-3 w-3" /> SELF-CORRECTION IN PROGRESS
                            </p>
                            {activeRecoverySteps.map((r, ri) => (
                              <div key={ri} className={`flex items-start gap-2 text-xs py-1 transition-all duration-500 ${ri <= activeRecoveryIdx ? 'opacity-100' : 'opacity-20'}`}>
                                <span className={`mt-0.5 h-4 w-4 rounded-full flex items-center justify-center border flex-shrink-0 ${ri < activeRecoveryIdx ? 'border-green-500 text-green-500' : ri === activeRecoveryIdx ? 'border-yellow-400 text-yellow-400' : 'border-zinc-700 text-zinc-700'}`}>
                                  {ri < activeRecoveryIdx ? <Check className="h-2.5 w-2.5" /> : ri === activeRecoveryIdx ? <Loader className="h-2.5 w-2.5 animate-spin" /> : <span className="h-1 w-1 rounded-full bg-zinc-700"></span>}
                                </span>
                                <div>
                                  <span className="text-zinc-300">{r.action}</span>
                                  <span className="text-cyan-500 font-mono ml-2">-- {r.agent}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Completion Banner */}
          {isComplete && (
            <div className="mt-8 glass-panel p-6 rounded-2xl border-green-500/20 bg-green-950/10 text-center animate-fade-in">
              <div className="text-green-400 text-4xl mb-2">&#10003;</div>
              <h3 className="text-xl font-bold text-white mb-1">Workflow Completed Autonomously</h3>
              <p className="text-zinc-400 text-sm">
                {completedSteps.length} steps executed | {selfCorrections} self-corrections |
                0 human interventions required
              </p>
            </div>
          )}
        </div>
      )}

      {/* Decision Panel */}
      {selectedStep && (
        <DecisionPanel step={selectedStep} onClose={() => setSelectedStep(null)} />
      )}
    </div>
  );
}
