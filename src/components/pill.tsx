import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/data";

export type Tone = "muted" | "teal" | "amber" | "red" | "blue" | "green";

const pillTone: Record<Tone, string> = {
  muted: "",
  teal: "border-transparent bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  amber: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  red: "border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  blue: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  green: "border-transparent bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
};

const noticeTone: Record<Exclude<Tone, "muted" | "teal" | "red">, string> = {
  amber: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
  blue: "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200",
  green: "border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/60 dark:text-green-200",
};

export function Pill({
  tone = "muted",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Badge variant="outline" className={cn(pillTone[tone], className)}>
      {children}
    </Badge>
  );
}

export function Notice({
  tone,
  children,
  className,
}: {
  tone: keyof typeof noticeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Alert className={cn("my-2", noticeTone[tone], className)}>
      <div className="text-sm">{children}</div>
    </Alert>
  );
}

export function StatusPill({ task }: { task: Task }) {
  const map: Record<Task["status"], [string, Tone]> = {
    draft: ["Draft", "muted"],
    queued: ["In team queue", "blue"],
    scheduled: [`Starts after ${task.after}`, "amber"],
    assigned: ["In progress", "teal"],
    waiting: ["Waiting on customer", "amber"],
    resolved: ["Resolved", "green"],
  };
  const [label, tone] = map[task.status];
  return <Pill tone={tone}>{label}</Pill>;
}
