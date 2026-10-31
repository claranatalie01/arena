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
    queued: "Waiting for the team to pick it up",
    scheduled: `Starts once Task ${t.after} is done`,
    assigned: "In progress with a named team member",
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
    : s.stage === "closing" ? `Final check with ${NCCO}`
    : s.stage === "planning" ? `${NCCO} is confirming a few details with you`
    : waiting ? "One detail needed from you"
    : `${done} of ${ap.length} tasks done`;
  const next =
    s.stage === "closed" ? `Nothing further. Contact ${NCCO} if anything is not right.`
    : s.stage === "closing" ? `${NCCO} will confirm with you by 17:00.`
    : waiting ? `${NCCO} will contact you about: ${waiting.req?.field}`
    : s.stage === "planning" ? `You do not need to do anything. ${NCCO} will contact you once.`
    : `The teams are working. ${NCCO} will update you by 17:00.`;
  const shown = ap.length ? ap : s.sc.tasks;

  return (
    <div className="mx-auto max-w-md">
      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="bg-slate-900 px-4 py-4 text-white">
          <div className="text-xs opacity-75">HarbourNova customer portal</div>
          <div className="text-lg font-semibold">Track your request</div>
        </div>
        <div className="space-y-3 p-4 text-sm">
          {!s.verified ? (
            <>
              <p className="text-xs text-muted-foreground">
                Enter your case number. We then send a one-time code to your registered contact. Case number alone is never enough.
              </p>
              <Input value={s.sc.caseId} readOnly />
              <Input value={"• • • • • •"} readOnly />
              <Button className="w-full" onClick={() => dispatch({ type: "verify" })}>
                Verify and view status
              </Button>
            </>
          ) : (
            <>
              <div className="text-xs text-muted-foreground">Case {s.sc.caseId}</div>
              <div className="text-lg font-semibold">{head}</div>
              {ap.length > 0 && <Progress value={(done / ap.length) * 100} />}
              <Notice tone={waiting ? "amber" : "blue"}>
                <div>
                  <b>Your contact:</b> {NCCO}, Customer Service (stays the same until complete)
                </div>
                <div>
                  <b>Next step:</b> {next}
                </div>
                <div>
                  <b>Next update:</b> {s.stage === "closed" ? "—" : "by 17:00 today"}
                </div>
              </Notice>
              <div className="font-semibold">Progress</div>
              <ul className="divide-y">
                {shown.map((t) => (
                  <li key={t.id} className="flex gap-3 py-2">
                    <span className={`mt-1.5 size-3 shrink-0 rounded-full ${dotColor[t.status]}`} />
                    <div>
                      <b>{t.title}</b>
                      <div className="text-xs text-muted-foreground">
                        {t.team} {"·"} {ap.length ? customerText(t) : "Being planned"}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="font-semibold">Messages from {NCCO}</div>
              {s.msgs.length ? (
                s.msgs.map((m, i) => (
                  <div key={i} className="rounded-lg bg-muted p-2">
                    <div className="text-xs text-muted-foreground">
                      {m.t} {"·"} from {NCCO}
                      {m.auto ? " (automatic update)" : ""}
                    </div>
                    {m.text}
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground">No messages yet.</div>
              )}
            </>
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">Shows owner and next step, never internal notes. All updates come through the NCCO.</p>
    </div>
  );
}
