"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Notice, Pill, StatusPill } from "@/components/pill";
import { TEAM_MEMBERS, useCase } from "@/lib/case-store";
import { NCCO, type Task } from "@/lib/data";

export function TeamWorkspace() {
  const { pos } = useCase();
  return pos === "Team Lead" ? <TeamLeadBoard /> : <SpecialistView />;
}

function TeamLeadBoard() {
  const { s, dispatch, team, setPos } = useCase();
  const tasks = s.sc.tasks.filter((t) => t.approved && t.team === team && t.status !== "draft");
  const toAssign = tasks.filter((t) => t.status === "queued").length;
  const members = TEAM_MEMBERS[team];
  const items = members.map((m) => ({ value: m, label: m }));

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold">{team}</h2>
          <Pill tone={toAssign ? "amber" : "muted"}>{toAssign ? `${toAssign} to assign` : "Nothing to assign"}</Pill>
        </CardContent>
      </Card>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">No tasks yet. They appear here once the NCCO sends them.</CardContent>
        </Card>
      ) : (
        tasks.map((t) => (
          <Card key={t.id}>
            <CardContent className="space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <b>
                  {s.sc.caseId} {"·"} {t.title}
                </b>
                {t.priority === "High" && <Pill tone="red">High priority</Pill>}
                <span className="ml-auto">
                  <StatusPill task={t} />
                </span>
              </div>
              <details className="text-xs text-muted-foreground">
                <summary className="w-fit cursor-pointer select-none hover:text-foreground">Handoff details</summary>
                <p className="mt-1">{t.fields.map((f) => `${f.label}: ${f.val}`).join(" · ")}</p>
              </details>
              {t.status === "queued" && (
                <div className="flex items-center gap-2 border-t pt-3">
                  <span className="text-xs text-muted-foreground">Assign to</span>
                  <Select items={items} onValueChange={(v) => v && dispatch({ type: "assign", id: t.id, who: String(v) })}>
                    <SelectTrigger size="sm" className="min-w-40">
                      <SelectValue placeholder="Choose member" />
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
              )}
              {t.status === "scheduled" && <p className="text-xs text-muted-foreground">Waiting for task {t.after} to finish.</p>}
              {t.assignee && (
                <div className="flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
                  Owner: <b className="text-foreground">{t.assignee}</b>
                  <Button size="xs" variant="outline" className="ml-auto" onClick={() => setPos(t.assignee!)}>
                    Open as {t.assignee}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}

      <Card>
        <CardContent className="space-y-2 text-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Team load</div>
          {members.map((m) => {
            const busy = s.sc.tasks.some((t) => t.assignee === m && t.status !== "resolved");
            return (
              <div key={m} className="flex items-center gap-2">
                <span className="w-36">{m}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded bg-muted">
                  <div className="h-full bg-teal-600" style={{ width: busy ? "60%" : "25%" }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function SpecialistView() {
  const { s, team, pos } = useCase();
  const tasks = s.sc.tasks.filter((t) => t.approved && t.team === team && t.assignee === pos);
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold">My tasks</h2>
          <Pill tone="teal">{pos}</Pill>
          <Pill>{team}</Pill>
        </CardContent>
      </Card>
      {!tasks.length && (
        <Card>
          <CardContent className="text-sm text-muted-foreground">Nothing assigned to you yet. Your team lead will assign tasks.</CardContent>
        </Card>
      )}
      {tasks.map((t) => (
        <SpecialistTask key={t.id} task={t} />
      ))}
    </div>
  );
}

function SpecialistTask({ task: t }: { task: Task }) {
  const { s, dispatch } = useCase();
  const [asking, setAsking] = useState(false);
  const [field, setField] = useState("");
  const [note, setNote] = useState("");

  return (
    <Card>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <b>
            {s.sc.caseId} {"·"} {t.title}
          </b>
          <span className="text-xs text-muted-foreground">Customer contact: {NCCO}</span>
          <span className="ml-auto">
            <StatusPill task={t} />
          </span>
        </div>
        <div className="grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
          {t.fields.map((f) => (
            <div key={f.k} className="flex gap-2 text-xs">
              <span className="text-muted-foreground">{f.label}</span>
              <span>{f.val}</span>
            </div>
          ))}
        </div>
        {t.status === "waiting" && t.req && <Notice tone="amber">Waiting for the customer (via {NCCO}): {t.req.field}</Notice>}
        {t.status === "assigned" && (
          <div className="space-y-3 border-t pt-3">
            {asking ? (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  autoFocus
                  className="max-w-72"
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  placeholder="What do you need from the customer?"
                />
                <Button
                  disabled={!field.trim()}
                  onClick={() => {
                    dispatch({ type: "raise", id: t.id, field: field.trim(), why: "" });
                    setAsking(false);
                    setField("");
                  }}
                >
                  Send to {NCCO}
                </Button>
                <Button variant="ghost" onClick={() => setAsking(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Input className="max-w-72" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was done? (optional)" />
                <Button className="bg-teal-700 text-white hover:bg-teal-800" onClick={() => dispatch({ type: "resolve", id: t.id, note: note.trim() })}>
                  Mark resolved
                </Button>
                <Button variant="outline" className="ml-auto" onClick={() => setAsking(true)}>
                  Need more info
                </Button>
              </div>
            )}
          </div>
        )}
        {t.status === "resolved" && <Notice tone="green">Resolved: {t.note}</Notice>}
      </CardContent>
    </Card>
  );
}
