"use client";

import { createContext, useContext, useMemo, useReducer, useState } from "react";
import {
  NCCO,
  SCENARIOS,
  TEAM_MEMBERS,
  type Scenario,
  type ScenarioKey,
  type Task,
  type TeamName,
} from "@/lib/data";

export type Stage = "planning" | "active" | "closing" | "closed";
export type RoleView = "ncco" | "team" | "customer" | "supervisor";

export interface LogEntry {
  t: string;
  who: string;
  text: string;
}
export interface Msg {
  t: string;
  text: string;
  auto: boolean;
}
export interface CaseState {
  scen: ScenarioKey;
  sc: Scenario;
  stage: Stage;
  log: LogEntry[];
  msgs: Msg[];
  closeOk: boolean;
  verified: boolean;
  askedOnce: boolean;
  clock: number;
  epoch: number;
}

export type Action =
  | { type: "reset"; scen: ScenarioKey }
  | { type: "approve"; id: string }
  | { type: "setAfter"; id: string; after: string | null }
  | { type: "fill"; answers: { id: string; k: string; val: string }[] }
  | { type: "send" }
  | { type: "assign"; id: string; who: string }
  | { type: "raise"; id: string; field: string; why: string }
  | { type: "answer"; id: string; val: string }
  | { type: "resolve"; id: string; note: string }
  | { type: "setCloseOk"; value: boolean }
  | { type: "close" }
  | { type: "verify" };

function init(scen: ScenarioKey): CaseState {
  const s: CaseState = {
    scen,
    sc: structuredClone(SCENARIOS[scen]),
    stage: "planning",
    log: [],
    msgs: [],
    closeOk: false,
    verified: false,
    askedOnce: false,
    clock: 0,
    epoch: 0,
  };
  return withLog(s, "System", `Case created from customer contact. ${NCCO} is the NCCO.`);
}

function stamp(clock: number) {
  const m = 10 * 60 + 18 + clock * 7;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
function withLog(s: CaseState, who: string, text: string): CaseState {
  return { ...s, log: [{ t: stamp(s.clock), who, text }, ...s.log], clock: s.clock + 1 };
}
function withMsg(s: CaseState, text: string, auto: boolean): CaseState {
  return { ...s, msgs: [...s.msgs, { t: stamp(s.clock), text, auto }], clock: s.clock + 1 };
}

export const taskOf = (s: CaseState, id: string) => s.sc.tasks.find((t) => t.id === id)!;
export const approvedTasks = (s: CaseState) => s.sc.tasks.filter((t) => t.approved);
export const missingFields = (t: Task) => t.fields.filter((f) => !f.val);
export const packComplete = (t: Task) => missingFields(t).length === 0;
const allResolved = (s: CaseState) => {
  const a = approvedTasks(s);
  return a.length > 0 && a.every((t) => t.status === "resolved");
};

function reducer(prev: CaseState, a: Action): CaseState {
  if (a.type === "reset") return { ...init(a.scen), epoch: prev.epoch + 1 };
  let s: CaseState = { ...prev, sc: structuredClone(prev.sc) };
  const t = "id" in a ? s.sc.tasks.find((x) => x.id === a.id) : undefined;

  switch (a.type) {
    case "approve":
      if (!t) return prev;
      t.approved = !t.approved;
      return withLog(s, NCCO, `${t.approved ? "Approved" : "Un-approved"} task ${t.id} (${t.title}) → ${t.team}`);
    case "setAfter":
      if (!t) return prev;
      t.after = a.after;
      return withLog(s, NCCO, `Task ${t.id}${a.after ? ` set to start after task ${a.after}` : " has no dependency"}`);
    case "fill": {
      let any = false;
      for (const ans of a.answers) {
        const f = s.sc.tasks.find((x) => x.id === ans.id)?.fields.find((x) => x.k === ans.k);
        if (f && ans.val.trim()) {
          f.val = ans.val.trim();
          any = true;
        }
      }
      if (!any) return prev;
      s = { ...s, askedOnce: true };
      return withLog(s, NCCO, "Asked the customer once (all missing items together) and recorded the answers");
    }
    case "send": {
      for (const x of approvedTasks(s)) {
        const dep = x.after ? s.sc.tasks.find((d) => d.id === x.after) : undefined;
        x.status = dep && dep.status !== "resolved" ? "scheduled" : "queued";
        s = withLog(s, "System", `Handoff Pack complete for task ${x.id}. Sent to ${x.team} queue.`);
      }
      s = { ...s, stage: "active" };
      s = withMsg(
        s,
        `Hi ${s.sc.customer}, it's ${NCCO}. Your request is now with the teams who will do the work. I stay your contact until it is complete, and I will update you by 17:00 today.`,
        true,
      );
      return withLog(s, "System", `Update to customer sent in ${NCCO}'s name (auto)`);
    }
    case "assign":
      if (!t) return prev;
      t.assignee = a.who;
      t.status = "assigned";
      s = withLog(s, `${t.team} lead`, `Assigned task ${t.id} to ${a.who}`);
      return withMsg(s, `Task update: ${t.title} is now being handled by a named team member.`, true);
    case "raise":
      if (!t) return prev;
      t.req = { field: a.field, why: a.why || "Needed to proceed", status: "open" };
      t.status = "waiting";
      s = withLog(s, t.assignee ?? t.team, `Raised Info Request on task ${t.id}: ${a.field}`);
      return withLog(s, "System", `Task ${t.id} now waiting on customer. Routed to ${NCCO}'s inbox, not to the customer.`);
    case "answer":
      if (!t || !t.req) return prev;
      t.req = { ...t.req, status: "answered", answer: a.val };
      t.status = "assigned";
      t.fields.push({ k: `extra-${t.fields.length}`, label: t.req.field, val: a.val });
      s = withLog(s, NCCO, `Contacted the customer and logged the answer for task ${t.id}: ${a.val}`);
      return withMsg(s, `Thanks ${s.sc.customer}, I have passed your answer to the team. No need to repeat it.`, false);
    case "resolve": {
      if (!t) return prev;
      t.status = "resolved";
      t.note = a.note || "Completed";
      s = withLog(s, t.assignee ?? t.team, `Marked task ${t.id} resolved: ${t.note}`);
      for (const x of s.sc.tasks) {
        if (x.after === t.id && x.approved && x.status === "scheduled") {
          x.status = "queued";
          s = withLog(s, "System", `Task ${x.id} released: dependency ${t.id} is resolved`);
        }
      }
      if (allResolved(s)) {
        s = { ...s, stage: "closing" };
        s = withLog(s, "System", `All tasks resolved. Closing check sent to ${NCCO}.`);
      }
      return s;
    }
    case "setCloseOk":
      return { ...s, closeOk: a.value };
    case "close":
      if (!s.closeOk) return prev;
      s = { ...s, stage: "closed" };
      s = withLog(s, NCCO, "Closing check done. Case closed.");
      return withMsg(
        s,
        `Your request is complete. Thank you for your patience, ${s.sc.customer}. I'm sorry about the repeated questions along the way.`,
        false,
      );
    case "verify":
      return { ...s, verified: true };
  }
}

interface Ctx {
  s: CaseState;
  dispatch: React.Dispatch<Action>;
  view: RoleView;
  setView: (v: RoleView) => void;
  team: TeamName;
  setTeam: (t: TeamName) => void;
  pos: string;
  setPos: (p: string) => void;
}
const CaseCtx = createContext<Ctx | null>(null);

export function CaseProvider({ children }: { children: React.ReactNode }) {
  const [s, dispatch] = useReducer(reducer, "repair" as ScenarioKey, init);
  const [view, setView] = useState<RoleView>("ncco");
  const [team, setTeamState] = useState<TeamName>("Service Operations");
  const [pos, setPos] = useState("Team Lead");
  const value = useMemo<Ctx>(
    () => ({
      s,
      dispatch,
      view,
      setView,
      team,
      setTeam: (t) => {
        setTeamState(t);
        setPos("Team Lead");
      },
      pos,
      setPos,
    }),
    [s, view, team, pos],
  );
  return <CaseCtx.Provider value={value}>{children}</CaseCtx.Provider>;
}

export function useCase() {
  const c = useContext(CaseCtx);
  if (!c) throw new Error("useCase must be used inside CaseProvider");
  return c;
}

export { TEAM_MEMBERS };
