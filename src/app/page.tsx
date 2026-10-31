import { Dashboard } from "@/components/dashboard";
import { CaseProvider } from "@/lib/case-store";

export default function Home() {
  return (
    <CaseProvider>
      <Dashboard />
    </CaseProvider>
  );
}
