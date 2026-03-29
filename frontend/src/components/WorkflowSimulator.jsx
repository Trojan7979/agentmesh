import React, { useState, useEffect, useRef } from 'react';
import { scenarios } from '../mockScenarios';
import { DecisionPanel } from './DecisionPanel';
import {
  Play, Pause, RotateCcw, AlertTriangle, Check, RefreshCw,
  Loader, ChevronRight, Zap, ShieldAlert, Clock
} from 'lucide-react';

export function WorkflowSimulator() {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [failureActive, setFailureActive] = useState(false);
  const [recoverySteps, setRecoverySteps] = useState([]);
  const [recoveryIdx, setRecoveryIdx] = useState(-1);
  const [selectedStep, setSelectedStep] = useState(null);
  const [chaosMode, setChaosMode] = useState(false);
  const timerRef = useRef(null);

  const reset = () => {
    setIsRunning(false);
    setCurrentStepIdx(-1);
    setCompletedSteps([]);
    setFailureActive(false);
    setRecoverySteps([]);
    setRecoveryIdx(-1);
    setSelectedStep(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const startSimulation = (scenario) => {
    setSelectedScenario(scenario);
    reset();
    setIsRunning(true);
    setCurrentStepIdx(0);
  };

  // Step progression engine
  useEffect(() => {
    if (!isRunning || !selectedScenario || currentStepIdx < 0) return;

    const steps = selectedScenario.steps;
    if (currentStepIdx >= steps.length) {
      setIsRunning(false);
      return;
    }

    const step = steps[currentStepIdx];

    // Check for failure injection
    if (chaosMode && step.canFail && !failureActive && !completedSteps.find(s => s.id === step.id && s.recovered)) {
      timerRef.current = setTimeout(() => {
        setFailureActive(true);
        setRecoverySteps(step.failureScenario.recovery);
        setRecoveryIdx(0);
      }, step.duration / 2);
      return;
    }

    timerRef.current = setTimeout(() => {
      setCompletedSteps(prev => [...prev, { ...step, recovered: false }]);
      setCurrentStepIdx(prev => prev + 1);
    }, step.duration);

    return () => clearTimeout(timerRef.current);
  }, [isRunning, currentStepIdx, selectedScenario, chaosMode, failureActive]);

  // Recovery progression
  useEffect(() => {
    if (!failureActive || recoveryIdx < 0 || recoveryIdx >= recoverySteps.length) return;

    timerRef.current = setTimeout(() => {
      if (recoveryIdx >= recoverySteps.length - 1) {
        // Recovery complete, mark step as recovered & continue
        const step = selectedScenario.steps[currentStepIdx];
        setCompletedSteps(prev => [...prev, { ...step, recovered: true }]);
        setFailureActive(false);
        setRecoverySteps([]);
        setRecoveryIdx(-1);
        setCurrentStepIdx(prev => prev + 1);
      } else {
        setRecoveryIdx(prev => prev + 1);
      }
    }, 1800);

    return () => clearTimeout(timerRef.current);
  }, [failureActive, recoveryIdx, recoverySteps]);

  const progress = selectedScenario
    ? Math.round((completedSteps.length / selectedScenario.steps.length) * 100)
    : 0;

  const isComplete = selectedScenario && completedSteps.length === selectedScenario.steps.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-light text-white">Workflow <span className="font-bold text-cyan-400">Simulator</span></h1>
        <button
          onClick={() => setChaosMode(!chaosMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
            chaosMode
              ? 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
              : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:border-red-500/30 hover:text-red-400'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          {chaosMode ? '⚡ Chaos Mode ON' : 'Chaos Mode'}
        </button>
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
                  <button onClick={() => setIsRunning(false)} className="p-2 bg-zinc-800 rounded-lg text-yellow-400 hover:bg-zinc-700">
                    <Pause className="h-4 w-4" />
                  </button>
                )}
                {!isRunning && !isComplete && currentStepIdx > 0 && (
                  <button onClick={() => setIsRunning(true)} className="p-2 bg-zinc-800 rounded-lg text-green-400 hover:bg-zinc-700">
                    <Play className="h-4 w-4" />
                  </button>
                )}
                <button onClick={reset} className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:bg-zinc-700">
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button onClick={() => { reset(); setSelectedScenario(null); }} className="px-3 py-2 bg-zinc-800 rounded-lg text-zinc-400 hover:bg-zinc-700 text-xs">
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
              <span>{completedSteps.length} / {selectedScenario.steps.length} steps</span>
              <span className={isComplete ? 'text-green-400 font-bold' : ''}>{isComplete ? '✓ WORKFLOW COMPLETE' : `${progress}%`}</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative pl-8 space-y-4">
            <div className="timeline-stem"></div>
            {selectedScenario.steps.map((step, idx) => {
              const isCompleted = completedSteps.find(s => s.id === step.id);
              const isCurrent = idx === currentStepIdx;
              const isRecovering = isCurrent && failureActive;

              return (
                <div key={step.id} className={`relative z-10 flex gap-4 transition-all duration-300 ${idx > currentStepIdx && !isCompleted ? 'opacity-30' : 'opacity-100'}`}>
                  {/* Node */}
                  <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center border-2 bg-black flex-shrink-0 ${
                    isRecovering ? 'border-red-500 text-red-500 animate-pulse' :
                    isCompleted?.recovered ? 'border-yellow-500 text-yellow-500' :
                    isCompleted ? 'border-cyan-500 text-cyan-500' :
                    isCurrent ? 'border-cyan-400 text-cyan-400' :
                    'border-zinc-700 text-zinc-700'
                  }`}>
                    {isRecovering ? <AlertTriangle className="h-4 w-4" /> :
                     isCompleted?.recovered ? <RefreshCw className="h-4 w-4" /> :
                     isCompleted ? <Check className="h-4 w-4" /> :
                     isCurrent ? <Loader className="h-4 w-4 animate-spin" /> :
                     <span className="h-2 w-2 rounded-full bg-zinc-700"></span>}
                  </div>

                  {/* Content */}
                  <div
                    className={`flex-1 p-4 rounded-xl border cursor-pointer transition-all ${
                      isRecovering ? 'bg-red-950/30 border-red-500/30' :
                      isCurrent ? 'bg-cyan-950/20 border-cyan-500/30' :
                      isCompleted ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600' :
                      'bg-zinc-900/20 border-zinc-800/50'
                    }`}
                    onClick={() => isCompleted && setSelectedStep(step)}
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

                    {isCompleted && !isRecovering && (
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
                          <p className="text-red-200 text-xs">{step.failureScenario.detection}</p>
                        </div>

                        <div className="bg-yellow-500/5 border border-yellow-500/20 p-3 rounded-lg">
                          <p className="text-yellow-400 text-xs font-bold mb-2 flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" /> SELF-CORRECTION IN PROGRESS
                          </p>
                          {step.failureScenario.recovery.map((r, ri) => (
                            <div key={ri} className={`flex items-start gap-2 text-xs py-1 transition-all duration-500 ${ri <= recoveryIdx ? 'opacity-100' : 'opacity-20'}`}>
                              <span className={`mt-0.5 h-4 w-4 rounded-full flex items-center justify-center border flex-shrink-0 ${ri < recoveryIdx ? 'border-green-500 text-green-500' : ri === recoveryIdx ? 'border-yellow-400 text-yellow-400' : 'border-zinc-700 text-zinc-700'}`}>
                                {ri < recoveryIdx ? <Check className="h-2.5 w-2.5" /> : ri === recoveryIdx ? <Loader className="h-2.5 w-2.5 animate-spin" /> : <span className="h-1 w-1 rounded-full bg-zinc-700"></span>}
                              </span>
                              <div>
                                <span className="text-zinc-300">{r.action}</span>
                                <span className="text-cyan-500 font-mono ml-2">— {r.agent}</span>
                              </div>
                            </div>
                          ))}
                        </div>
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
              <div className="text-green-400 text-4xl mb-2">✓</div>
              <h3 className="text-xl font-bold text-white mb-1">Workflow Completed Autonomously</h3>
              <p className="text-zinc-400 text-sm">
                {completedSteps.length} steps executed | {completedSteps.filter(s => s.recovered).length} self-corrections |
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
