"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Notice, Pill, StatusPill } from "@/components/pill";
import {
  approvedTasks,
  missingFields,
  packComplete,
  useCase,
} from "@/lib/case-store";
import { CONF_THRESHOLD, NCCO, SCENARIOS, type ScenarioKey } from "@/lib/data";

const stageLabel = { planning: "Planning", active: "Teams working", closing: "Closing check", closed: "Closed" } as const;

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <CardTitle className="flex flex-wrap items-center gap-2">
      <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
        {n}
      </span>
      {children}
    </CardTitle>
  );
}

export function NccoWorkbench() {
  const { s, dispatch } = useCase();
  const { sc } = s;
  const locked = s.stage !== "planning";
  const ap = approvedTasks(s);
  const allPack = ap.length > 0 && ap.every(packComplete);
  const missAll = ap.flatMap((t) => missingFields(t).map((f) => ({ t, f })));
  const reqTasks = sc.tasks.filter((t) => t.req);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [replies, setReplies] = useState<Record<string, string>>({});
  const scenItems = (Object.keys(SCENARIOS) as ScenarioKey[]).map((k) => ({ value: k, label: SCENARIOS[k].label }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            Case {sc.caseId}
            <Pill>{sc.segment}</Pill>
            <Pill>{sc.channel}</Pill>
            <Pill>{sc.category}</Pill>
            <Pill>{sc.complexity} complexity</Pill>
            <Pill tone="teal">NCCO: {NCCO} (Customer Service)</Pill>
            <Pill tone={s.stage === "closed" ? "green" : "blue"}>{stageLabel[s.stage]}</Pill>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Demo scenario</span>
          <Select
            items={scenItems}
            value={s.scen}
            onValueChange={(v) => {
              if (v) {
                setAnswers({});
                setReplies({});
                dispatch({ type: "reset", scen: v as ScenarioKey });
              }
            }}
          >
            <SelectTrigger size="sm" className="min-w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scenItems.map((i) => (
                <SelectItem key={i.value} value={i.value}>
                  {i.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <StepTitle n={1}>Customer contact (original wording kept)</StepTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {sc.wording.map((w) => (
            <blockquote key={w} className="border-l-2 pl-3 text-muted-foreground">
              {"“"}
              {w}
              {"”"}
            </blockquote>
          ))}
          <p className="text-xs text-muted-foreground">
            {NCCO} becomes the NCCO at intake and stays the customer{"’"}s single contact until close, even when tasks move between teams.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <StepTitle n={2}>
            AI task plan <span className="text-xs font-normal italic text-muted-foreground">simulated output, no model call</span>
          </StepTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            AI splits the complaint into tasks and suggests a team for each. <b>The NCCO approves, edits or rejects.</b> Confidence below {CONF_THRESHOLD} is flagged for review.
          </p>
          {sc.tasks.map((t) => {
            const low = t.conf < CONF_THRESHOLD;
            const depItems = [{ value: "none", label: "no dependency" }, ...sc.tasks.filter((x) => x.id !== t.id).map((x) => ({ value: x.id, label: `Task ${x.id}` }))];
            return (
              <div key={t.id} className={`rounded-lg border p-3 ${low || t.risk ? "border-amber-400" : ""}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <b>
                      Task {t.id}: {t.title}
                    </b>
                    <Pill tone={t.priority === "High" ? "red" : "muted"}>{t.priority} priority</Pill>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span>
                      {"→"} <b>{t.team}</b>
                    </span>
                    <Progress value={t.conf * 100} className="w-20" />
                    <span>{t.conf.toFixed(2)}</span>
                  </div>
                </div>
                <p className="my-2 text-xs text-muted-foreground">Why: {t.why}</p>
                {t.risk && <Notice tone="amber">{t.risk}</Notice>}
                {low && !t.risk && <Notice tone="amber">Below threshold: NCCO to confirm this split and team before sending.</Notice>}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={t.approved ? "outline" : "default"}
                    disabled={locked}
                    onClick={() => dispatch({ type: "approve", id: t.id })}
                  >
                    {t.approved ? "Approved ✓ (click to undo)" : "Approve task"}
                  </Button>
                  {sc.tasks.length > 1 && t.id !== "A" && (
                    <div className="flex items-center gap-1 text-xs">
                      <span>Starts after</span>
                      <Select
                        items={depItems}
                        value={t.after ?? "none"}
                        disabled={locked}
                        onValueChange={(v) => v && dispatch({ type: "setAfter", id: t.id, after: v === "none" ? null : v })}
                      >
                        <SelectTrigger size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {depItems.map((i) => (
                            <SelectItem key={i.value} value={i.value}>
                              {i.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <StatusPill task={t} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <StepTitle n={3}>
            Handoff Pack <span className="text-xs font-normal text-muted-foreground">required fields must exist before routing</span>
          </StepTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!ap.length && <p className="text-muted-foreground">Approve at least one task above to check its Handoff Pack.</p>}
          {ap.map((t) => (
            <div key={t.id}>
              <div className="mb-1 flex items-center gap-2 font-semibold">
                Task {t.id} {"→"} {t.team}
                {packComplete(t) ? <Pill tone="green">complete</Pill> : <Pill tone="red">{missingFields(t).length} missing</Pill>}
              </div>
              {t.fields.map((f) => (
                <div key={f.k} className="flex flex-wrap items-center gap-2 border-b border-dashed py-1">
                  <span className="min-w-40 font-medium">{f.label}</span>
                  {f.val ? <span className="text-green-700 dark:text-green-400">{"✓"} {f.val}</span> : <span className="font-semibold text-red-600 dark:text-red-400">{"✗"} missing</span>}
                </div>
              ))}
            </div>
          ))}
          {!locked && missAll.length > 0 && (
            <Notice tone="blue">
              <b>Ask the customer once.</b> One consolidated question covers every missing item across all tasks.
              <div className="mt-2 space-y-2">
                {missAll.map(({ t, f }) => {
                  const key = `${t.id}|${f.k}`;
                  return (
                    <div key={key} className="flex flex-wrap items-center gap-2">
                      <Label className="min-w-56">
                        Task {t.id} {"–"} {f.label}
                      </Label>
                      <Input
                        className="max-w-72"
                        placeholder="enter the customer's answer"
                        value={answers[key] ?? ""}
                        onChange={(e) => setAnswers((a) => ({ ...a, [key]: e.target.value }))}
                      />
                    </div>
                  );
                })}
                <Button
                  onClick={() => {
                    dispatch({
                      type: "fill",
                      answers: Object.entries(answers).map(([key, val]) => {
                        const [id, k] = key.split("|");
                        return { id, k, val };
                      }),
                    });
                    setAnswers({});
                  }}
                >
                  Contact customer and record answers
                </Button>
              </div>
            </Notice>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button className="bg-teal-700 text-white hover:bg-teal-800" disabled={locked || !allPack} onClick={() => dispatch({ type: "send" })}>
              Send approved tasks to teams
            </Button>
            <span className="text-xs text-muted-foreground">
              {locked ? "Already sent." : allPack ? "Handoff Packs complete." : "Blocked until every approved task has a complete Handoff Pack. The customer is never sent back to retell."}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <StepTitle n={4}>
            Info Request inbox <span className="text-xs font-normal text-muted-foreground">specialists ask you, you ask the customer</span>
          </StepTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {!reqTasks.length && <p className="text-muted-foreground">No requests. Specialists never contact the customer directly. If they need more, it appears here.</p>}
          {reqTasks.map((t) => (
            <div key={t.id} className={`rounded-lg border p-3 ${t.req?.status === "open" ? "border-amber-400" : ""}`}>
              <div>
                <b>
                  Task {t.id} ({t.team}
                  {t.assignee ? `, ${t.assignee}` : ""})
                </b>{" "}
                needs: <b>{t.req!.field}</b>
              </div>
              <div className="text-xs text-muted-foreground">Reason: {t.req!.why}</div>
              {t.req!.status === "open" ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Input
                    className="max-w-64"
                    placeholder="customer's answer, then log it"
                    value={replies[t.id] ?? ""}
                    onChange={(e) => setReplies((r) => ({ ...r, [t.id]: e.target.value }))}
                  />
                  <Button
                    onClick={() => {
                      const v = (replies[t.id] ?? "").trim();
                      if (v) {
                        dispatch({ type: "answer", id: t.id, val: v });
                        setReplies((r) => ({ ...r, [t.id]: "" }));
                      }
                    }}
                  >
                    Contact customer and log answer
                  </Button>
                </div>
              ) : (
                <Notice tone="green">Answered: {t.req!.answer}. Returned to the task.</Notice>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <StepTitle n={5}>Closing check</StepTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {s.stage === "closed" && <Notice tone="green">Case closed.</Notice>}
          {s.stage === "closing" && (
            <div className="space-y-3">
              <Notice tone="blue">All tasks are resolved. Confirm the customer{"’"}s outcome before closing (internal completion and customer outcome can differ).</Notice>
              <label className="flex items-center gap-2">
                <Checkbox checked={s.closeOk} onCheckedChange={(c) => dispatch({ type: "setCloseOk", value: c === true })} />
                I confirmed the outcome with the customer
              </label>
              <Button className="bg-teal-700 text-white hover:bg-teal-800" disabled={!s.closeOk} onClick={() => dispatch({ type: "close" })}>
                Close case
              </Button>
            </div>
          )}
          {s.stage !== "closed" && s.stage !== "closing" && <p className="text-muted-foreground">Available when every approved task is marked resolved by its team.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
