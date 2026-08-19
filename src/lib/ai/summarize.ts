// Comment digest summarization. Uses OpenAI when OPENAI_API_KEY is configured (server-side only),
// otherwise falls back to a local keyword-frequency heuristic so the feature works offline.

const THEME_KEYWORDS: Record<string, string[]> = {
  'beta-dependent / crux move': ['crux', 'beta', 'crimp', 'sloper', 'pinch', 'heel hook', 'dyno', 'match'],
  'grading feels stiff / hard': ['stiff', 'hard', 'harder', 'sandbag', 'sandbagged', 'tough'],
  'grading feels soft / easy': ['soft', 'easy', 'easier', 'generous'],
  'morpho / height-dependent': ['morpho', 'tall', 'short climbers', 'reach', 'height'],
  'fun / quality movement': ['fun', 'great', 'awesome', 'quality', 'love'],
  'technical footwork': ['footwork', 'smear', 'slab', 'balance', 'delicate', 'technical'],
};

function heuristicSummary(comments: string[]): string {
  if (comments.length === 0) {
    return 'No comments yet — be the first to leave beta for this climb.';
  }

  const themeCounts: Record<string, number> = {};
  for (const comment of comments) {
    const lower = comment.toLowerCase();
    for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
      if (keywords.some(kw => lower.includes(kw))) {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
      }
    }
  }

  const sortedThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([, count]) => count > 0)
    .slice(0, 2);

  if (sortedThemes.length === 0) {
    return `${comments.length} climber${comments.length === 1 ? '' : 's'} left feedback — check the comments below for details.`;
  }

  const parts = sortedThemes.map(([theme, count]) => {
    const plural = count === 1 ? 'One climber mentions' : `${count} climbers mention`;
    return `${plural} ${theme}`;
  });

  return parts.join('. ') + '.';
}

export async function summarizeComments(comments: string[]): Promise<string> {
  const cleanComments = comments.filter(c => c && c.trim().length > 0);
  if (cleanComments.length === 0) {
    return heuristicSummary([]);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return heuristicSummary(cleanComments);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You summarize climbing gym comment threads into a single short sentence (max 25 words) highlighting the most useful shared beta or grading consensus. Be concise and specific.',
          },
          {
            role: 'user',
            content: cleanComments.slice(0, 20).join('\n---\n'),
          },
        ],
        max_tokens: 60,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      return heuristicSummary(cleanComments);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || heuristicSummary(cleanComments);
  } catch {
    return heuristicSummary(cleanComments);
  }
}
