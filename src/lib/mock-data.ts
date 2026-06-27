export type ClarityMessage = {
  message_id: string;
  sender_name: string;
  sender_role: string;
  timestamp: string;
  original_text: string;
  source: "slack" | "email" | "jira" | "teams";
  importance: "low" | "medium" | "high";
  ambiguity: "low" | "medium" | "high";
  agent_assigned: string;
  translation_status: "idle" | "processing" | "completed";
  translated_bullet_points: {
    action: string;
    complexity: "Low" | "Medium" | "High";
    expected_duration: string;
    steps: string[];
  };
  suggested_start_time: string; // "HH:MM"
  suggested_end_time: string;
  fidelity_rating: number; // 1-5
  acknowledged: boolean;
  reasoning: string;
  debate_id?: string;
};

export const initialMessages: ClarityMessage[] = [
  {
    message_id: "msg_test_1",
    sender_name: "Tom (Infra)",
    sender_role: "Lead DevOps",
    timestamp: "09:15",
    original_text: "Hey, let's deploy the staging fixes around 14:00 today. We need about 45 minutes to run regression tests.",
    source: "slack",
    importance: "high",
    ambiguity: "low",
    agent_assigned: "Interceptor Agent",
    translation_status: "completed",
    translated_bullet_points: {
      action: "Verify and run staging deployment",
      complexity: "High",
      expected_duration: "45 mins",
      steps: [
        "Verify staging CI build passes",
        "Coordinate deployment script run with infra",
        "Deploy and monitor logs for 15 mins"
      ]
    },
    suggested_start_time: "14:00",
    suggested_end_time: "14:45",
    fidelity_rating: 4,
    acknowledged: false,
    reasoning: "Urgent deployment requested. Scheduled for 14:00 today post-standup.",
    debate_id: "deb_001"
  },
  {
    message_id: "msg_test_2",
    sender_name: "Priya (Design)",
    sender_role: "Product Designer",
    timestamp: "10:05",
    original_text: "We need to align on the onboarding flow roadmap at 14:15. Can you make 45 minutes work?",
    source: "jira",
    importance: "medium",
    ambiguity: "low",
    agent_assigned: "Context Agent",
    translation_status: "completed",
    translated_bullet_points: {
      action: "Align on onboarding flow roadmap",
      complexity: "Medium",
      expected_duration: "45 mins",
      steps: [
        "Open Figma: Onboarding v3",
        "Review color palette choices",
        "Map empty state roadmap milestones"
      ]
    },
    suggested_start_time: "14:15",
    suggested_end_time: "15:00",
    fidelity_rating: 4,
    acknowledged: false,
    reasoning: "Figma design alignment meeting requested. Collision expected with Staging Deployment.",
    debate_id: "deb_002"
  },
  {
    message_id: "msg_test_3",
    sender_name: "Sprint Triage",
    sender_role: "Product Manager",
    timestamp: "11:20",
    original_text: "Critical budget approval check at 14:00. Needs 30 minutes to review Q3 spreadsheets.",
    source: "teams",
    importance: "high",
    ambiguity: "low",
    agent_assigned: "Scheduler Agent",
    translation_status: "completed",
    translated_bullet_points: {
      action: "Approve Q3 sprint budget spreadsheets",
      complexity: "High",
      expected_duration: "30 mins",
      steps: [
        "Open budget tracker in Google Sheets",
        "Check line-item deviations",
        "Sign off and ping Sprint Triage"
      ]
    },
    suggested_start_time: "14:00",
    suggested_end_time: "14:30",
    fidelity_rating: 5,
    acknowledged: false,
    reasoning: "Strict financial deadline requires budget review. Overlaps with deploy sync and figma design.",
    debate_id: "deb_003"
  },
  {
    message_id: "msg_test_4",
    sender_name: "Sarah (Marketing)",
    sender_role: "Growth Lead",
    timestamp: "11:30",
    original_text: "Can we quickly review copy docs for the launch campaign at 10:00? Just 30 minutes.",
    source: "email",
    importance: "low",
    ambiguity: "low",
    agent_assigned: "Translator Agent",
    translation_status: "completed",
    translated_bullet_points: {
      action: "Review launch copy docs with Sarah",
      complexity: "Low",
      expected_duration: "30 mins",
      steps: [
        "Verify Google Doc content is approved by branding",
        "Provide quick formatting check",
        "Ping Sarah with approvals"
      ]
    },
    suggested_start_time: "10:00",
    suggested_end_time: "10:30",
    fidelity_rating: 4,
    acknowledged: false,
    reasoning: "Campaign copy review fits in the mid-morning gap.",
  },
  {
    message_id: "msg_test_5",
    sender_name: "Client - Northwind",
    sender_role: "External Stakeholder",
    timestamp: "12:10",
    original_text: "Roadmap update review meeting scheduled for 11:30. Let's block 45 minutes.",
    source: "email",
    importance: "medium",
    ambiguity: "low",
    agent_assigned: "Scheduler Agent",
    translation_status: "completed",
    translated_bullet_points: {
      action: "Northwind Q3 Roadmap Sync",
      complexity: "Medium",
      expected_duration: "45 mins",
      steps: [
        "Review current slides in Q3 deck",
        "Discuss roadmap milestones",
        "Document follow-up questions"
      ]
    },
    suggested_start_time: "11:30",
    suggested_end_time: "12:15",
    fidelity_rating: 4,
    acknowledged: false,
    reasoning: "Standard external sync slot.",
  }
];

export type CalendarBlock = {
  id: string;
  start: string; // "HH:MM"
  end: string;
  title: string;
  type: "focus" | "task" | "meeting";
  source_message_id?: string;
  acknowledged?: boolean;
  agent_generated?: boolean;
  confidence?: number;
  reason?: string;
};

export const initialCalendar: CalendarBlock[] = [];

export const traceLogSeed: string[] = [
  '{"t":"09:11:42","agent":"Interceptor Agent","tool":"channel_intercept","msg":"Inbound stream: slack.manager_tom.new_message"}',
  '{"t":"09:11:43","agent":"Context Agent","tool":"qdrant_semantic_search","query":"production staging deployment scripts"}',
  '{"t":"09:11:44","agent":"Scheduler Agent","tool":"get_calendar_free_busy","window":"today"}',
  '{"t":"09:11:45","agent":"Consensus Swarm","event":"Debate resolved: 3-agent agreement reached on action items and timing. Confidence: 94%"}',
  '{"t":"09:11:46","agent":"Translator Agent","tool":"render_clarity_card","msg_id":"msg_001"}',
];

export type AgentNode = {
  id: string;
  name: string;
  role: string;
  status: "idle" | "processing" | "sleeping";
  current_task?: string;
  latency: string;
  confidence: number;
  tool_in_use?: string;
  description: string;
};

export const initialAgents: AgentNode[] = [
  {
    id: "agent_interceptor",
    name: "Interceptor Agent",
    role: "Signal Ingestion & Priority",
    status: "idle",
    current_task: "Listening to Slack / Jira webhooks",
    latency: "12ms",
    confidence: 98,
    tool_in_use: "webhook_listener",
    description: "Ingests messy workspace signals, filters noise, assesses raw urgency, and standardizes parameters.",
  },
  {
    id: "agent_context",
    name: "Context Agent",
    role: "Vector Search & Retrieval",
    status: "processing",
    current_task: "Searching vector databases for 'staging deployment'",
    latency: "84ms",
    confidence: 91,
    tool_in_use: "qdrant_vector_lookup",
    description: "Queries historical logs, chat threads, and codebase definitions to append relevant context to signals.",
  },
  {
    id: "agent_scheduler",
    name: "Scheduler Agent",
    role: "Dynamic Calendar Planning",
    status: "idle",
    current_task: "Protecting focus block at 15:45",
    latency: "45ms",
    confidence: 95,
    tool_in_use: "gcal_conflict_resolve",
    description: "Analyzes current calendars, cognitive fatigue cycles, and task complexities to find optimal time slots.",
  },
  {
    id: "agent_translator",
    name: "Translator Agent",
    role: "Synthesizer & Composer",
    status: "processing",
    current_task: "Drafting high-fidelity briefing for onboarding",
    latency: "150ms",
    confidence: 97,
    tool_in_use: "briefing_renderer",
    description: "Transforms dense, ambiguous messages into clear actions, checklist steps, and duration estimates.",
  }
];

export type MemoryEntry = {
  id: string;
  category: "personal" | "corporate";
  title: string;
  content: string;
  last_updated: string;
  use_count: number;
  confidence: number;
};

export const initialMemories: MemoryEntry[] = [
  {
    id: "mem_001",
    category: "personal",
    title: "Communication Style Preferences",
    content: "Prefers high-fidelity checklist formatting with step-by-step guidance. Avoids large paragraphs.",
    last_updated: "2 hours ago",
    use_count: 42,
    confidence: 98
  },
  {
    id: "mem_002",
    category: "personal",
    title: "Energy & Focus Cycles",
    content: "High cognitive focus peaks between 09:00 - 11:30. Prefers scheduling external client syncs after 15:00.",
    last_updated: "Yesterday",
    use_count: 120,
    confidence: 95
  },
  {
    id: "mem_003",
    category: "personal",
    title: "Known Stress Triggers",
    content: "More than 3 context switches per hour triggers auto-activation of defensive calendar blocking.",
    last_updated: "3 days ago",
    use_count: 14,
    confidence: 89
  },
  {
    id: "mem_004",
    category: "corporate",
    title: "Staging Server Deployment Steps",
    content: "Production deployment requires Infra alignment in #infra and verification on the staging branch beforehand.",
    last_updated: "10 mins ago",
    use_count: 8,
    confidence: 97
  },
  {
    id: "mem_005",
    category: "corporate",
    title: "Onboarding Flow Mockups",
    content: "Figma design directory is located at Figma folder: Workplace Proxy / Onboarding / v3-final.",
    last_updated: "Yesterday",
    use_count: 19,
    confidence: 93
  },
  {
    id: "mem_006",
    category: "corporate",
    title: "Northwind Client Contacts",
    content: "Northwind main stakeholders are John Doe and Sally Miller. Roadmap approval goes through CRM pipeline 'Q3 alignment'.",
    last_updated: "Last week",
    use_count: 31,
    confidence: 99
  }
];

export type Integration = {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "error";
  messages_waiting: number;
  last_sync: string;
  latency: string;
  icon: string;
  description: string;
  permissions: string[];
};

export const initialIntegrations: Integration[] = [
  {
    id: "int_slack",
    name: "Slack",
    status: "connected",
    messages_waiting: 3,
    last_sync: "Just now",
    latency: "14ms",
    icon: "💬",
    description: "Ingests messages from channels, DMs, and user mentions.",
    permissions: ["Read Channels", "Read DMs", "Write Status"]
  },
  {
    id: "int_email",
    name: "Email (Gmail & Outlook)",
    status: "connected",
    messages_waiting: 1,
    last_sync: "2 mins ago",
    latency: "120ms",
    icon: "✉️",
    description: "Monitors primary client folders and incoming project files.",
    permissions: ["Read Mail", "Send Drafts"]
  },
  {
    id: "int_calendar",
    name: "Google Calendar",
    status: "connected",
    messages_waiting: 0,
    last_sync: "Just now",
    latency: "25ms",
    icon: "📅",
    description: "Auto-books tasks and blocks out defensive deep work slots.",
    permissions: ["Read Events", "Write Events", "Modify Calendar"]
  },
  {
    id: "int_jira",
    name: "Jira Cloud",
    status: "disconnected",
    messages_waiting: 2,
    last_sync: "5 mins ago",
    latency: "95ms",
    icon: "🎫",
    description: "Monitors active sprints, assignments, and ticket priority tags.",
    permissions: ["Read Tickets", "Update Status", "Comment Tasks"]
  },
  {
    id: "int_linear",
    name: "Linear",
    status: "disconnected",
    messages_waiting: 0,
    last_sync: "1 hour ago",
    latency: "45ms",
    icon: "⚡",
    description: "Coordinates tracking of engineering issues and product backlogs.",
    permissions: ["Read Issues", "Assign Tasks"]
  },
  {
    id: "int_github",
    name: "GitHub",
    status: "disconnected",
    messages_waiting: 5,
    last_sync: "Just now",
    latency: "30ms",
    icon: "🐙",
    description: "Parses pull request reviews, comments, and issue updates.",
    permissions: ["Read Repository", "Read Notifications", "Write Comments"]
  },
  {
    id: "int_teams",
    name: "Microsoft Teams",
    status: "disconnected",
    messages_waiting: 1,
    last_sync: "12 mins ago",
    latency: "150ms",
    icon: "👥",
    description: "Monitors corporate channels and chat alerts.",
    permissions: ["Read Chat", "Sync Team Status"]
  },
  {
    id: "int_notion",
    name: "Notion Workspace",
    status: "disconnected",
    messages_waiting: 0,
    last_sync: "3 hours ago",
    latency: "180ms",
    icon: "📓",
    description: "Indexes shared wikis, project briefs, and team templates.",
    permissions: ["Read Pages", "Search Workspace"]
  }
];

export type PipelineStage = {
  id: string;
  name: string;
  status: "idle" | "processing" | "completed";
  duration: string;
  confidence: number;
};

export const initialPipelineStages: PipelineStage[] = [
  { id: "stage_intercept", name: "Signal Interceptor", status: "completed", duration: "12ms", confidence: 99 },
  { id: "stage_context", name: "Context Retrieval", status: "completed", duration: "84ms", confidence: 95 },
  { id: "stage_memory", name: "Memory Search", status: "completed", duration: "42ms", confidence: 91 },
  { id: "stage_debate", name: "Agent Consensus Debate", status: "completed", duration: "180ms", confidence: 94 },
  { id: "stage_scheduler", name: "Scheduler Planning", status: "completed", duration: "45ms", confidence: 97 },
  { id: "stage_translation", name: "Briefing Composer", status: "completed", duration: "150ms", confidence: 96 }
];

export type AgentDebate = {
  id: string;
  message_id: string;
  transcript: {
    agent: string;
    avatar: string;
    opinion: string;
    status: "proposed" | "countered" | "agreed";
    reason: string;
  }[];
};

export const initialDebates: AgentDebate[] = [
  {
    id: "deb_001",
    message_id: "msg_001",
    transcript: [
      {
        agent: "Interceptor Agent",
        avatar: "IA",
        opinion: "Flagged message as high priority.",
        status: "proposed",
        reason: "The mention of production deployment and infra coordination indicates high structural risk to the codebase."
      },
      {
        agent: "Scheduler Agent",
        avatar: "SA",
        opinion: "Objected to scheduling immediately.",
        status: "countered",
        reason: "User has an active deep-work focus block scheduled until 11:30. Scheduling this task at 10:00 will cause a major context switch and increase burnout risk."
      },
      {
        agent: "Context Agent",
        avatar: "CA",
        opinion: "Provided deployment context.",
        status: "proposed",
        reason: "Found that production deployment script usually takes 30-40 minutes and staging testing must happen first. Let's block 90 minutes post-lunch."
      },
      {
        agent: "Scheduler Agent",
        avatar: "SA",
        opinion: "Proposed a 14:00 - 15:30 block.",
        status: "agreed",
        reason: "14:00 is ideal as the user is refreshed post-lunch and it overlaps with the Infra team availability window."
      },
      {
        agent: "Translator Agent",
        avatar: "TA",
        opinion: "Final consensus reached.",
        status: "agreed",
        reason: "Will compose high-fidelity action items detailing staging checks and Slack communication steps for the final layout."
      }
    ]
  },
  {
    id: "deb_002",
    message_id: "msg_002",
    transcript: [
      {
        agent: "Interceptor Agent",
        avatar: "IA",
        opinion: "Flagged onboarding feedback as medium priority.",
        status: "proposed",
        reason: "Visual feedback from design lead, high importance but not blocker."
      },
      {
        agent: "Context Agent",
        avatar: "CA",
        opinion: "Located Figma Onboarding file.",
        status: "agreed",
        reason: "Retrieved file 'Onboarding v3' from shared corporate memories to speed up designer feedback loop."
      },
      {
        agent: "Scheduler Agent",
        avatar: "SA",
        opinion: "Suggested slot at 11:30.",
        status: "agreed",
        reason: "A 45-minute window exists right after the morning focus block, ideal for design adjustments before lunch."
      }
    ]
  },
  {
    id: "deb_003",
    message_id: "msg_003",
    transcript: [
      {
        agent: "Interceptor Agent",
        avatar: "IA",
        opinion: "Identified meeting request.",
        status: "proposed",
        reason: "Stakeholder requesting availability on Thursday."
      },
      {
        agent: "Scheduler Agent",
        avatar: "SA",
        opinion: "Proposed block at 16:00 on Thursday.",
        status: "agreed",
        reason: "Client meeting block of 15:00 - 17:00 is open. Setting up a draft block for approval."
      }
    ]
  }
];

export const kpiStats = {
  messages_simplified: 142,
  hours_saved: 24.5,
  clarity_score: 96,
  context_switches_prevented: 38,
  est_time_saved_mins: 1470,
  ai_confidence: 94,
  cognitive_friction: "18% decrease from last week",
  noise_filtered: 876,
};

export const cognitiveLoad = {
  current_load: 42, // percentage
  status: "Optimal" as "Optimal" | "Moderate" | "Overloaded",
  focus_window: "09:00 - 11:30",
  current_energy: 78, // percentage
  burnout_risk: "Low",
  history: [
    { day: "Mon", load: 35 },
    { day: "Tue", load: 68 },
    { day: "Wed", load: 50 },
    { day: "Thu", load: 42 }, // today
    { day: "Fri", load: 25 }
  ]
};
