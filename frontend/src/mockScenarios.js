// Full scripted scenarios for the live workflow simulator
export const scenarios = [
  {
    id: 'sc-p2p',
    name: 'Procure-to-Pay',
    description: 'End-to-end procurement of cloud infrastructure licenses from a new vendor.',
    steps: [
      {
        id: 1, name: 'Purchase Request Submitted', agent: 'System',
        reasoning: 'PR-4492 received from Engineering Lead via Slack integration. Auto-parsed vendor name, amount ($48,000), and urgency level (High).',
        confidence: 98.1, duration: 2000,
        alternatives: ['Manual form entry (rejected: Slack source validated)']
      },
      {
        id: 2, name: 'Vendor Lookup & Validation', agent: 'Data Fetcher v4',
        reasoning: 'Queried vendor database for "Acme Cloud Inc." → Found existing profile (ID: V-2291). Cross-referenced with Dun & Bradstreet: DUNS verified, no sanctions flags.',
        confidence: 99.4, duration: 2500,
        alternatives: ['Flag for manual vendor review (rejected: all checks passed automatically)']
      },
      {
        id: 3, name: 'Budget Availability Check', agent: 'Data Fetcher v4',
        reasoning: 'Checked Q3 Engineering budget: $250,000 allocated, $187,400 spent, $62,600 remaining. Request amount ($48,000) fits within threshold. No override needed.',
        confidence: 99.8, duration: 2000,
        alternatives: ['Escalate to CFO for budget exception (rejected: within limits)']
      },
      {
        id: 4, name: 'Compliance & Risk Assessment', agent: 'Shield Verifier',
        reasoning: 'Ran SOC2 Type II certificate check → Valid until Dec 2026. GDPR DPA on file → Verified. Vendor risk score: 12/100 (Low). Auto-approved for processing.',
        confidence: 96.7, duration: 3000,
        alternatives: ['Request updated SOC2 cert (rejected: current cert valid)', 'Flag for legal review (rejected: risk score below threshold)'],
        canFail: true,
        failureScenario: {
          name: 'SOC2 Certificate Expired',
          detection: 'Shield Verifier detected SOC2 Type II certificate expired 3 days ago.',
          recovery: [
            { action: 'Paused workflow and logged compliance gap', agent: 'Shield Verifier' },
            { action: 'Auto-generated certificate renewal request email to vendor', agent: 'Action Exec Alpha' },
            { action: 'Set 48-hour SLA timer for vendor response', agent: 'Nexus Orchestrator' },
            { action: 'Received updated certificate via vendor portal API', agent: 'Data Fetcher v4' },
            { action: 'Re-validated new certificate — SOC2 Type II valid until March 2027', agent: 'Shield Verifier' },
            { action: 'Resumed workflow with full compliance. Total delay: 4 minutes.', agent: 'Nexus Orchestrator' }
          ]
        }
      },
      {
        id: 5, name: 'Routing to Approval Chain', agent: 'Nexus Orchestrator',
        reasoning: 'Amount $48,000 > $25,000 threshold → requires VP approval. Identified approver: VP of Engineering (Sarah Chen). Sent Slack notification + email with one-click approve link.',
        confidence: 99.2, duration: 2000,
        alternatives: ['Route to Director level (rejected: amount below Director threshold of $100K)']
      },
      {
        id: 6, name: 'Manager Approval Received', agent: 'Nexus Orchestrator',
        reasoning: 'VP Sarah Chen clicked "Approve" via Slack at 10:24 AM. Digital signature captured. Approval logged with IP and device fingerprint.',
        confidence: 100, duration: 3500,
        alternatives: []
      },
      {
        id: 7, name: 'Purchase Order Generation', agent: 'Action Exec Alpha',
        reasoning: 'Generated PO-2026-4492 with all validated fields. Attached: vendor profile, compliance certificate, budget approval, manager signature. Sent to vendor via API.',
        confidence: 99.5, duration: 2000,
        alternatives: ['Generate manual PO PDF (rejected: vendor supports API integration)']
      },
      {
        id: 8, name: 'Payment Scheduled & Workflow Closed', agent: 'Action Exec Alpha',
        reasoning: 'Scheduled payment for Net-30 terms via ERP system. Three-way match verified (PO, Receipt, Invoice). Workflow marked COMPLETE. Total autonomous steps: 8/8.',
        confidence: 99.9, duration: 2000,
        alternatives: []
      }
    ]
  },
  {
    id: 'sc-onboard',
    name: 'Employee Onboarding',
    description: 'Fully automated new hire onboarding for an Engineering team member.',
    steps: [
      {
        id: 1, name: 'Offer Acceptance Detected', agent: 'System',
        reasoning: 'DocuSign webhook received: Sarah Connor signed offer letter for Senior Engineer role. Start date: April 15. Triggering onboarding workflow.',
        confidence: 100, duration: 1500,
        alternatives: []
      },
      {
        id: 2, name: 'Identity & Background Verification', agent: 'Data Fetcher v4',
        reasoning: 'Submitted background check via Checkr API. Results returned in 12 minutes: Clear on all counts (criminal, education, employment history). Identity verified via government ID scan.',
        confidence: 97.3, duration: 3000,
        alternatives: ['Manual HR review (rejected: all automated checks passed)']
      },
      {
        id: 3, name: 'IT Account Provisioning', agent: 'Action Exec Alpha',
        reasoning: 'Created accounts: Google Workspace (sarah.connor@company.com), Slack, GitHub (added to engineering-team org), Jira, AWS IAM (ReadOnly role). MFA enrollment email sent.',
        confidence: 99.1, duration: 2500,
        alternatives: ['Queue for IT team manual setup (rejected: all systems support API provisioning)'],
        canFail: true,
        failureScenario: {
          name: 'GitHub Org Seat Limit Reached',
          detection: 'Action Exec Alpha received 402 error: "Organization seat limit reached" from GitHub API.',
          recovery: [
            { action: 'Logged API error and paused GitHub provisioning step', agent: 'Action Exec Alpha' },
            { action: 'Retrieved current GitHub org seat usage: 50/50 seats consumed', agent: 'Data Fetcher v4' },
            { action: 'Identified 3 inactive users (no activity in 90+ days)', agent: 'Shield Verifier' },
            { action: 'Auto-deactivated most inactive user (last active 147 days ago) per IT policy', agent: 'Action Exec Alpha' },
            { action: 'Retried GitHub provisioning — Success. sarah.connor added to engineering-team.', agent: 'Action Exec Alpha' },
            { action: 'Resumed workflow. Total delay: 45 seconds.', agent: 'Nexus Orchestrator' }
          ]
        }
      },
      {
        id: 4, name: 'Hardware & Equipment Request', agent: 'Nexus Orchestrator',
        reasoning: 'Role "Senior Engineer" maps to equipment bundle: MacBook Pro 16", 2x monitors, standing desk. Created IT ticket #IT-8834. Estimated delivery: April 10 (before start date).',
        confidence: 98.6, duration: 2000,
        alternatives: ['Standard equipment bundle (rejected: Senior role qualifies for premium bundle)']
      },
      {
        id: 5, name: 'Team & Manager Notification', agent: 'Action Exec Alpha',
        reasoning: 'Notified hiring manager (James Rodriguez) via Slack DM. Sent team announcement to #engineering channel. Calendar invite created for Day 1 orientation.',
        confidence: 99.8, duration: 2000,
        alternatives: ['Email-only notification (rejected: team prefers Slack for real-time updates)']
      },
      {
        id: 6, name: 'Onboarding Checklist & Workflow Complete', agent: 'Shield Verifier',
        reasoning: 'Final verification: All 5 systems provisioned ✓, Equipment ordered ✓, Manager notified ✓, Day 1 calendar set ✓. Onboarding score: 100%. Workflow closed.',
        confidence: 100, duration: 2000,
        alternatives: []
      }
    ]
  },
  {
    id: 'sc-contract',
    name: 'Contract Lifecycle',
    description: 'Automated contract renewal negotiation and execution for an enterprise client.',
    steps: [
      {
        id: 1, name: 'Renewal Trigger (90-day notice)', agent: 'Nexus Orchestrator',
        reasoning: 'Contract CON-2024-0891 with Globex Corp expires in 90 days. Auto-triggered renewal workflow per policy. Current contract value: $1.2M/year.',
        confidence: 100, duration: 2000,
        alternatives: []
      },
      {
        id: 2, name: 'Usage & Satisfaction Analysis', agent: 'Data Fetcher v4',
        reasoning: 'Pulled 12-month usage data: 94% platform utilization, 4 support tickets (all resolved < 4h), NPS score 72. Renewal probability: HIGH. Recommended: offer 5% volume discount to secure 3-year term.',
        confidence: 93.8, duration: 3000,
        alternatives: ['No discount (rejected: 3-year lock-in value exceeds discount cost)', 'Offer 10% discount (rejected: unnecessary based on high satisfaction)']
      },
      {
        id: 3, name: 'Draft Contract Generation', agent: 'Action Exec Alpha',
        reasoning: 'Generated renewal contract from template T-ENT-RENEWAL-v3. Applied: 5% volume discount, 3-year term, updated SLA terms (99.95% uptime), new data residency clause per EU requirements.',
        confidence: 97.2, duration: 2500,
        alternatives: ['Use previous contract as-is (rejected: regulatory changes require updated clauses)']
      },
      {
        id: 4, name: 'Legal & Compliance Review', agent: 'Shield Verifier',
        reasoning: 'Automated clause analysis: 42 clauses reviewed. 40 standard (auto-approved). 2 flagged for review: Liability cap updated to match new contract value, Indemnification clause aligned with current policy. Both auto-resolved.',
        confidence: 95.4, duration: 3500,
        alternatives: ['Escalate all clauses to legal team (rejected: 95% of clauses are standard and pre-approved)'],
        canFail: true,
        failureScenario: {
          name: 'Non-standard Indemnification Clause Detected',
          detection: 'Shield Verifier flagged: Client\'s counter-proposal includes unlimited indemnification — violates company policy (max 2x contract value).',
          recovery: [
            { action: 'Flagged clause as non-compliant and paused auto-approval', agent: 'Shield Verifier' },
            { action: 'Retrieved company indemnification policy: Maximum liability = 2x annual contract value', agent: 'Data Fetcher v4' },
            { action: 'Generated counter-proposal with capped indemnification at $2.4M (2x $1.2M)', agent: 'Action Exec Alpha' },
            { action: 'Sent counter-proposal to client legal team with policy justification', agent: 'Action Exec Alpha' },
            { action: 'Client accepted capped indemnification after 24-hour review', agent: 'System' },
            { action: 'Updated contract with agreed terms. Compliance verified.', agent: 'Shield Verifier' }
          ]
        }
      },
      {
        id: 5, name: 'Client Delivery & e-Signature', agent: 'Action Exec Alpha',
        reasoning: 'Sent finalized contract to Globex Corp via DocuSign. Tracking ID: DS-2026-4401. Auto-set 7-day signing deadline with 3-day reminder.',
        confidence: 99.0, duration: 2000,
        alternatives: ['Send via email attachment (rejected: DocuSign provides audit trail and legally binding signatures)']
      },
      {
        id: 6, name: 'Execution & Archival', agent: 'Shield Verifier',
        reasoning: 'Both parties signed. Contract CON-2026-0891-R archived in DMS. Revenue recognition updated in ERP. Account team notified. Workflow COMPLETE. Total autonomous steps: 6/6.',
        confidence: 100, duration: 2000,
        alternatives: []
      }
    ]
  }
];

export const meetingTranscript = {
  title: 'Q3 Product Strategy Sync',
  date: 'March 28, 2026 — 2:00 PM',
  duration: '47 minutes',
  attendees: ['Sarah Chen (VP Eng)', 'James Rodriguez (PM)', 'Priya Patel (Design)', 'Alex Kim (Backend Lead)'],
  lines: [
    { time: '2:01', speaker: 'Sarah Chen', text: 'Let\'s start with the API migration timeline. Are we on track for the April deadline?' },
    { time: '2:02', speaker: 'Alex Kim', text: 'We\'re about 70% through the migration. The auth service is done, but the billing API needs another two weeks.' },
    { time: '2:04', speaker: 'Sarah Chen', text: 'That pushes us past the deadline. Alex, can you pull in one more engineer to parallelize the billing work?' },
    { time: '2:05', speaker: 'Alex Kim', text: 'Yes, I\'ll grab someone from the platform team. We should be able to hit April 15th.' },
    { time: '2:07', speaker: 'James Rodriguez', text: 'For the new dashboard feature, design review is complete. Priya, when can engineering get the final mocks?' },
    { time: '2:08', speaker: 'Priya Patel', text: 'I\'ll have the Figma files updated and shared by end of day Thursday.' },
    { time: '2:10', speaker: 'Sarah Chen', text: 'Great. James, please create the epic in Jira once you have the mocks. Target sprint 24 for kickoff.' },
    { time: '2:12', speaker: 'James Rodriguez', text: 'Got it. Also, the client demo for Globex is next Tuesday. Alex, we need the staging environment updated.' },
    { time: '2:13', speaker: 'Alex Kim', text: 'I\'ll deploy the latest build to staging by Monday EOD.' },
    { time: '2:15', speaker: 'Sarah Chen', text: 'One more thing — we need to decide on the caching strategy. Redis or Memcached?' },
    { time: '2:17', speaker: 'Alex Kim', text: 'Redis. It gives us pub/sub for real-time features and better persistence options.' },
    { time: '2:18', speaker: 'Sarah Chen', text: 'Agreed. Let\'s go with Redis. Alex, write up a brief ADR by Friday.' },
  ],
  extractedItems: [
    { type: 'decision', text: 'Use Redis over Memcached for caching layer', owner: 'Alex Kim', status: 'decided' },
    { type: 'decision', text: 'Target April 15th for API migration completion', owner: 'Alex Kim', status: 'decided' },
    { type: 'decision', text: 'Dashboard feature kickoff in Sprint 24', owner: 'James Rodriguez', status: 'decided' },
    { type: 'action', text: 'Pull in engineer from platform team for billing API', owner: 'Alex Kim', deadline: 'March 29', status: 'in-progress', daysLeft: 1 },
    { type: 'action', text: 'Share updated Figma mocks with engineering', owner: 'Priya Patel', deadline: 'March 31', status: 'pending', daysLeft: 3 },
    { type: 'action', text: 'Create dashboard epic in Jira', owner: 'James Rodriguez', deadline: 'April 1', status: 'pending', daysLeft: 4 },
    { type: 'action', text: 'Deploy latest build to staging environment', owner: 'Alex Kim', deadline: 'March 31', status: 'in-progress', daysLeft: 3 },
    { type: 'action', text: 'Write ADR for Redis caching decision', owner: 'Alex Kim', deadline: 'April 4', status: 'pending', daysLeft: 7 },
    { type: 'escalation', text: 'Billing API migration behind schedule — resource needed', owner: 'Sarah Chen', status: 'resolved' }
  ]
};
