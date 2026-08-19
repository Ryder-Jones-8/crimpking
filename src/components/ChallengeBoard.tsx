'use client';

import { useMemo, useState } from 'react';
import { Clock3, Trophy, Zap, ArrowUpRight } from 'lucide-react';
import { DataRepository } from '@/lib/db/repository';
import { ChallengeType, LeaderboardEntry } from '@/types';

interface ChallengeBoardProps {
  climbId: string;
  climbName: string;
  gymName: string;
  initialSpeedBoard: LeaderboardEntry[];
  initialFewestHoldsBoard: LeaderboardEntry[];
}

const MODE_CONFIG: Record<ChallengeType, { label: string; description: string; unit: string; accent: string; icon: typeof Clock3 }> = {
  speed: {
    label: 'Speed Run',
    description: 'Fastest completion time',
    unit: 'sec',
    accent: 'text-emerald-400',
    icon: Clock3,
  },
  fewest_holds: {
    label: 'Fewest Holds',
    description: 'Least holds used',
    unit: 'holds',
    accent: 'text-violet-400',
    icon: Zap,
  },
};

export default function ChallengeBoard({
  climbId,
  climbName,
  gymName,
  initialSpeedBoard,
  initialFewestHoldsBoard,
}: ChallengeBoardProps) {
  const [mode, setMode] = useState<ChallengeType>('speed');
  const [value, setValue] = useState<number>(30);
  const [userName, setUserName] = useState('Guest Climber');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(
    mode === 'speed' ? initialSpeedBoard : initialFewestHoldsBoard,
  );

  const activeConfig = MODE_CONFIG[mode];
  const Icon = activeConfig.icon;

  const isLowerBetter = useMemo(() => mode === 'speed' || mode === 'fewest_holds', [mode]);

  const handleModeChange = (nextMode: ChallengeType) => {
    setMode(nextMode);
    setValue(nextMode === 'speed' ? 30 : 12);
    setLeaderboard(nextMode === 'speed' ? initialSpeedBoard : initialFewestHoldsBoard);
  };

  const handleSubmit = async () => {
    if (!value || value <= 0) {
      setError('Please enter a valid score.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const newAttempt = await DataRepository.submitChallengeAttempt({
        climb_id: climbId,
        user_display_name: userName.trim() || 'Guest Climber',
        challenge_type: mode,
        value,
      });

      const upcoming = await DataRepository.getChallengeLeaderboard(climbId, mode);
      setLeaderboard(upcoming);
      setValue(mode === 'speed' ? 30 : 12);
      setUserName(newAttempt.user_display_name || 'Guest Climber');
    } catch (err) {
      setError('Something went wrong submitting your challenge attempt.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Competition</h3>
        </div>
        <span className="text-[11px] text-slate-500">{gymName}</span>
      </div>

      <div className="flex gap-2 mb-4">
        {(Object.entries(MODE_CONFIG) as [ChallengeType, typeof MODE_CONFIG[ChallengeType]][]).map(([key, config]) => {
          const isActive = mode === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleModeChange(key)}
              className={`flex-1 rounded-xl border px-3 py-2 text-left transition ${
                isActive
                  ? 'border-emerald-500/60 bg-emerald-500/10 text-white'
                  : 'border-slate-700 bg-slate-950/40 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <config.icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="text-[11px] font-bold uppercase tracking-wide">{config.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-slate-300">
            <Icon className={`w-4 h-4 ${activeConfig.accent}`} />
            <span className="text-sm font-semibold">{climbName}</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
            {isLowerBetter ? 'Lower is better' : 'Higher is better'}
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
          <input
            type="number"
            min={1}
            value={value}
            onChange={e => setValue(Number(e.target.value) || 0)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
            aria-label={`${activeConfig.label} value`}
          />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{activeConfig.unit}</span>
        </div>

        <input
          type="text"
          value={userName}
          onChange={e => setUserName(e.target.value)}
          placeholder="Your name"
          className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
        />

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="mt-3 w-full rounded-xl bg-emerald-500 text-slate-950 font-black text-sm py-2.5 disabled:opacity-60"
        >
          {isSubmitting ? 'Submitting...' : `Log ${activeConfig.label}`}
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Leaderboard</h4>
          <span className="text-[10px] text-slate-500">Top 10</span>
        </div>

        {leaderboard.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No attempts yet. Set the pace.</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map(entry => (
              <div
                key={`${entry.user_display_name}-${entry.value}-${entry.rank}`}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/45 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-black text-emerald-400">
                    #{entry.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">{entry.user_display_name}</p>
                    <p className="text-[10px] text-slate-500">{entry.gym_name || gymName}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-black text-emerald-400">{entry.value}</p>
                  <p className="text-[10px] text-slate-500">{activeConfig.unit}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
