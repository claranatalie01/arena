"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Notice, Pill } from "@/components/pill";
import { approvedTasks, useCase } from "@/lib/case-store";
import { NCCO, OWNER_CHANGE_ROWS } from "@/lib/data";

const KPIS = [
  ["Cases with 1+ owner change", "38%"],
  ["Repeat contact", "29%"],
  ["SLA met", "55%"],
  ["Time spent waiting", "76%"],
];

export function SupervisorView() {
  const { s } = useCase();
  const requests = s.sc.tasks.filter((t) => t.req).length;
  const open = approvedTasks(s).filter((t) => t.req?.status === "open");
  const unassigned = s.sc.tasks.filter((t) => t.approved && t.status === "queued");
  const attention = [
    ...open.map((t) => `Task ${t.id} (${t.title}) is waiting on the customer: ${t.req!.field}`),
    ...unassigned.map((t) => `Task ${t.id} (${t.title}) is in the ${t.team} queue with no owner`),
  ];

  const demo: [string, string, string][] = [
    ["Owner changes", `0 (${NCCO} throughout)`, "Baseline: 38% of cases have 1+"],
    ["Repeat information", s.askedOnce ? "Asked once, together" : "0", "Baseline: 55 of 120 responses"],
    ["Info requests raised", String(requests), ""],
    ["Open cases per NCCO", "1 (demo)", "Cap to be set in pilot"],
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            Today vs. baseline <Pill>480-case sample</Pill>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {KPIS.map(([label, v]) => (
            <div key={label} className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-2xl font-semibold">{v}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>This demo case</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {demo.map(([label, v, base]) => (
              <div key={label} className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-base font-semibold">{v}</div>
                {base && <div className="mt-1 text-xs text-muted-foreground">{base}</div>}
              </div>
            ))}
          </div>
          {attention.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing needs attention.</p>
          ) : (
            <Notice tone="amber" className="my-0">
              <b>Needs attention</b>
              <ul className="mt-1 list-disc pl-4">
                {attention.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </Notice>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <details className="text-sm">
            <summary className="w-fit cursor-pointer select-none font-medium">Why ownership matters</summary>
            <div className="mt-3 space-y-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Owner changes</TableHead>
                    <TableHead>Cases</TableHead>
                    <TableHead>Satisfaction</TableHead>
                    <TableHead>Repeat contact</TableHead>
                    <TableHead>SLA met</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {OWNER_CHANGE_ROWS.map((r) => (
                    <TableRow key={r.label}>
                      <TableCell>{r.label}</TableCell>
                      <TableCell>{r.cases}</TableCell>
                      <TableCell>{r.sat}</TableCell>
                      <TableCell>{r.repeat}</TableCell>
                      <TableCell>{r.sla}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground">
                Source: Service Request Data.csv. Correlation, not proven cause. Only 21 cases have 3 or more owner changes.
              </p>
              <Notice tone="amber" className="my-0">
                <b>Capacity risk:</b> every case stays with a Customer Service person until close. Cap open cases per NCCO and watch overtime (the workload sample shows Customer Service already near 48 overtime hours a week).
              </Notice>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
