"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomerPortal } from "@/components/customer-portal";
import { NccoWorkbench } from "@/components/ncco-workbench";
import { SupervisorView } from "@/components/supervisor-view";
import { TeamWorkspace } from "@/components/team-workspace";
import { TEAM_MEMBERS, useCase, type RoleView } from "@/lib/case-store";
import type { TeamName } from "@/lib/data";

const ROLES: { value: RoleView; label: string }[] = [
  { value: "ncco", label: "NCCO Workbench (Customer Service)" },
  { value: "team", label: "Team workspace (Team Lead / Specialist)" },
  { value: "customer", label: "Customer portal" },
  { value: "supervisor", label: "Supervisor" },
];
const TEAMS = (Object.keys(TEAM_MEMBERS) as TeamName[]).map((t) => ({ value: t, label: t }));
const headerSelect = "bg-white text-slate-900 hover:bg-white dark:bg-white dark:hover:bg-white font-semibold";

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-300">
      {label}
      {children}
    </label>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };
  return (
    <Button variant="outline" size="sm" className="border-white/40 bg-transparent text-white hover:bg-white/10" onClick={toggle}>
      {dark ? "Light" : "Dark"}
    </Button>
  );
}

function Header() {
  const { s, dispatch, view, setView, team, setTeam, pos, setPos } = useCase();
  const positions = ["Team Lead", ...TEAM_MEMBERS[team]].map((p) => ({ value: p, label: p === "Team Lead" ? "Team Lead" : `Specialist: ${p}` }));
  return (
    <header className="flex flex-wrap items-center gap-3 bg-slate-900 px-4 py-2.5 text-white">
      <div>
        <h1 className="text-base font-semibold">
          HarbourNova Case Card <span className="text-xs font-normal opacity-70">{"·"} mockup {"·"} synthetic data only</span>
        </h1>
      </div>
      <nav className="ml-auto flex flex-wrap items-center gap-3">
        <Labeled label="Role">
          <Select items={ROLES} value={view} onValueChange={(v) => v && setView(v as RoleView)}>
            <SelectTrigger size="sm" className={headerSelect}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Labeled>
        {view === "team" && (
          <>
            <Labeled label="Team">
              <Select items={TEAMS} value={team} onValueChange={(v) => v && setTeam(v as TeamName)}>
                <SelectTrigger size="sm" className={headerSelect}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAMS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Labeled>
            <Labeled label="Position">
              <Select items={positions} value={pos} onValueChange={(v) => v && setPos(v)}>
                <SelectTrigger size="sm" className={headerSelect}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Labeled>
          </>
        )}
        <ThemeToggle />
        <Button variant="outline" size="sm" className="border-white/40 bg-transparent text-white hover:bg-white/10" onClick={() => dispatch({ type: "reset", scen: s.scen })}>
          Reset demo
        </Button>
      </nav>
    </header>
  );
}

function ActivityLog() {
  const { s } = useCase();
  return (
    <aside className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Activity log</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[28rem] overflow-auto text-xs">
          {s.log.map((e, i) => (
            <div key={i} className="border-b py-1.5 last:border-0">
              <span className="text-muted-foreground">{e.t}</span> <b>{e.who}</b>: {e.text}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="text-xs text-muted-foreground">
          <b className="text-foreground">Assumptions (placeholders to validate)</b>
          <br />
          AI output is simulated, with no model call. Confidence threshold 0.75. Required-field lists per task type. OpsHub status arrives about every 15 minutes in real life (TA08). Names and times are illustrative.
        </CardContent>
      </Card>
    </aside>
  );
}

export function Dashboard() {
  const { view } = useCase();
  return (
    <div className="min-h-screen bg-muted/40">
      <Header />
      <div className="mx-auto grid max-w-[1380px] gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main>
          {view === "ncco" && <NccoWorkbench />}
          {view === "team" && <TeamWorkspace />}
          {view === "customer" && <CustomerPortal />}
          {view === "supervisor" && <SupervisorView />}
        </main>
        <ActivityLog />
      </div>
    </div>
  );
}
