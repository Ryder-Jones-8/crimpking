import Link from "next/link";
import { notFound } from "next/navigation";
import { DataRepository } from "@/lib/db/repository";
import { summarizeComments } from "@/lib/ai/summarize";
import RatingForm from "@/components/RatingForm";
import ChallengeBoard from "@/components/ChallengeBoard";
import { ChevronLeft, Star, MessageSquare, Sparkles, ShieldAlert } from "lucide-react";

export default async function ClimbDetailPage({ params }: { params: { token: string } }) {
  const climb = await DataRepository.getClimbByIdOrToken(params.token);
  if (!climb) {
    notFound();
  }

  const ratings = await DataRepository.getRatings(climb.id);
  const visibleRatings = ratings.filter(r => !r.is_spam);
  const flaggedCount = ratings.length - visibleRatings.length;

  const comments = visibleRatings.map(r => r.comment).filter((c): c is string => !!c && c.trim().length > 0);
  const summary = await summarizeComments(comments);

  const avgStars = visibleRatings.length > 0
    ? visibleRatings.reduce((acc, r) => acc + r.quality_stars, 0) / visibleRatings.length
    : 0;

  const harderCount = visibleRatings.filter(r => r.comparative_rating === 'harder').length;
  const easierCount = visibleRatings.filter(r => r.comparative_rating === 'easier').length;
  const asGradedCount = visibleRatings.filter(r => r.comparative_rating === 'as_graded').length;
  const speedLeaderboard = await DataRepository.getChallengeLeaderboard(climb.id, 'speed');
  const holdsLeaderboard = await DataRepository.getChallengeLeaderboard(climb.id, 'fewest_holds');

  return (
    <main className="bg-slate-950 min-h-full pb-8">
      <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-lg border-b border-slate-800 px-2 py-3 flex items-center gap-1">
        <Link href={`/gyms/${climb.gym_id}`} className="p-2 text-slate-300 active:text-white">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <span className="font-bold text-sm text-slate-200 truncate">{climb.name}</span>
      </header>

      <div className="px-4 py-5 space-y-5">
        {/* Climb Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-black rounded-full text-sm">
              {climb.gym_grade}
            </span>
            {climb.normalized_score !== undefined && (
              <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg font-medium">
                Community-normalized: <span className="text-emerald-400 font-bold">
                  {climb.normalized_score >= 0 ? `V${Math.round(climb.normalized_score)}` : 'VB'}
                </span>
              </span>
            )}
          </div>

          <h1 className="text-2xl font-black text-slate-100">{climb.name}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {climb.gym_name} • {climb.wall_name} • {climb.color} holds
          </p>

          {climb.setter_notes && (
            <p className="text-sm text-slate-300 bg-slate-800/60 rounded-xl p-3 mt-4 italic">
              &quot;{climb.setter_notes}&quot;
            </p>
          )}

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800 text-sm">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-slate-100">{avgStars > 0 ? avgStars.toFixed(1) : '—'}</span>
              <span className="text-slate-500 text-xs">({visibleRatings.length} ratings)</span>
            </div>
          </div>
        </div>

        {/* AI Comment Digest */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wide text-emerald-400">AI Comment Digest</h3>
          </div>
          <p className="text-sm text-slate-200">{summary}</p>
        </div>

        {/* Comparative Rating Breakdown */}
        {visibleRatings.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
              How the community rates this vs. {climb.gym_grade}
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Harder than graded', count: harderCount, color: 'bg-red-500' },
                { label: 'As graded', count: asGradedCount, color: 'bg-emerald-500' },
                { label: 'Easier than graded', count: easierCount, color: 'bg-blue-500' },
              ].map(row => {
                const pct = visibleRatings.length > 0 ? (row.count / visibleRatings.length) * 100 : 0;
                return (
                  <div key={row.label} className="flex items-center gap-3 text-xs">
                    <span className="w-32 text-slate-300 font-medium">{row.label}</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${row.color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-slate-400">{row.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rating Form */}
        <RatingForm climbId={climb.id} climbGrade={climb.gym_grade} />

        {/* Competitive Board */}
        <ChallengeBoard
          climbId={climb.id}
          climbName={climb.name}
          gymName={climb.gym_name || 'Gym'}
          initialSpeedBoard={speedLeaderboard}
          initialFewestHoldsBoard={holdsLeaderboard}
        />

        {/* Comments List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            Recent Ratings & Comments
          </h3>

          {flaggedCount > 0 && (
            <p className="text-[11px] text-amber-400/80 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              {flaggedCount} comment{flaggedCount === 1 ? '' : 's'} hidden by spam filter
            </p>
          )}

          {visibleRatings.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No ratings yet — be the first to rate this climb!</p>
          ) : (
            visibleRatings.map(rating => (
              <div key={rating.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < rating.quality_stars ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 capitalize">
                    {rating.comparative_rating.replace('_', ' ')}
                  </span>
                </div>
                {rating.comment && <p className="text-sm text-slate-300">{rating.comment}</p>}
                <p className="text-[11px] text-slate-500 mt-2">
                  {rating.user_display_name || 'Guest Climber'} • {new Date(rating.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
