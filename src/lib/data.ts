// Synthetic demo data derived from the HarbourNova Student Pack. No real customer data.

export const NCCO = "Leo";
export const CONF_THRESHOLD = 0.75; // placeholder, to be validated in a pilot

export type TeamName = "Service Operations" | "Finance Operations" | "Technical";
export type TaskStatus =
  | "draft"
  | "queued"
  | "scheduled"
  | "assigned"
  | "waiting"
  | "resolved";
export type ScenarioKey = "repair" | "refund";

export interface Field {
  k: string;
  label: string;
  val: string | null;
}

export interface InfoRequest {
  field: string;
  why: string;
  status: "open" | "answered";
  answer?: string;
}

export interface Task {
  id: string;
  title: string;
  team: TeamName;
  conf: number;
  why: string;
  risk: string | null;
  priority: "High" | "Low";
  fields: Field[];
  approved: boolean;
  status: TaskStatus;
  assignee: string | null;
  after: string | null;
  req: InfoRequest | null;
  note: string;
}

export interface Scenario {
  label: string;
  caseId: string;
  segment: string;
  channel: string;
  category: string;
  complexity: string;
  customer: string;
  wording: string[];
  tasks: Task[];
}

export const TEAM_MEMBERS: Record<TeamName, string[]> = {
  "Service Operations": ["Coordinator A", "Coordinator B"],
  "Finance Operations": ["Analyst A", "Analyst B"],
  Technical: ["Specialist A", "Specialist B"],
};

const base = {
  approved: false,
  status: "draft" as TaskStatus,
  assignee: null,
  after: null,
  req: null,
  note: "",
};

export const SCENARIOS: Record<ScenarioKey, Scenario> = {
  repair: {
    label: "Facility repair (HN-26-0135, from evidence C02)",
    caseId: "HN-26-0135",
    segment: "Corporate",
    channel: "Phone (original request: web form)",
    category: "Access & Facilities, Facility repair",
    complexity: "Medium",
    customer: "Ms Chan",
    wording: [
      "I submitted the repair request online on Sunday... The portal still just says “In progress”.",
      "Harbour Point, Tower 2, 16/F, east service corridor. It is in the original form.",
      "Our finance contact prefers PDF invoices rather than the portal download — but that can wait.",
    ],
    tasks: [
      {
        ...base,
        id: "A",
        title: "Repair the damaged door",
        team: "Service Operations",
        conf: 0.93,
        why: "“facility repair”, “damaged door” and a location. Category route is unambiguous (Access & Facilities → Service Operations in 104 of 104 sample cases).",
        risk: null,
        priority: "High",
        fields: [
          { k: "loc", label: "Location", val: "Harbour Point, Tower 2, 16/F, east service corridor" },
          { k: "acc", label: "Access window", val: null },
          { k: "con", label: "Contact person", val: "Ms Chan (caller)" },
          { k: "pho", label: "Photos / evidence", val: "2 photos in ServiceDesk" },
        ],
      },
      {
        ...base,
        id: "B",
        title: "Send invoices as PDF instead of portal download",
        team: "Finance Operations",
        conf: 0.71,
        why: "Separate request mentioned at the end of the call. Customer said it can wait. Confidence is below threshold, so the NCCO must check the split.",
        risk: null,
        priority: "Low",
        fields: [
          { k: "pref", label: "Invoice delivery preference", val: "PDF" },
          { k: "fem", label: "Finance contact email", val: null },
        ],
      },
    ],
  },
  refund: {
    label: "Exceptional refund request (human-approval example)",
    caseId: "HN-26-0xxx (demo)",
    segment: "SME",
    channel: "Email",
    category: "Billing & Account, Refund/credit",
    complexity: "High",
    customer: "Customer (demo)",
    wording: [
      "We were charged twice for a service we cancelled. We want a full refund and a credit for the trouble.",
    ],
    tasks: [
      {
        ...base,
        id: "A",
        title: "Review duplicate charge and refund request",
        team: "Finance Operations",
        conf: 0.58,
        why: "Refund and compensation wording. Low confidence, and refunds are on the always-human list (TA06, R01).",
        risk: "Exceptional refund: human approval required. AI will not decide.",
        priority: "High",
        fields: [
          { k: "inv", label: "Invoice number", val: null },
          { k: "pay", label: "Payment reference", val: null },
          { k: "can", label: "Cancellation date", val: "On file (NovaCRM)" },
        ],
      },
    ],
  },
};

export const OWNER_CHANGE_ROWS = [
  { label: "0 owner changes", cases: 298, sat: "4.15", repeat: "17%", sla: "72%" },
  { label: "1", cases: 122, sat: "3.65", repeat: "37%", sla: "39%" },
  { label: "2", cases: 39, sat: "3.00", repeat: "64%", sla: "0%" },
  { label: "3 or more", cases: 21, sat: "~2.4", repeat: "~90%", sla: "0%" },
];
