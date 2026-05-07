"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Trophy,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Calculator,
  CheckCircle,
  Clock,
  Target,
  Loader2,
  Satellite,
} from "lucide-react";
import type { Match, Tournament } from "@/types/database";

type MatchWithPredictions = Match & {
  prediction_count: number;
  scored_count: number;
  predictions: {
    id: string;
    user_id: string;
    predicted_home_score: number;
    predicted_away_score: number;
    points: number | null;
    username: string;
  }[];
};

type TournamentResults = {
  tournament: Tournament;
  matches: MatchWithPredictions[];
  total_predictions: number;
  finished_matches: number;
  total_matches: number;
};

export default function AdminResultsPage() {
  const supabase = createClient();
  const [tournaments, setTournaments] = useState<TournamentResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTournament, setExpandedTournament] = useState<string | null>(null);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState<string | null>(null);
  const [recalculatingAll, setRecalculatingAll] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<{ match: string; action: string }[] | null>(null);

  const fetchData = useCallback(async () => {
    const [tournamentsRes, matchesRes, predictionsRes, profilesRes] = await Promise.all([
      supabase.from("tournaments").select("*").order("name"),
      supabase.from("matches").select("*").order("match_time", { ascending: false }),
      supabase.from("predictions").select("*"),
      supabase.from("profiles").select("id, username"),
    ]);

    if (tournamentsRes.error || matchesRes.error || predictionsRes.error || profilesRes.error) {
      toast.error("Failed to load data");
      setLoading(false);
      return;
    }

    const profileMap = new Map<string, string>();
    for (const p of profilesRes.data ?? []) {
      profileMap.set(p.id, p.username);
    }

    const predByMatch = new Map<string, typeof predictionsRes.data>();
    for (const pred of predictionsRes.data ?? []) {
      const arr = predByMatch.get(pred.match_id) ?? [];
      arr.push(pred);
      predByMatch.set(pred.match_id, arr);
    }

    const matchesByTournament = new Map<string, MatchWithPredictions[]>();
    for (const m of (matchesRes.data ?? []) as Match[]) {
      const preds = predByMatch.get(m.id) ?? [];
      const mwp: MatchWithPredictions = {
        ...m,
        prediction_count: preds.length,
        scored_count: preds.filter((p) => p.points !== null).length,
        predictions: preds.map((p) => ({
          id: p.id,
          user_id: p.user_id,
          predicted_home_score: p.predicted_home_score,
          predicted_away_score: p.predicted_away_score,
          points: p.points,
          username: profileMap.get(p.user_id) ?? "Unknown",
        })),
      };
      const arr = matchesByTournament.get(m.tournament_id) ?? [];
      arr.push(mwp);
      matchesByTournament.set(m.tournament_id, arr);
    }

    const results: TournamentResults[] = (tournamentsRes.data ?? []).map((t) => {
      const matches = matchesByTournament.get(t.id) ?? [];
      return {
        tournament: t,
        matches,
        total_predictions: matches.reduce((s, m) => s + m.prediction_count, 0),
        finished_matches: matches.filter((m) => m.status === "finished").length,
        total_matches: matches.length,
      };
    });

    setTournaments(results);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function calculatePoints(predHome: number, predAway: number, actualHome: number, actualAway: number): number {
    if (predHome === actualHome && predAway === actualAway) return 3;
    if (
      (predHome > predAway && actualHome > actualAway) ||
      (predHome < predAway && actualHome < actualAway) ||
      (predHome === predAway && actualHome === actualAway)
    ) return 1;
    return 0;
  }

  async function recalculateMatch(match: MatchWithPredictions) {
    if (match.status !== "finished" || match.final_home_score === null || match.final_away_score === null) {
      toast.error("Match must be finished with a final score");
      return;
    }

    setRecalculating(match.id);

    const updates = match.predictions.map((pred) => ({
      id: pred.id,
      points: calculatePoints(
        pred.predicted_home_score,
        pred.predicted_away_score,
        match.final_home_score!,
        match.final_away_score!
      ),
    }));

    let failed = false;
    for (const u of updates) {
      const { error } = await supabase
        .from("predictions")
        .update({ points: u.points })
        .eq("id", u.id);
      if (error) failed = true;
    }

    setRecalculating(null);

    if (failed) {
      toast.error("Some predictions failed to update");
    } else {
      toast.success(`Recalculated ${updates.length} predictions for ${match.home_team} vs ${match.away_team}`);
    }

    await fetchData();
  }

  async function recalculateAll() {
    setRecalculatingAll(true);
    let totalUpdated = 0;

    for (const t of tournaments) {
      for (const m of t.matches) {
        if (m.status === "finished" && m.final_home_score !== null && m.final_away_score !== null) {
          for (const pred of m.predictions) {
            const points = calculatePoints(
              pred.predicted_home_score,
              pred.predicted_away_score,
              m.final_home_score!,
              m.final_away_score!
            );
            await supabase
              .from("predictions")
              .update({ points })
              .eq("id", pred.id);
            totalUpdated++;
          }
        }
      }
    }

    setRecalculatingAll(false);
    toast.success(`Recalculated ${totalUpdated} predictions across all matches`);
    await fetchData();
  }

  async function syncFromApi() {
    setSyncing(true);
    setSyncResults(null);
    try {
      const res = await fetch("/api/football", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Sync failed");
        setSyncing(false);
        return;
      }

      if (data.synced > 0) {
        toast.success(`Synced ${data.synced} match result(s) from API-Football`);
        setSyncResults(data.results);
        await fetchData();
      } else {
        toast.info(data.message || "No matches to sync — all up to date");
        setSyncResults(data.results ?? []);
      }
    } catch {
      toast.error("Failed to connect to API-Football");
    }
    setSyncing(false);
  }

  const totalFinished = tournaments.reduce((s, t) => s + t.finished_matches, 0);
  const totalMatches = tournaments.reduce((s, t) => s + t.total_matches, 0);
  const totalPredictions = tournaments.reduce((s, t) => s + t.total_predictions, 0);

  const statusIcon = (match: MatchWithPredictions) => {
    if (match.status === "finished") return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (match.status === "live") return <Clock className="w-4 h-4 text-amber-500" />;
    return <Clock className="w-4 h-4 text-stone" />;
  };

  const pointsBadge = (points: number | null) => {
    if (points === null) return <span className="text-xs text-stone bg-sand px-2 py-0.5 rounded-full">pending</span>;
    if (points === 3) return <span className="text-xs text-white bg-terracotta px-2 py-0.5 rounded-full font-medium">+3 exact</span>;
    if (points === 1) return <span className="text-xs text-near-black bg-sand px-2 py-0.5 rounded-full font-medium">+1 correct</span>;
    return <span className="text-xs text-stone bg-border-cream px-2 py-0.5 rounded-full">+0</span>;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <h1 className="text-3xl font-serif font-bold text-near-black">
          Results & Scoring
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={syncFromApi}
            disabled={syncing}
            className="flex items-center gap-2 bg-near-black text-ivory rounded-xl px-5 py-2.5 hover:bg-dark-surface transition-colors font-medium disabled:opacity-50 text-sm"
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Satellite className="w-4 h-4" />}
            {syncing ? "Syncing..." : "Sync Live Results"}
          </button>
          <button
            onClick={recalculateAll}
            disabled={recalculatingAll}
            className="flex items-center gap-2 bg-terracotta text-ivory rounded-xl px-5 py-2.5 hover:bg-coral transition-colors font-medium disabled:opacity-50 text-sm"
          >
            {recalculatingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
            {recalculatingAll ? "Recalculating..." : "Recalculate All"}
          </button>
        </div>
      </div>

      {syncResults && syncResults.length > 0 && (
        <div className="bg-ivory border border-border-cream rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-near-black flex items-center gap-2">
              <Satellite className="w-4 h-4 text-terracotta" />
              Last Sync Results
            </h3>
            <button onClick={() => setSyncResults(null)} className="text-xs text-stone hover:text-near-black">
              Dismiss
            </button>
          </div>
          <div className="space-y-1.5">
            {syncResults.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-near-black">{r.match}</span>
                <span className="text-xs text-terracotta font-medium bg-terracotta/10 px-2 py-0.5 rounded-full">{r.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-ivory border border-border-cream rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-terracotta" />
            <span className="text-sm text-stone">Finished</span>
          </div>
          <p className="text-2xl font-semibold text-near-black">{totalFinished} <span className="text-sm font-normal text-stone">/ {totalMatches}</span></p>
        </div>
        <div className="bg-ivory border border-border-cream rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-terracotta" />
            <span className="text-sm text-stone">Total Predictions</span>
          </div>
          <p className="text-2xl font-semibold text-near-black">{totalPredictions}</p>
        </div>
        <div className="bg-ivory border border-border-cream rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-terracotta" />
            <span className="text-sm text-stone">Tournaments</span>
          </div>
          <p className="text-2xl font-semibold text-near-black">{tournaments.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-ivory border border-border-cream rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="skeleton h-5 w-5 rounded" />
                <div className="skeleton h-5 w-40" />
                <div className="ml-auto skeleton h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <p className="text-stone text-center py-8">No tournaments yet.</p>
      ) : (
        <div className="space-y-4">
          {tournaments.map((t) => (
            <div key={t.tournament.id} className="bg-ivory border border-border-cream rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedTournament(expandedTournament === t.tournament.id ? null : t.tournament.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-parchment/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {expandedTournament === t.tournament.id ? (
                    <ChevronDown className="w-4 h-4 text-stone" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-stone" />
                  )}
                  {t.tournament.logo_url && (
                    <img src={t.tournament.logo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                  )}
                  <span className="font-medium text-near-black">{t.tournament.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-stone">
                  <span>{t.finished_matches}/{t.total_matches} finished</span>
                  <span>{t.total_predictions} predictions</span>
                </div>
              </button>

              {expandedTournament === t.tournament.id && (
                <div className="border-t border-border-cream">
                  {t.matches.length === 0 ? (
                    <p className="text-stone text-sm p-5">No matches in this tournament.</p>
                  ) : (
                    t.matches.map((m) => (
                      <div key={m.id} className="border-b border-border-cream last:border-b-0">
                        <button
                          onClick={() => setExpandedMatch(expandedMatch === m.id ? null : m.id)}
                          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-parchment/30 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            {statusIcon(m)}
                            <span className="font-medium text-near-black text-sm">
                              {m.home_team} vs {m.away_team}
                            </span>
                            {m.status === "finished" && m.final_home_score !== null && (
                              <span className="font-serif text-sm font-semibold text-terracotta">
                                {m.final_home_score} - {m.final_away_score}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-stone">
                            <span>{format(new Date(m.match_time), "MMM d, HH:mm")}</span>
                            <span>{m.prediction_count} pred.</span>
                            {m.status === "finished" && (
                              <span className="text-green-600">{m.scored_count} scored</span>
                            )}
                            {expandedMatch === m.id ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </button>

                        {expandedMatch === m.id && (
                          <div className="px-5 pb-4 bg-parchment/30">
                            {m.status === "finished" && m.prediction_count > 0 && (
                              <div className="flex justify-end mb-3">
                                <button
                                  onClick={() => recalculateMatch(m)}
                                  disabled={recalculating === m.id}
                                  className="flex items-center gap-1.5 text-xs text-terracotta hover:bg-terracotta/10 px-3 py-1.5 rounded-lg transition-colors font-medium"
                                >
                                  {recalculating === m.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  )}
                                  Recalculate
                                </button>
                              </div>
                            )}

                            {m.predictions.length === 0 ? (
                              <p className="text-stone text-xs py-2">No predictions for this match.</p>
                            ) : (
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-xs text-stone border-b border-border-warm">
                                    <th className="text-left pb-2 font-medium">User</th>
                                    <th className="text-center pb-2 font-medium">Prediction</th>
                                    {m.status === "finished" && (
                                      <th className="text-center pb-2 font-medium">Actual</th>
                                    )}
                                    <th className="text-right pb-2 font-medium">Points</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {m.predictions
                                    .sort((a, b) => (b.points ?? -1) - (a.points ?? -1))
                                    .map((pred) => (
                                      <tr key={pred.id} className="border-b border-border-cream last:border-b-0">
                                        <td className="py-2 text-near-black">{pred.username}</td>
                                        <td className="py-2 text-center font-medium text-near-black">
                                          {pred.predicted_home_score} - {pred.predicted_away_score}
                                        </td>
                                        {m.status === "finished" && (
                                          <td className="py-2 text-center font-serif font-semibold text-terracotta">
                                            {m.final_home_score} - {m.final_away_score}
                                          </td>
                                        )}
                                        <td className="py-2 text-right">
                                          {pointsBadge(pred.points)}
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
