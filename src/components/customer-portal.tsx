"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Notice } from "@/components/pill";
import { approvedTasks, useCase } from "@/lib/case-store";
import { NCCO, type Task } from "@/lib/data";

function customerText(t: Task) {
  return {
    draft: "Being prepared",
    queued: "Waiting for the team",
    scheduled: `Starts after task ${t.after}`,
    assigned: "In progress",
    waiting: "We need one detail from you",
    resolved: "Done",
  }[t.status];
}

const dotColor: Record<Task["status"], string> = {
  draft: "bg-muted-foreground/30",
  scheduled: "bg-muted-foreground/30",
  queued: "bg-blue-500",
  assigned: "bg-blue-500",
  waiting: "bg-amber-500",
  resolved: "bg-green-600",
};

export function CustomerPortal() {
  const { s, dispatch } = useCase();
  const ap = approvedTasks(s);
  const waiting = ap.find((t) => t.status === "waiting");
  const done = ap.filter((t) => t.status === "resolved").length;

  const head =
    s.stage === "closed" ? "Completed"
    : s.stage === "closing" ? "Final check in progress"
    : s.stage === "planning" ? "We're confirming a few details"
    : waiting ? "One detail needed from you"
    : `${done} of ${ap.length} tasks done`;
  const next =
    s.stage === "closed" ? `Nothing further. Contact ${NCCO} if anything is not right.`
    : s.stage === "closing" ? `${NCCO} will confirm with you by 17:00.`
    : waiting ? `${NCCO} will contact you about: ${waiting.req?.field}`
    : s.stage === "planning" ? "Nothing needed from you right now."
    : "The teams are working on it.";
  const shown = ap.length ? ap : s.sc.tasks;
  const latest = s.msgs.at(-1);
  const earlier = s.msgs.slice(0, -1);

  return (
    <div className="mx-auto max-w-md">
      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="bg-slate-900 px-4 py-4 text-white">
          <div className="text-xs opacity-75">HarbourNova</div>
          <div className="text-lg font-semibold">Track your request</div>
        </div>
        <div className="space-y-4 p-4 text-sm">
          {!s.verified ? (
            <>
              <p className="text-xs text-muted-foreground">We{"’"}ll send a one-time code to your registered contact.</p>
              <Input aria-label="Case number" value={s.sc.caseId} readOnly />
              <Input aria-label="One-time code" value={"• • • • • •"} readOnly />
              <Button className="w-full" onClick={() => dispatch({ type: "verify" })}>
                Verify and view status
              </Button>
            </>
          ) : (
            <>
              <div>
                <div className="text-xs text-muted-foreground">Case {s.sc.caseId}</div>
                <div className="text-xl font-semibold">{head}</div>
                {ap.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={(done / ap.length) * 100} className="flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {done} of {ap.length}
                    </span>
                  </div>
                )}
              </div>

              <Notice tone={waiting ? "amber" : "blue"} className="my-0">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white" aria-hidden>
                    {NCCO.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <div className="font-medium">{next}</div>
                    <div className="text-xs opacity-80">
                      Your contact: {NCCO}
                      {s.stage !== "closed" && " · next update by 17:00 today"}
                    </div>
                  </div>
                </div>
              </Notice>

              <ul className="divide-y">
                {shown.map((t) => (
                  <li key={t.id} className="flex gap-3 py-2">
                    <span className={`mt-1.5 size-3 shrink-0 rounded-full ${dotColor[t.status]}`} />
                    <div>
                      <b>{t.title}</b>
                      <div className="text-xs text-muted-foreground">{ap.length ? customerText(t) : "Being planned"}</div>
                    </div>
                  </li>
                ))}
              </ul>

              {latest && (
                <div className="space-y-2">
                  <div className="rounded-lg bg-muted p-2.5">
                    <div className="text-xs text-muted-foreground">
                      {latest.t}
                      {latest.auto ? " · automatic update" : ""}
                    </div>
                    {latest.text}
                  </div>
                  {earlier.length > 0 && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="w-fit cursor-pointer select-none hover:text-foreground">Earlier messages ({earlier.length})</summary>
                      <div className="mt-2 space-y-2 text-sm text-foreground">
                        {earlier.map((m, i) => (
                          <div key={i} className="rounded-lg bg-muted p-2.5">
                            <div className="text-xs text-muted-foreground">{m.t}</div>
                            {m.text}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
