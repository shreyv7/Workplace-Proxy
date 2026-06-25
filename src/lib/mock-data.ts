export type ClarityMessage = {
  message_id: string;
  sender_name: string;
  sender_role: string;
  timestamp: string;
  original_text: string;
  ambiguity: "low" | "medium" | "high";
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
};

export const initialMessages: ClarityMessage[] = [
  {
    message_id: "msg_001",
    sender_name: "Manager Tom",
    sender_role: "Engineering Lead",
    timestamp: "09:12",
    original_text:
      "Hey, can you take a look at that deployment thing whenever? No rush, but kind of important. Also ping the infra folks if it feels off.",
    ambiguity: "high",
    translated_bullet_points: {
      action: "Deploy latest staging branch to production",
      complexity: "High",
      expected_duration: "90 mins",
      steps: [
        "Verify staging branch passes CI checks",
        "Coordinate window with Infra (Slack #infra)",
        "Run production deploy script & monitor for 20 mins",
      ],
    },
    suggested_start_time: "14:00",
    suggested_end_time: "15:30",
    fidelity_rating: 4,
    acknowledged: false,
  },
  {
    message_id: "msg_002",
    sender_name: "Priya (Design)",
    sender_role: "Product Designer",
    timestamp: "10:04",
    original_text:
      "Could you maybe loop back on the onboarding flow? The colors feel a bit much and we should probably revisit the empty state at some point.",
    ambiguity: "medium",
    translated_bullet_points: {
      action: "Review onboarding flow palette & empty state",
      complexity: "Medium",
      expected_duration: "45 mins",
      steps: [
        "Open Figma file: Onboarding v3",
        "Lower saturation on hero gradient",
        "Draft empty state copy + illustration spec",
      ],
    },
    suggested_start_time: "11:30",
    suggested_end_time: "12:15",
    fidelity_rating: 3,
    acknowledged: false,
  },
  {
    message_id: "msg_003",
    sender_name: "Client – Northwind",
    sender_role: "External Stakeholder",
    timestamp: "10:48",
    original_text:
      "Following up on our convo — would love to align on the Q3 roadmap soon. Open Thursday?",
    ambiguity: "medium",
    translated_bullet_points: {
      action: "Schedule 30-min roadmap alignment call",
      complexity: "Low",
      expected_duration: "15 mins to schedule",
      steps: [
        "Check calendar for Thursday availability",
        "Send 3 time slots via email",
        "Add to CRM as ‘Q3 alignment’",
      ],
    },
    suggested_start_time: "16:00",
    suggested_end_time: "16:30",
    fidelity_rating: 5,
    acknowledged: false,
  },
];

export type CalendarBlock = {
  id: string;
  start: string; // "HH:MM"
  end: string;
  title: string;
  type: "focus" | "task" | "meeting";
  source_message_id?: string;
  acknowledged?: boolean;
};

export const initialCalendar: CalendarBlock[] = [
  { id: "blk_focus_1", start: "09:00", end: "11:00", title: "Deep Work — Architecture review", type: "focus" },
  { id: "blk_meet_1", start: "13:00", end: "13:45", title: "Team standup", type: "meeting" },
  { id: "blk_focus_2", start: "15:45", end: "17:30", title: "Deep Work — Quiet block", type: "focus" },
];

export const traceLogSeed: string[] = [
  '{"t":"09:11:42","agent":"Agent 1 / Router","tool":"channel_intercept","msg":"Inbound: slack.manager_tom"}',
  '{"t":"09:11:43","agent":"Agent 2 / Semantics","tool":"qdrant_semantic_search","query":"deployment thing"}',
  '{"t":"09:11:44","agent":"Agent 3 / Calendar","tool":"get_calendar_free_busy","window":"today"}',
  '{"t":"09:11:45","agent":"A2A","event":"State: Resolution achieved via 3-agent consensus debate"}',
  '{"t":"09:11:46","agent":"Agent 4 / Composer","tool":"render_clarity_card","msg_id":"msg_001"}',
];
