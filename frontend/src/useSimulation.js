import { useState, useEffect, useCallback, useRef } from 'react';
import { mockData as fallbackData } from './mockData';
import {
  fetchMetrics,
  fetchAgentStatuses,
  fetchWorkflows,
  fetchGlobalAudit,
  connectWebSocket,
} from './api';

/**
 * useSimulation — hybrid data hook.
 *
 * 1. Tries to fetch live data from the backend every 3s.
 * 2. Listens on a global WebSocket for real-time events
 *    (workflow steps, audit logs, etc.).
 * 3. Falls back to the original mock data if the backend
 *    is unreachable.
 */
export function useSimulation() {
  const [data, setData] = useState(fallbackData);
  const [backendOnline, setBackendOnline] = useState(false);
  const wsRef = useRef(null);

  // ---- Poll backend for dashboard data ----------------------------
  const poll = useCallback(async () => {
    const [metrics, agents, workflows, audit] = await Promise.all([
      fetchMetrics(),
      fetchAgentStatuses(),
      fetchWorkflows(),
      fetchGlobalAudit(50),
    ]);

    // If any call returned data the backend is alive
    if (metrics || agents) {
      setBackendOnline(true);

      setData(prev => ({
        ...prev,
        systemMetrics: metrics ? {
          activeWorkflows: metrics.active_workflows ?? prev.systemMetrics.activeWorkflows,
          tasksAutomated: metrics.tasks_automated ?? prev.systemMetrics.tasksAutomated,
          humanEscalations: metrics.human_escalations ?? prev.systemMetrics.humanEscalations,
          selfCorrections: metrics.self_corrections ?? prev.systemMetrics.selfCorrections,
          uptime: metrics.uptime ?? prev.systemMetrics.uptime,
          autonomyRate: metrics.autonomy_rate ?? prev.systemMetrics.autonomyRate,
        } : prev.systemMetrics,

        agents: agents ? agents.map(a => ({
          id: a.id,
          name: a.name,
          role: a.role,
          status: a.status,
          successRate: a.success_rate,
          currentTask: a.current_task,
          avatar: a.avatar,
        })) : prev.agents,

        workflows: workflows && workflows.length > 0 ? workflows.map(wf => ({
          id: wf.id,
          type: wf.type,
          name: wf.name,
          status: wf.status === 'running' ? 'in-progress' : wf.status,
          health: wf.health,
          progress: wf.progress,
          steps: wf.steps.map(s => ({
            id: s.id,
            name: s.name,
            agent: s.agent,
            status: s.status,
            time: s.time || '-',
            detail: s.detail || null,
          })),
        })) : prev.workflows,

        auditLogs: audit && audit.length > 0 ? audit.map(a => {
          const ts = new Date(a.timestamp);
          return {
            id: a.id,
            time: `${ts.getHours().toString().padStart(2,'0')}:${ts.getMinutes().toString().padStart(2,'0')}:${ts.getSeconds().toString().padStart(2,'0')}`,
            type: a.event.includes('FAILURE') ? 'warning' :
                  a.event.includes('ESCALAT') ? 'escalation' :
                  a.event.includes('STEP') ? 'action' : 'info',
            agent: a.agent.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            message: a.payload?.message || a.event,
          };
        }) : prev.auditLogs,
      }));
    }
  }, []);

  // Polling interval
  useEffect(() => {
    poll();                             // initial fetch
    const id = setInterval(poll, 3000); // every 3s
    return () => clearInterval(id);
  }, [poll]);

  // ---- WebSocket for live events ----------------------------------
  useEffect(() => {
    const ws = connectWebSocket((event) => {
      // Push new event into audit logs
      const ts = new Date(event.timestamp || Date.now());
      const timeStr = `${ts.getHours().toString().padStart(2,'0')}:${ts.getMinutes().toString().padStart(2,'0')}:${ts.getSeconds().toString().padStart(2,'0')}`;

      const newLog = {
        id: event.id || `ws-${Date.now()}`,
        time: timeStr,
        type: event.type?.includes('FAILURE') ? 'warning' :
              event.type?.includes('ESCALAT') ? 'escalation' :
              event.type?.includes('STEP') ? 'action' : 'event',
        agent: (event.agent || 'system').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        message: event.message || event.type,
      };

      setData(prev => ({
        ...prev,
        auditLogs: [newLog, ...prev.auditLogs].slice(0, 50),
      }));

      // Trigger an immediate data refresh on major events
      if (event.type?.includes('WORKFLOW_STEP') || event.type?.includes('WORKFLOW_COMPLETED')) {
        poll();
      }
    });

    wsRef.current = ws;
    return () => ws.close();
  }, [poll]);

  return data;
}
