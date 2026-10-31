"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Notice, Pill } from "@/components/pill";
import { useCase } from "@/lib/case-store";
import { NCCO, OWNER_CHANGE_ROWS } from "@/lib/data";

const KPIS = [
  ["Cases with 1+ owner change", "38%"],
  ["Repeat contact", "29%"],
  ["SLA met", "55%"],
  ["Elapsed time spent waiting", "76%"],
];

export function SupervisorView() {
  const { s } = useCase();
  const requests = s.sc.tasks.filter((t) => t.req).length;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Supervisor view <Pill>baseline from 480-case sample</Pill>
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
          <CardTitle>Why ownership matters</CardTitle>
        </CardHeader>
        <CardContent>
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
          <p className="mt-2 text-xs text-muted-foreground">
            Source: Service Request Data.csv. Correlation, not proven cause. Only 21 cases have 3 or more owner changes.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live pilot measures</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Measure</TableHead>
                <TableHead>Baseline</TableHead>
                <TableHead>This demo case</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Owner changes for the NCCO</TableCell>
                <TableCell>38% of cases have 1+</TableCell>
                <TableCell>0 ({NCCO} throughout)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Customer asked to repeat information</TableCell>
                <TableCell>55 of 120 feedback responses</TableCell>
                <TableCell>{s.askedOnce ? "All missing items asked once, together" : "0"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Info requests raised</TableCell>
                <TableCell>n/a</TableCell>
                <TableCell>{requests}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Open cases per NCCO (capacity risk)</TableCell>
                <TableCell>to be set in pilot</TableCell>
                <TableCell>1 (demo)</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Notice tone="amber" className="mt-3">
            <b>Capacity risk:</b> every case stays with a Customer Service person until close. Cap open cases per NCCO and watch overtime (the workload sample shows Customer Service already near 48 overtime hours a week).
          </Notice>
        </CardContent>
      </Card>
    </div>
  );
}
