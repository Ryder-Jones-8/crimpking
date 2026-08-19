'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ComparativeRating } from '@/types';
import { DataRepository } from '@/lib/db/repository';
import { Star, Camera, X, Loader2, ArrowDown, Equal, ArrowUp } from 'lucide-react';

interface RatingFormProps {
  climbId: string;
  climbGrade: string;
}

const COMPARATIVE_OPTIONS: { value: ComparativeRating; label: string; icon: React.ReactNode; hint: string }[] = [
  { value: 'easier', label: 'Easier than graded', icon: <ArrowDown className="w-4 h-4" />, hint: 'Felt soft' },
  { value: 'as_graded', label: 'As graded', icon: <Equal className="w-4 h-4" />, hint: 'Spot on' },
  { value: 'harder', label: 'Harder than graded', icon: <ArrowUp className="w-4 h-4" />, hint: 'Felt stiff' },
];

export default function RatingForm({ climbId, climbGrade }: RatingFormProps) {
  const router = useRouter();
  const [comparative, setComparative] = useState<ComparativeRating>('as_graded');
  const [stars, setStars] = useState<number>(0);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (stars === 0) {
      setError('Please rate the quality (1-5 stars).');
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        photoUrl = await DataRepository.uploadRatingPhoto(photoFile);
      }

      await DataRepository.submitRating({
        climb_id: climbId,
        comparative_rating: comparative,
        quality_stars: stars,
        comment: comment.trim() || undefined,
        photo_url: photoUrl,
      });

      setSubmitted(true);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError('Something went wrong submitting your rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center">
        <p className="text-emerald-400 font-bold text-lg">Thanks for the beta! 🧗</p>
        <p className="text-slate-300 text-sm mt-1">Your rating helps normalize grades across gyms.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 text-xs font-semibold text-emerald-400 hover:underline"
        >
          Submit another rating
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
      <h3 className="font-bold text-slate-100">Rate this climb</h3>

      {/* Comparative Rating */}
      <div>
        <label className="text-xs font-semibold text-slate-300 mb-2 block">
          Compared to the gym&apos;s stated grade ({climbGrade}), how did it feel?
        </label>
        <div className="grid grid-cols-3 gap-2">
          {COMPARATIVE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setComparative(opt.value)}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-xs font-semibold transition ${
                comparative === opt.value
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
              }`}
            >
              {opt.icon}
              <span className="text-center leading-tight">{opt.label}</span>
              <span className="text-[10px] opacity-70">{opt.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quality Stars */}
      <div>
        <label className="text-xs font-semibold text-slate-300 mb-2 block">Quality rating</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setStars(n)}
              onMouseEnter={() => setHoverStars(n)}
              onMouseLeave={() => setHoverStars(0)}
              className="p-0.5"
            >
              <Star
                className={`w-7 h-7 transition ${
                  (hoverStars || stars) >= n
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-700'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="text-xs font-semibold text-slate-300 mb-2 block">
          Comment / beta (optional)
        </label>
        <textarea
          rows={3}
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="e.g. Crux is the pinch move to the black volume, watch your feet..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Photo Upload */}
      <div>
        <label className="text-xs font-semibold text-slate-300 mb-2 block">Add a photo (optional)</label>
        {photoPreview ? (
          <div className="relative w-32 h-32">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoPreview} alt="Preview" className="w-32 h-32 object-cover rounded-xl border border-slate-700" />
            <button
              type="button"
              onClick={() => { setPhotoFile(null); setPhotoPreview(''); }}
              className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 w-fit bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 cursor-pointer transition">
            <Camera className="w-4 h-4" />
            Take / Upload Photo
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
          </label>
        )}
      </div>

      {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {submitting ? 'Submitting...' : 'Submit Rating'}
      </button>
    </form>
  );
}
