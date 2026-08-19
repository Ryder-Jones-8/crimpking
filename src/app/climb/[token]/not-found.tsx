import Link from "next/link";
import { Mountain, ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-full bg-slate-950 flex items-center justify-center px-5 py-16">
      <div className="text-center space-y-4 max-w-sm">
        <Compass className="w-12 h-12 text-slate-700 mx-auto" />
        <h1 className="text-xl font-bold text-slate-100">Climb not found</h1>
        <p className="text-sm text-slate-400">
          This QR code doesn&apos;t match an active climb. It may have been stripped or reset by the gym.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-sm hover:underline"
        >
          <Mountain className="w-4 h-4" /> Back to SendCheck
        </Link>
      </div>
    </main>
  );
}
