// Pure heuristic spam/low-quality comment detection. Runs entirely client-side, no network needed.

export interface SpamCheckResult {
  isSpam: boolean;
  reason?: string;
}

const SPAM_KEYWORDS = [
  'http://', 'https://', 'www.', '.com', '.net', 'buy now', 'click here',
  'free money', 'subscribe', 'follow me', 'discount code', 'promo code',
  'crypto', 'bitcoin', 'forex', 'nft drop', 'onlyfans',
];

const LOW_EFFORT_PATTERNS = [/^(good|nice|ok|cool|meh|bad)\.?!?$/i, /^test\.?$/i, /^asdf+$/i];

function hasExcessiveRepeatedChars(text: string): boolean {
  return /(.)\1{5,}/.test(text); // e.g. "soooooooo" or "!!!!!!!"
}

function isAllCapsShout(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  return letters.length > 8 && letters === letters.toUpperCase();
}

export function checkSpam(comment: string | undefined | null, qualityStars: number): SpamCheckResult {
  if (!comment || comment.trim().length === 0) {
    return { isSpam: false };
  }

  const text = comment.trim();
  const lowerText = text.toLowerCase();

  const matchedKeyword = SPAM_KEYWORDS.find(k => lowerText.includes(k));
  if (matchedKeyword) {
    return { isSpam: true, reason: `Contains promotional/link content ("${matchedKeyword}")` };
  }

  if (LOW_EFFORT_PATTERNS.some(p => p.test(text))) {
    return { isSpam: true, reason: 'Low-effort comment with no useful beta or feedback' };
  }

  if (hasExcessiveRepeatedChars(text)) {
    return { isSpam: true, reason: 'Excessive repeated characters detected' };
  }

  if (isAllCapsShout(text)) {
    return { isSpam: true, reason: 'All-caps shouting detected' };
  }

  if (text.length > 3 && text.length < 6 && qualityStars === 5) {
    // Very short + perfect score combo is a common bot pattern, flag for review rather than hard block
    return { isSpam: false, reason: 'Short comment flagged for manual review' };
  }

  return { isSpam: false };
}
