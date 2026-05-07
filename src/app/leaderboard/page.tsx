import { createClient } from "@/lib/supabase/server";
import { Trophy } from "lucide-react";
import type { LeaderboardEntry } from "@/types/database";

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: predictions } = await supabase
    .from("predictions")
    .select("user_id, points, profiles(username)")
    .not("points", "is", null);

  const entryMap = new Map<string, LeaderboardEntry>();

  for (const p of predictions ?? []) {
    const userId = p.user_id;
    const username = (p.profiles as unknown as { username: string })?.username ?? "Unknown";
    const points = p.points ?? 0;

    const existing = entryMap.get(userId);
    if (existing) {
      existing.total_points += points;
      existing.total_predictions += 1;
      if (points === 3) existing.exact_scores += 1;
    } else {
      entryMap.set(userId, {
        user_id: userId,
        username,
        total_points: points,
        total_predictions: 1,
        exact_scores: points === 3 ? 1 : 0,
      });
    }
  }

  const leaderboard = Array.from(entryMap.values()).sort(
    (a, b) => b.total_points - a.total_points
  );

  const rankColors: Record<number, string> = {
    0: "#D4A843",
    1: "#A8A8A8",
    2: "#CD7F32",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="w-7 h-7 text-terracotta" />
        <h1 className="font-serif text-3xl text-near-black">Leaderboard</h1>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-stone text-lg">No predictions have been scored yet.</p>
        </div>
      ) : (
        <div className="space-y-0">
          <div className="hidden sm:grid grid-cols-[3rem_1fr_6rem_6rem_6rem] gap-4 px-4 py-3 text-sm text-stone font-medium">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">Points</span>
            <span className="text-right">Predictions</span>
            <span className="text-right">Exact</span>
          </div>

          {leaderboard.map((entry, index) => {
            const isCurrentUser = user?.id === entry.user_id;
            const borderColor = rankColors[index];

            return (
              <div
                key={entry.user_id}
                className={`grid grid-cols-[3rem_1fr_6rem] sm:grid-cols-[3rem_1fr_6rem_6rem_6rem] gap-4 px-4 py-4 border-b border-border-cream items-center ${
                  isCurrentUser ? "bg-ivory" : ""
                }`}
                style={borderColor ? { borderLeft: `3px solid ${borderColor}` } : undefined}
              >
                <span className="font-semibold text-near-black flex items-center gap-1">
                  {index < 3 && <Trophy className="w-4 h-4" style={{ color: borderColor }} />}
                  {index + 1}
                </span>

                <span className={`font-medium ${isCurrentUser ? "text-terracotta" : "text-near-black"}`}>
                  {entry.username}
                  {isCurrentUser && <span className="text-xs text-stone ml-2">(you)</span>}
                </span>

                <span className="text-right font-semibold text-near-black">{entry.total_points}</span>

                <span className="hidden sm:block text-right text-stone">{entry.total_predictions}</span>
                <span className="hidden sm:block text-right text-stone">{entry.exact_scores}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
