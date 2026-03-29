/**
 * NexusCore API client.
 *
 * Centralises all backend communication so every component
 * imports from one place.  Falls back gracefully if the
 * backend is unreachable (returns null / empty arrays).
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const WS_BASE  = import.meta.env.VITE_WS_URL  || 'ws://localhost:8000';

// ---------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------

async function get(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function post(path, body = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function put(path, body = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------
// Dashboard / Metrics
// ---------------------------------------------------------------

export const fetchMetrics       = ()  => get('/dashboard/metrics');
export const fetchAgentStatuses = ()  => get('/dashboard/agents');

// ---------------------------------------------------------------
// Workflows
// ---------------------------------------------------------------

export const fetchScenarios     = ()  => get('/workflows/scenarios');
export const fetchWorkflows     = ()  => get('/workflows');
export const fetchWorkflow      = (id) => get(`/workflows/${id}`);

export const startSimulation = (scenarioId, chaosMode = false, stepDurationMs = 2500) =>
  post('/workflows/simulate', {
    scenario_id: scenarioId,
    chaos_mode: chaosMode,
    step_duration_ms: stepDurationMs,
  });

export const pauseWorkflow  = (id) => post(`/workflows/${id}/pause`);
export const resumeWorkflow = (id) => post(`/workflows/${id}/resume`);

// ---------------------------------------------------------------
// SLA
// ---------------------------------------------------------------

export const fetchSLAStatuses = () => get('/sla/statuses');

// ---------------------------------------------------------------
// Collaboration graph
// ---------------------------------------------------------------

export const fetchCollabGraph = (workflowId) =>
  get(`/agents/collab-graph${workflowId ? `?workflow_id=${workflowId}` : ''}`);

// ---------------------------------------------------------------
// Chat
// ---------------------------------------------------------------

export const sendChatMessage = (message, agent = null) =>
  post('/chat', { message, agent });

export const fetchChatHistory = (limit = 50) =>
  get(`/chat/history?limit=${limit}`);

// ---------------------------------------------------------------
// Audit
// ---------------------------------------------------------------

export const fetchGlobalAudit = (limit = 100) =>
  get(`/audit?limit=${limit}`);

// ---------------------------------------------------------------
// Users / RBAC
// ---------------------------------------------------------------

export const fetchUsers = () => get('/users');
export const updateUserRole = (userId, role) =>
  put(`/users/${userId}/role`, { role });

// ---------------------------------------------------------------
// WebSocket
// ---------------------------------------------------------------

/**
 * Open a global WebSocket connection.
 * Returns the WebSocket instance.
 *
 *   const ws = connectWebSocket(event => console.log(event));
 *   // later: ws.close();
 */
export function connectWebSocket(onMessage) {
  let ws;
  let reconnectTimer = null;

  function connect() {
    ws = new WebSocket(`${WS_BASE}/ws`);
    ws.onmessage = (evt) => {
      try { onMessage(JSON.parse(evt.data)); } catch { /* skip */ }
    };
    ws.onclose = () => {
      // Auto-reconnect after 2s
      reconnectTimer = setTimeout(connect, 2000);
    };
    ws.onerror = () => ws.close();
  }

  connect();

  // Return a handle with a clean close()
  return {
    close() {
      clearTimeout(reconnectTimer);
      ws?.close();
    },
    get readyState() { return ws?.readyState; },
  };
}
