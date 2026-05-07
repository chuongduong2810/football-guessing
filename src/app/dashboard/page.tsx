import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Trophy, Target, TrendingUp, CheckCircle } from "lucide-react";
import Link from "next/link";
import type { Prediction } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: predictions } = await supabase
    .from("predictions")
    .select("*, matches(*, tournaments(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const allPredictions = (predictions ?? []) as Prediction[];
  const totalPredictions = allPredictions.length;
  const scoredPredictions = allPredictions.filter((p) => p.points !== null);
  const totalPoints = scoredPredictions.reduce((sum, p) => sum + (p.points ?? 0), 0);
  const avgPoints = scoredPredictions.length > 0 ? (totalPoints / scoredPredictions.length).toFixed(1) : "0";
  const exactScores = scoredPredictions.filter((p) => p.points === 3).length;

  const pending = allPredictions.filter((p) => p.matches?.status === "upcoming" || p.matches?.status === "live");
  const results = allPredictions.filter((p) => p.matches?.status === "finished");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-near-black mb-8">
        Welcome, {profile?.username ?? "Player"}
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard icon={<Target className="w-5 h-5 text-terracotta" />} label="Predictions" value={totalPredictions} />
        <StatCard icon={<Trophy className="w-5 h-5 text-terracotta" />} label="Total Points" value={totalPoints} />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-terracotta" />} label="Avg Points" value={avgPoints} />
        <StatCard icon={<CheckCircle className="w-5 h-5 text-terracotta" />} label="Exact Scores" value={exactScores} />
      </div>

      {allPredictions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-stone text-lg mb-4">You haven&apos;t made any predictions yet.</p>
          <Link
            href="/"
            className="inline-block bg-terracotta text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Make Your First Prediction
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {pending.length > 0 && (
            <section>
              <h2 className="font-serif text-xl text-near-black mb-4">Pending</h2>
              <div className="space-y-3">
                {pending.map((p) => (
                  <PredictionCard key={p.id} prediction={p} />
                ))}
              </div>
            </section>
          )}

          {results.length > 0 && (
            <section>
              <h2 className="font-serif text-xl text-near-black mb-4">Results</h2>
              <div className="space-y-3">
                {results.map((p) => (
                  <PredictionCard key={p.id} prediction={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-ivory border border-border-cream rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-stone">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-near-black">{value}</p>
    </div>
  );
}

function PredictionCard({ prediction }: { prediction: Prediction }) {
  const match = prediction.matches;
  const tournament = match?.tournaments;

  return (
    <div className="bg-ivory border border-border-cream rounded-xl p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <p className="font-medium text-near-black">
            {match?.home_team} vs {match?.away_team}
          </p>
          {tournament && (
            <p className="text-sm text-stone">{tournament.name}</p>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <p className="text-stone">Your Prediction</p>
            <p className="font-medium text-near-black">
              {prediction.predicted_home_score} - {prediction.predicted_away_score}
            </p>
          </div>

          {match?.status === "finished" && (
            <div className="text-center">
              <p className="text-stone">Actual</p>
              <p className="font-medium text-near-black">
                {match.final_home_score} - {match.final_away_score}
              </p>
            </div>
          )}

          <div className="text-center">
            {match?.status === "finished" ? (
              <>
                <p className="text-stone">Points</p>
                <p className="font-semibold text-terracotta">{prediction.points ?? 0}</p>
              </>
            ) : (
              <StatusBadge status={match?.status ?? "upcoming"} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = status === "live"
    ? "bg-terracotta/10 text-terracotta"
    : "bg-sand text-olive";

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${styles}`}>
      {status}
    </span>
  );
}
