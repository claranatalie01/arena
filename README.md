# HarbourNova Case Card

Clickable mockup for the GBAITA Innovation Arena HarbourNova challenge (Approach B, technology and systems). It shows one accountable case owner (the NCCO), a complete Handoff Pack before routing, and a customer tracker that shows owner and next step. Synthetic data only. The AI output is simulated and no model is called.

Built with Next.js (App Router), TypeScript, Tailwind CSS v4 and shadcn/ui.

## Run it

Requires Node.js 20 or later.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

```bash
npm run build   # production build
npm run lint
```

## Roles

Use the **Role** dropdown in the header.

| Role | What it shows |
|---|---|
| NCCO Workbench (Customer Service) | AI task plan the NCCO approves, Handoff Pack gate, one consolidated customer question, Info Request inbox, closing check |
| Team workspace | Pick a **Team** and a **Position**. Team Lead assigns tasks to members. A Specialist sees only their own tasks, can request more information (routed to the NCCO) or mark a task resolved |
| Customer portal | Verification step, owner, next step, next update time, task progress, messages |
| Supervisor | Baselines from the 480-case sample and the capacity risk |

Two demo scenarios are in the NCCO Workbench: a facility repair (HN-26-0135) and an exceptional refund that is flagged for human approval.

## Demo path

1. NCCO: approve both tasks. Sending is blocked until the missing items are collected in one question.
2. Team workspace, Team Lead: assign a task to a member.
3. Team workspace, Specialist: raise an Info Request. It lands in the NCCO inbox, not with the customer.
4. NCCO: log the customer's answer. Then resolve the tasks as each specialist.
5. NCCO: confirm the closing check and close. Customer portal shows the result.

## Structure

- `src/lib/data.ts`: scenarios and baseline figures
- `src/lib/case-store.tsx`: case state, reducer and role selection
- `src/components/`: one component per role view, plus `ui/` for shadcn components

## Assumptions to validate

The 0.75 routing-confidence threshold, the required-field lists per task type, names and times are placeholders. Baseline figures (for example 38% of cases with 1 or more owner changes) come from the 480-case sample and show correlation, not proven cause.

`legacy-static-mockup/index.html` is the earlier single-file version.
