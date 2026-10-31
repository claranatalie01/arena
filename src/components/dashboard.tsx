"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomerPortal } from "@/components/customer-portal";
import { NccoWorkbench } from "@/components/ncco-workbench";
import { SupervisorView } from "@/components/supervisor-view";
import { TeamWorkspace } from "@/components/team-workspace";
import { TEAM_MEMBERS, useCase, type RoleView } from "@/lib/case-store";
import { SCENARIOS, type ScenarioKey, type TeamName } from "@/lib/data";

const ROLES: { value: RoleView; label: string }[] = [
  { value: "ncco", label: "NCCO (Customer Service)" },
  { value: "team", label: "Team workspace" },
  { value: "customer", label: "Customer portal" },
  { value: "supervisor", label: "Supervisor" },
];
const TEAMS = (Object.keys(TEAM_MEMBERS) as TeamName[]).map((t) => ({ value: t, label: t }));
const ghostBtn = "border-white/40 bg-transparent text-white hover:bg-white/10 aria-pressed:bg-white/20";
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
    <Button variant="outline" size="sm" className={ghostBtn} onClick={toggle}>
      {dark ? "Light" : "Dark"}
    </Button>
  );
}

function DemoMenu() {
  const { s, dispatch } = useCase();
  const [open, setOpen] = useState(false);
  const items = (Object.keys(SCENARIOS) as ScenarioKey[]).map((k) => ({ value: k, label: SCENARIOS[k].label }));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <Button variant="outline" size="sm" className={ghostBtn} aria-expanded={open} aria-pressed={open} onClick={() => setOpen((o) => !o)}>
        Demo
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 space-y-3 rounded-xl border bg-card p-4 text-sm text-card-foreground shadow-lg">
          <div className="space-y-1.5">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Scenario</div>
            <Select items={items} value={s.scen} onValueChange={(v) => v && dispatch({ type: "reset", scen: v as ScenarioKey })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {items.map((i) => (
                  <SelectItem key={i.value} value={i.value}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="w-full" onClick={() => dispatch({ type: "reset", scen: s.scen })}>
            Reset demo
          </Button>
          <details className="text-xs text-muted-foreground">
            <summary className="w-fit cursor-pointer select-none hover:text-foreground">Assumptions</summary>
            <p className="mt-1">
              AI output is simulated, with no model call. Confidence threshold 0.75. Required-field lists per task type. OpsHub status arrives about every 15 minutes in real life (TA08). Names and times are illustrative.
            </p>
          </details>
        </div>
      )}
    </div>
  );
}

function Header({ logOpen, onToggleLog }: { logOpen: boolean; onToggleLog: () => void }) {
  const { view, setView, team, setTeam, pos, setPos } = useCase();
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
            <SelectContent className="min-w-56">
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
        <Button variant="outline" size="sm" className={ghostBtn} aria-pressed={logOpen} onClick={onToggleLog}>
          Activity
        </Button>
        <DemoMenu />
      </nav>
    </header>
  );
}

function ActivityLog() {
  const { s } = useCase();
  return (
    <aside>
      <Card>
        <CardHeader>
          <CardTitle>Activity log</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[32rem] overflow-auto text-xs">
          {s.log.map((e, i) => (
            <div key={i} className="border-b py-1.5 last:border-0">
              <span className="text-muted-foreground">{e.t}</span> <b>{e.who}</b>: {e.text}
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

export function Dashboard() {
  const { s, view } = useCase();
  const [logOpen, setLogOpen] = useState(false);
  return (
    <div className="min-h-screen bg-muted/40">
      <Header logOpen={logOpen} onToggleLog={() => setLogOpen((o) => !o)} />
      <div className={`mx-auto grid gap-4 p-4 ${logOpen ? "max-w-[1100px] lg:grid-cols-[minmax(0,1fr)_300px]" : "max-w-5xl"}`}>
        <main>
          {view === "ncco" && <NccoWorkbench key={s.epoch} />}
          {view === "team" && <TeamWorkspace key={s.epoch} />}
          {view === "customer" && <CustomerPortal />}
          {view === "supervisor" && <SupervisorView />}
        </main>
        {logOpen && <ActivityLog />}
      </div>
    </div>
  );
}
