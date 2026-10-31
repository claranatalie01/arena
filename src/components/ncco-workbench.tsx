"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Notice, Pill, StatusPill } from "@/components/pill";
import { approvedTasks, missingFields, packComplete, useCase, type Stage } from "@/lib/case-store";
import { CONF_THRESHOLD } from "@/lib/data";

type Step = "plan" | "send" | "working" | "close";

const STEPS: { key: Step; label: string }[] = [
  { key: "plan", label: "Plan" },
  { key: "send", label: "Send" },
  { key: "working", label: "Working" },
  { key: "close", label: "Close" },
];

const stageLabel: Record<Stage, string> = { planning: "Planning", active: "Teams working", closing: "Closing check", closed: "Closed" };
const defaultStep: Record<Stage, Step> = { planning: "plan", active: "working", closing: "close", closed: "close" };
const stepRank: Record<Step, number> = { plan: 0, send: 1, working: 2, close: 3 };
const stageRank: Record<Stage, number> = { planning: 0, active: 2, closing: 3, closed: 4 };

function Stepper({
  step,
  stage,
  reachable,
  openRequests,
  onPick,
}: {
  step: Step;
  stage: Stage;
  reachable: (k: Step) => boolean;
  openRequests: number;
  onPick: (s: Step) => void;
}) {
  const done = (k: Step) => stageRank[stage] > stepRank[k] || stepRank[k] < stepRank[step];
  return (
    <ol className="flex items-center gap-1 text-sm" aria-label="Case progress">
      {STEPS.map((st, i) => {
        const active = st.key === step;
        const isDone = done(st.key) && (!active || stage === "closed");
        return (
          <li key={st.key} className="flex flex-1 items-center gap-1">
            <button
              type="button"
              disabled={!reachable(st.key)}
              aria-current={active ? "step" : undefined}
              onClick={() => onPick(st.key)}
              className={`flex items-center gap-2 rounded-full px-2.5 py-1 transition-colors disabled:cursor-default ${
                active ? "bg-primary text-primary-foreground" : reachable(st.key) ? "hover:bg-muted" : "text-muted-foreground"
              }`}
            >
              <span
                className={`inline-flex size-5 items-center justify-center rounded-full text-[11px] font-bold ${
                  isDone ? "bg-green-600 text-white" : active ? "bg-primary-foreground/20" : "border"
                }`}
              >
                {isDone ? "✓" : i + 1}
              </span>
              <span className="font-medium">{st.label}</span>
              {st.key === "working" && openRequests > 0 && <span className="rounded-full bg-amber-500 px-1.5 text-[11px] font-semibold text-white">{openRequests}</span>}
            </button>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

function Footer({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-3">
      {hint && <span className="mr-auto text-xs text-muted-foreground">{hint}</span>}
      {children}
    </div>
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
  const openReqs = reqTasks.filter((t) => t.req?.status === "open").length;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<{ step: Step; at: Step } | null>(null);

  const current = defaultStep[s.stage];
  const reachable = (k: Step) => k === "plan" || (k === "send" && ap.length > 0) || (k === "working" && s.stage !== "planning") || (k === "close" && (s.stage === "closing" || s.stage === "closed"));
  // A manual pick only holds until the case moves to a new default step.
  const step = picked && picked.at === current && reachable(picked.step) ? picked.step : current;
  const go = (k: Step) => setPicked({ step: k, at: current });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-base font-semibold">Case {sc.caseId}</h2>
            <Pill>{sc.segment}</Pill>
            <Pill tone={s.stage === "closed" ? "green" : "blue"}>{stageLabel[s.stage]}</Pill>
            <span className="text-xs text-muted-foreground">
              {sc.category} {"·"} {sc.channel}
            </span>
          </div>
          <Stepper step={step} stage={s.stage} reachable={reachable} openRequests={openReqs} onPick={go} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer said</div>
          {sc.wording.map((w) => (
            <blockquote key={w} className="border-l-2 pl-3 text-sm">
              {"“"}
              {w}
              {"”"}
            </blockquote>
          ))}
        </CardContent>
      </Card>

      {step === "plan" && (
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <h3 className="font-semibold">Review the task plan</h3>
              <span className="text-xs text-muted-foreground">AI suggestion (simulated)</span>
            </div>
            {sc.tasks.map((t) => {
              const low = t.conf < CONF_THRESHOLD;
              const depItems = [{ value: "none", label: "no dependency" }, ...sc.tasks.filter((x) => x.id !== t.id).map((x) => ({ value: x.id, label: `Task ${x.id}` }))];
              return (
                <div key={t.id} className={`rounded-lg border p-3 ${low || t.risk ? "border-amber-400" : ""}`}>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <b>
                      {t.id}. {t.title}
                    </b>
                    {t.priority === "High" && <Pill tone="red">High priority</Pill>}
                    <span className="ml-auto flex items-center gap-2 text-xs">
                      <span>
                        {"→"} <b>{t.team}</b>
                      </span>
                      {low ? <Pill tone="amber">{Math.round(t.conf * 100)}% · check team</Pill> : <span className="text-muted-foreground">{Math.round(t.conf * 100)}%</span>}
                    </span>
                  </div>
                  {t.risk && <Notice tone="amber">{t.risk}</Notice>}
                  <details className="mt-1 text-xs text-muted-foreground">
                    <summary className="w-fit cursor-pointer select-none hover:text-foreground">Why this team?</summary>
                    <p className="mt-1">{t.why}</p>
                  </details>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button size="sm" variant={t.approved ? "outline" : "default"} disabled={locked} onClick={() => dispatch({ type: "approve", id: t.id })}>
                      {t.approved ? "Approved ✓" : "Approve"}
                    </Button>
                    {t.approved && sc.tasks.length > 1 && t.id !== "A" && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        Start after
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
                    {t.status !== "draft" && <StatusPill task={t} />}
                  </div>
                </div>
              );
            })}
            <Footer hint={ap.length === 0 ? "Approve at least one task to continue." : `${ap.length} of ${sc.tasks.length} approved`}>
              <Button disabled={ap.length === 0} onClick={() => go("send")}>
                Continue to handoff
              </Button>
            </Footer>
          </CardContent>
        </Card>
      )}

      {step === "send" && (
        <Card>
          <CardContent className="space-y-3">
            <h3 className="font-semibold">Check the handoff</h3>
            {ap.map((t) => {
              const miss = missingFields(t);
              return (
                <div key={t.id} className="text-sm">
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    {t.id}. {t.title} {"→"} {t.team}
                    {miss.length === 0 ? <Pill tone="green">complete</Pill> : <Pill tone="red">{miss.length} missing</Pill>}
                  </div>
                  <div className="mt-1 grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
                    {t.fields.map((f) => (
                      <div key={f.k} className="flex gap-2 text-xs">
                        <span className="text-muted-foreground">{f.label}</span>
                        {f.val ? <span className="text-green-700 dark:text-green-400">{"✓"} {f.val}</span> : <span className="font-semibold text-red-600 dark:text-red-400">{"✗"} missing</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {!locked && missAll.length > 0 && (
              <Notice tone="blue">
                <b>Ask the customer once</b>
                <div className="mt-2 space-y-2">
                  {missAll.map(({ t, f }) => {
                    const key = `${t.id}|${f.k}`;
                    return (
                      <div key={key} className="flex flex-wrap items-center gap-2">
                        <Label className="min-w-48">
                          {t.id} {"–"} {f.label}
                        </Label>
                        <Input
                          className="max-w-72 bg-background"
                          placeholder="Customer's answer"
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
                    Record answers
                  </Button>
                </div>
              </Notice>
            )}
            <Footer hint={locked ? "Already sent." : allPack ? undefined : `${missAll.length} item${missAll.length === 1 ? "" : "s"} still missing`}>
              <Button variant="outline" disabled={locked} onClick={() => go("plan")}>
                Back
              </Button>
              <Button
                className="bg-teal-700 text-white hover:bg-teal-800"
                disabled={locked || !allPack}
                onClick={() => {
                  setPicked(null);
                  dispatch({ type: "send" });
                }}
              >
                Send to teams
              </Button>
            </Footer>
          </CardContent>
        </Card>
      )}

      {step === "working" && (
        <Card>
          <CardContent className="space-y-3">
            <h3 className="font-semibold">Teams are working</h3>
            <ul className="divide-y text-sm">
              {ap.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center gap-2 py-2">
                  <b>
                    {t.id}. {t.title}
                  </b>
                  <span className="text-xs text-muted-foreground">
                    {t.team}
                    {t.assignee ? ` · ${t.assignee}` : ""}
                  </span>
                  <span className="ml-auto">
                    <StatusPill task={t} />
                  </span>
                </li>
              ))}
            </ul>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Questions from teams {openReqs > 0 && <Pill tone="amber">{openReqs} open</Pill>}</h4>
              {!reqTasks.length && <p className="text-sm text-muted-foreground">None yet.</p>}
              {reqTasks.map((t) => (
                <div key={t.id} className={`rounded-lg border p-3 text-sm ${t.req?.status === "open" ? "border-amber-400" : ""}`}>
                  <div>
                    <b>
                      {t.id}. {t.team}
                      {t.assignee ? ` (${t.assignee})` : ""}
                    </b>{" "}
                    needs <b>{t.req!.field}</b>
                  </div>
                  <div className="text-xs text-muted-foreground">{t.req!.why}</div>
                  {t.req!.status === "open" ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Input
                        className="max-w-64"
                        placeholder="Customer's answer"
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
                        Log answer
                      </Button>
                    </div>
                  ) : (
                    <Notice tone="green">Answered: {t.req!.answer}</Notice>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === "close" && (
        <Card>
          <CardContent className="space-y-3">
            <h3 className="font-semibold">Close the case</h3>
            {s.stage === "closed" ? (
              <Notice tone="green">Case closed.</Notice>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">All tasks are resolved. Confirm the customer{"’"}s outcome before closing.</p>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={s.closeOk} onCheckedChange={(c) => dispatch({ type: "setCloseOk", value: c === true })} />
                  I confirmed the outcome with the customer
                </label>
                <Footer>
                  <Button className="bg-teal-700 text-white hover:bg-teal-800" disabled={!s.closeOk} onClick={() => dispatch({ type: "close" })}>
                    Close case
                  </Button>
                </Footer>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
