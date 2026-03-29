export const mockData = {
    systemMetrics: {
        activeWorkflows: 142,
        tasksAutomated: 15430,
        humanEscalations: 12,
        selfCorrections: 843,
        uptime: '99.99%',
        autonomyRate: '99.92%'
    },
    agents: [
        {
            id: 'ag-orchestrator',
            name: 'Nexus Orchestrator',
            role: 'Workflow Manager',
            status: 'active',
            successRate: 99.8,
            currentTask: 'Routing Procurement Approval #4492',
            avatar: 'Cpu'
        },
        {
            id: 'ag-intel',
            name: 'MeetIntel Core',
            role: 'Meeting Intelligence',
            status: 'processing',
            successRate: 98.5,
            currentTask: 'Extracting Action Items from Q3 Sync',
            avatar: 'BrainCircuit'
        },
        {
            id: 'ag-retrieval',
            name: 'Data Fetcher v4',
            role: 'Context Retrieval',
            status: 'idle',
            successRate: 99.9,
            currentTask: 'Awaiting next query',
            avatar: 'Database'
        },
        {
            id: 'ag-executor',
            name: 'Action Exec Alpha',
            role: 'Execution Engine',
            status: 'active',
            successRate: 97.4,
            currentTask: 'Updating Salesforce Records',
            avatar: 'Zap'
        },
        {
            id: 'ag-verifier',
            name: 'Shield Verifier',
            role: 'Quality Assurance',
            status: 'self-correcting',
            successRate: 99.1,
            currentTask: 'Re-validating missing invoice signatures',
            avatar: 'ShieldCheck'
        }
    ],
    workflows: [
        {
            id: 'wf-901',
            type: 'Procure-to-Pay',
            name: 'Acme Corp Software License',
            status: 'in-progress',
            health: 100,
            progress: 75,
            steps: [
                { id: 1, name: 'Request Received', agent: 'System', status: 'completed', time: '10:00 AM' },
                { id: 2, name: 'Vendor Verification', agent: 'Data Fetcher v4', status: 'completed', time: '10:02 AM' },
                { id: 3, name: 'Compliance Check', agent: 'Shield Verifier', status: 'self-corrected', detail: 'Missing W-9. Automatically generated request to vendor.', time: '10:05 AM' },
                { id: 4, name: 'Manager Approval', agent: 'Nexus Orchestrator', status: 'in-progress', detail: 'Sent slack ping to VP of Engineering', time: '10:15 AM' },
                { id: 5, name: 'Payment Execution', agent: 'Action Exec Alpha', status: 'pending', time: '-' }
            ]
        },
        {
            id: 'wf-902',
            type: 'Employee Onboarding',
            name: 'Sarah Connor (Engineering)',
            status: 'completed',
            health: 100,
            progress: 100,
            steps: [
                { id: 1, name: 'Offer Accepted', agent: 'System', status: 'completed', time: 'Yesterday' },
                { id: 2, name: 'Accounts Provisioning', agent: 'Action Exec Alpha', status: 'completed', time: '09:00 AM' },
                { id: 3, name: 'Welcome Email Sent', agent: 'System', status: 'completed', time: '09:05 AM' },
                { id: 4, name: 'Hardware Procurement', agent: 'Nexus Orchestrator', status: 'completed', detail: 'Assigned to IT queue', time: '09:10 AM' }
            ]
        },
        {
            id: 'wf-903',
            type: 'Contract Lifecycle',
            name: 'Globex Enterprise Renewal',
            status: 'warning',
            health: 65,
            progress: 40,
            steps: [
                { id: 1, name: 'Draft Generation', agent: 'Action Exec Alpha', status: 'completed', time: '08:00 AM' },
                { id: 2, name: 'Redlining Analysis', agent: 'MeetIntel Core', status: 'completed', time: '08:45 AM' },
                { id: 3, name: 'Legal Review', agent: 'Human (Legal)', status: 'escalated', detail: 'SLA Risk: Stalled for 48h. Agent escalated.', time: 'System Warning' }
            ]
        }
    ],
    auditLogs: [
        { id: 'log-001', time: '10:15:32', type: 'info', agent: 'Nexus Orchestrator', message: 'Initiated Procure-to-Pay workflow for Acme Corp.' },
        { id: 'log-002', time: '10:16:01', type: 'event', agent: 'Data Fetcher v4', message: 'Successfully retrieved vendor profile from NetSuite.' },
        { id: 'log-003', time: '10:16:45', type: 'warning', agent: 'Shield Verifier', message: 'Signature missing on W-9 doc. Initiated self-correction module.' },
        { id: 'log-004', time: '10:17:10', type: 'action', agent: 'Action Exec Alpha', message: 'Drafted and sent missing signature request email to vendor.' },
        { id: 'log-005', time: '10:25:00', type: 'escalation', agent: 'Nexus Orchestrator', message: 'Globex Contract stalled. SLA breach predicted in 2 hrs. Escalated to Legal Lead.' }
    ]
};
