import Link from "next/link";
import { format } from "date-fns";
import { Trophy, Calendar, Users, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Countdown } from "@/components/countdown";
import type { Match } from "@/types/database";

export default async function Home() {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("*, tournaments(*)")
    .order("match_time", { ascending: true });

  const { data: predictions } = await supabase
    .from("predictions")
    .select("match_id");

  const allMatches = (matches ?? []) as Match[];
  const predictionCounts = new Map<string, number>();
  (predictions ?? []).forEach((p) => {
    predictionCounts.set(p.match_id, (predictionCounts.get(p.match_id) ?? 0) + 1);
  });

  const upcoming = allMatches.filter((m) => m.status === "upcoming");
  const live = allMatches.filter((m) => m.status === "live");
  const finished = allMatches.filter((m) => m.status === "finished");

  const totalPredictions = predictions?.length ?? 0;
  const activeTournaments = new Set(allMatches.map((m) => m.tournament_id)).size;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <section className="text-center mb-16">
        <h1 className="font-serif text-4xl md:text-5xl font-medium text-near-black mb-4">
          Football Predictions
        </h1>
        <p className="text-olive text-lg max-w-2xl mx-auto">
          Predict match scores, earn points, and compete with friends on the leaderboard.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
        <StatCard icon={<Calendar className="w-5 h-5 text-terracotta" />} label="Total Matches" value={allMatches.length} />
        <StatCard icon={<Users className="w-5 h-5 text-terracotta" />} label="Total Predictions" value={totalPredictions} />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-terracotta" />} label="Tournaments" value={activeTournaments} />
      </section>

      {live.length > 0 && (
        <Section title="Live Matches">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {live.map((match) => (
              <MatchCard key={match.id} match={match} predictionCount={predictionCounts.get(match.id) ?? 0} />
            ))}
          </div>
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section title="Upcoming Matches">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map((match) => (
              <MatchCard key={match.id} match={match} predictionCount={predictionCounts.get(match.id) ?? 0} />
            ))}
          </div>
        </Section>
      )}

      {finished.length > 0 && (
        <Section title="Finished Matches">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {finished.map((match) => (
              <MatchCard key={match.id} match={match} predictionCount={predictionCounts.get(match.id) ?? 0} />
            ))}
          </div>
        </Section>
      )}

      {allMatches.length === 0 && (
        <div className="text-center py-20">
          <Trophy className="w-12 h-12 text-stone mx-auto mb-4" />
          <p className="text-olive text-lg">No matches available yet.</p>
          <p className="text-stone text-sm mt-1">Check back soon for upcoming fixtures.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-ivory border border-border-cream rounded-2xl p-6 flex items-center gap-4">
      <div className="bg-parchment rounded-xl p-3">{icon}</div>
      <div>
        <p className="text-2xl font-serif font-medium text-near-black">{value}</p>
        <p className="text-stone text-sm">{label}</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="font-serif text-2xl font-medium text-near-black mb-6">{title}</h2>
      {children}
    </section>
  );
}

function MatchCard({ match, predictionCount }: { match: Match; predictionCount: number }) {
  return (
    <Link
      href={`/matches/${match.id}`}
      className="bg-ivory border border-border-cream rounded-2xl p-6 hover:shadow-sm transition block"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-stone text-xs flex items-center gap-1.5">
          {match.tournaments?.logo_url && (
            <img src={match.tournaments.logo_url} alt="" className="w-4 h-4 rounded-full" />
          )}
          {match.tournaments?.name ?? "Tournament"}
        </span>
        <StatusBadge status={match.status} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <TeamDisplay name={match.home_team} logo={match.home_logo} />
        {match.status === "finished" ? (
          <div className="text-center">
            <p className="font-serif text-xl font-medium text-near-black">
              {match.final_home_score} - {match.final_away_score}
            </p>
          </div>
        ) : (
          <span className="text-stone font-serif text-lg">vs</span>
        )}
        <TeamDisplay name={match.away_team} logo={match.away_logo} />
      </div>

      <div className="flex items-center justify-between text-xs text-stone">
        <span>{format(new Date(match.match_time), "MMM d, yyyy • HH:mm")}</span>
        {match.status === "upcoming" && <Countdown targetDate={match.match_time} />}
      </div>

      <div className="mt-3 pt-3 border-t border-border-cream flex items-center gap-1 text-xs text-stone">
        <Users className="w-3.5 h-3.5" />
        {predictionCount} prediction{predictionCount !== 1 ? "s" : ""}
      </div>
    </Link>
  );
}

function TeamDisplay({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className="flex flex-col items-center gap-2 w-24">
      {logo ? (
        <img src={logo} alt={name} className="w-10 h-10 rounded-full object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-sand flex items-center justify-center text-olive font-medium text-sm">
          {name.charAt(0)}
        </div>
      )}
      <span className="text-sm text-near-black text-center leading-tight truncate w-full">{name}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: Match["status"] }) {
  const config = {
    upcoming: { label: "Open", classes: "bg-green-50 text-green-700 border-green-200" },
    live: { label: "Live", classes: "bg-amber-50 text-amber-700 border-amber-200" },
    finished: { label: "Finished", classes: "bg-gray-50 text-gray-500 border-gray-200" },
  };
  const { label, classes } = config[status];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${classes}`}>
      {label}
    </span>
  );
}
