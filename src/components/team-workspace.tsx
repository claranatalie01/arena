"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Notice, Pill, StatusPill } from "@/components/pill";
import { TEAM_MEMBERS, useCase } from "@/lib/case-store";
import { NCCO, type Task } from "@/lib/data";

export function TeamWorkspace() {
  const { pos } = useCase();
  return pos === "Team Lead" ? <TeamLeadBoard /> : <SpecialistView />;
}

function TeamLeadBoard() {
  const { s, dispatch, team } = useCase();
  const tasks = s.sc.tasks.filter((t) => t.approved && t.team === team && t.status !== "draft");
  const members = TEAM_MEMBERS[team];
  const items = members.map((m) => ({ value: m, label: m }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Team Lead board <Pill tone="teal">{team}</Pill>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The lead assigns each incoming task to a named member, who then owns it. A task can be returned to the NCCO with a reason.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Incoming and active tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!tasks.length && <p className="text-sm text-muted-foreground">Nothing here yet. Approve tasks and send them from the NCCO Workbench.</p>}
          {tasks.map((t) => (
            <div key={t.id} className="rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <b>
                  {s.sc.caseId} {"–"} Task {t.id}: {t.title}
                </b>
                <StatusPill task={t} />
              </div>
              <p className="my-2 text-xs text-muted-foreground">
                Handoff Pack: {t.fields.map((f) => `${f.label}: ${f.val}`).join(" · ")}
              </p>
              <p>
                Continuity owner (NCCO): <b>{NCCO}</b> {"·"} Priority: {t.priority}
              </p>
              {t.status === "queued" && (
                <div className="mt-2 flex items-center gap-2">
                  <span>Assign to</span>
                  <Select items={items} onValueChange={(v) => v && dispatch({ type: "assign", id: t.id, who: String(v) })}>
                    <SelectTrigger size="sm" className="min-w-40">
                      <SelectValue placeholder="choose member" />
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
              {t.assignee && (
                <p className="mt-2">
                  Owner of this task: <b>{t.assignee}</b>{" "}
                  <span className="text-muted-foreground">(switch Position to {"“"}Specialist: {t.assignee}{"”"} to work on it)</span>
                </p>
              )}
              {t.status === "scheduled" && <p className="mt-2 text-muted-foreground">Waiting for Task {t.after} to be resolved.</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Team load <span className="text-xs font-normal text-muted-foreground">illustrative</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {members.map((m) => {
            const busy = s.sc.tasks.some((t) => t.assignee === m && t.status !== "resolved");
            return (
              <div key={m} className="flex items-center gap-2">
                <span className="w-36">{m}</span>
                <div className="h-3 flex-1 overflow-hidden rounded bg-muted">
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            My tasks <Pill tone="teal">{pos}</Pill>
            <Pill>{team}</Pill>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Do the specialist work. If something is missing, raise an Info Request. It goes to the NCCO, who contacts the customer. You never message the customer yourself.
        </CardContent>
      </Card>
      {!tasks.length && (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            No tasks assigned to {pos} yet. The team lead assigns tasks from the Team Lead position.
          </CardContent>
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
  const [open, setOpen] = useState(false);
  const [field, setField] = useState("");
  const [why, setWhy] = useState("");
  const [note, setNote] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {s.sc.caseId} {"–"} Task {t.id}: {t.title} <StatusPill task={t} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>
          Assigned to <b>{t.assignee}</b> {"·"} Customer contact: via <b>{NCCO}</b> (NCCO)
        </p>
        <div>
          <div className="mb-1 font-semibold">Handoff Pack (already complete, no need to ask the customer)</div>
          {t.fields.map((f) => (
            <div key={f.k} className="flex flex-wrap items-center gap-2 border-b border-dashed py-1">
              <span className="min-w-40 font-medium">{f.label}</span>
              <span className="text-green-700 dark:text-green-400">{"✓"} {f.val}</span>
            </div>
          ))}
        </div>
        {t.status === "waiting" && t.req && <Notice tone="amber">Waiting on the customer via {NCCO}: {t.req.field}</Notice>}
        {t.status === "assigned" && (
          <>
            <Button variant="outline" onClick={() => setOpen((o) => !o)}>
              Request more information
            </Button>
            {open && (
              <Notice tone="blue">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label>What is missing?</Label>
                    <Input value={field} onChange={(e) => setField(e.target.value)} placeholder="e.g. preferred time for site visit" />
                  </div>
                  <div className="space-y-1">
                    <Label>Why is it needed?</Label>
                    <Input value={why} onChange={(e) => setWhy(e.target.value)} placeholder="optional" />
                  </div>
                  <Button
                    onClick={() => {
                      if (!field.trim()) return;
                      dispatch({ type: "raise", id: t.id, field: field.trim(), why: why.trim() });
                      setOpen(false);
                      setField("");
                      setWhy("");
                    }}
                  >
                    Send to {NCCO}{"’"}s inbox
                  </Button>
                </div>
              </Notice>
            )}
            <div className="space-y-1">
              <Label>Finish</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Outcome note (what was done)" />
              <Button className="bg-teal-700 text-white hover:bg-teal-800" onClick={() => dispatch({ type: "resolve", id: t.id, note: note.trim() })}>
                Mark resolved
              </Button>
            </div>
          </>
        )}
        {t.status === "resolved" && <Notice tone="green">Resolved: {t.note}</Notice>}
      </CardContent>
    </Card>
  );
}
