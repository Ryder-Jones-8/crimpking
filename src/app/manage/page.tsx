import { Mountain } from "lucide-react";
import GymManager from "@/components/GymManager";
import ManageAccessGate from "@/components/ManageAccessGate";

export default function ManagePage() {
  return (
    <main className="bg-slate-950 min-h-full">
      <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-lg border-b border-slate-800 px-4 py-3.5 flex items-center gap-2">
        <Mountain className="w-5 h-5 text-emerald-400" />
        <span className="font-display font-semibold text-base tracking-wide uppercase">Manage</span>
      </header>

      <div className="px-4 py-5">
        <ManageAccessGate>
          <GymManager />
        </ManageAccessGate>
      </div>
    </main>
  );
}
