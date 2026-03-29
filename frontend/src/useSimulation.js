import { useState, useEffect } from 'react';
import { mockData as initialData } from './mockData';

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const sampleTasks = [
  "Parsing incoming procurement request",
  "Validating SOC2 compliance certificates",
  "Extracting decisions from Zoom transcript",
  "Drafting vendor clarification email",
  "Routing approval to Finance Director",
  "Updating Salesforce Opportunity Stage",
  "Awaiting API response from Workday",
  "Self-correcting missing OCR field"
];

const sampleLogs = [
  { type: 'info', agent: 'System Engine', message: 'Scaling up worker nodes to handle queue spike.' },
  { type: 'event', agent: 'MeetIntel Core', message: 'Successfully generated action items for Engineering sync.' },
  { type: 'action', agent: 'Action Exec Alpha', message: 'Executed database update for 14 employee records.' },
  { type: 'warning', agent: 'Shield Verifier', message: 'Detected anomaly in invoice amount. Flagging for review.' },
  { type: 'escalation', agent: 'Nexus Orchestrator', message: 'Human approval required: Vendor exceeds budget threshold.' }
];

export function useSimulation() {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => {
        const newData = { ...prevData };
        
        // 1. Increment Metrics
        newData.systemMetrics = {
          ...prevData.systemMetrics,
          tasksAutomated: prevData.systemMetrics.tasksAutomated + randomInt(1, 4)
        };

        // 2. Simulate Agent Activity
        newData.agents = prevData.agents.map(agent => {
          // 20% chance an agent changes state
          if (Math.random() < 0.2) {
            const statuses = ['idle', 'active', 'processing', 'self-correcting'];
            const newStatus = statuses[randomInt(0, statuses.length - 1)];
            return {
              ...agent,
              status: newStatus,
              currentTask: newStatus === 'idle' ? 'Awaiting next query' : sampleTasks[randomInt(0, sampleTasks.length - 1)]
            };
          }
          return agent;
        });

        // 3. Advance Workflows
        newData.workflows = prevData.workflows.map(wf => {
          if (wf.status === 'in-progress' || wf.status === 'warning') {
            // 30% chance to progress
            if (Math.random() < 0.3) {
              const boost = randomInt(5, 15);
              const newProgress = Math.min(wf.progress + boost, 100);
              
              const update = { ...wf, progress: newProgress };
              if (newProgress === 100) {
                update.status = 'completed';
                update.health = 100;
              } else if (newProgress > 60 && newProgress < 80) {
                // Occasionally dip health
                update.health = randomInt(70, 95);
              }
              return update;
            }
          }
          return wf;
        });

        // 4. Add Audit Logs Occasionally
        if (Math.random() < 0.15) {
            const newLogProto = sampleLogs[randomInt(0, sampleLogs.length - 1)];
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            
            const newLog = {
                id: `log-sim-${Date.now()}`,
                time: timeStr,
                type: newLogProto.type,
                agent: newLogProto.agent,
                message: newLogProto.message
            };
            
            newData.auditLogs = [newLog, ...prevData.auditLogs].slice(0, 50); // Keep last 50
        }

        return newData;
      });
    }, 2500); // 2.5 seconds tick

    return () => clearInterval(interval);
  }, []);

  return data;
}
