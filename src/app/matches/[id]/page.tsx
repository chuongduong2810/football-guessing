import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Calendar, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PredictionForm } from "@/components/prediction-form";
import type { Match } from "@/types/database";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("matches")
    .select("*, tournaments(*)")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const match = data as Match;

  const { count } = await supabase
    .from("predictions")
    .select("*", { count: "exact", head: true })
    .eq("match_id", id);

  const predictionCount = count ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-olive hover:text-near-black transition-colors text-sm mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to matches
      </Link>

      <div className="bg-ivory border border-border-cream rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <span className="text-stone text-sm flex items-center gap-2">
            {match.tournaments?.logo_url && (
              <img src={match.tournaments.logo_url} alt="" className="w-5 h-5 rounded-full" />
            )}
            {match.tournaments?.name ?? "Tournament"}
          </span>
          <StatusBadge status={match.status} />
        </div>

        <div className="flex items-center justify-center gap-8 md:gap-16 mb-8">
          <TeamDisplay name={match.home_team} logo={match.home_logo} />
          {match.status === "finished" ? (
            <div className="text-center">
              <p className="font-serif text-3xl font-medium text-near-black">
                {match.final_home_score} - {match.final_away_score}
              </p>
              <p className="text-stone text-xs mt-1">Full Time</p>
            </div>
          ) : (
            <span className="font-serif text-2xl text-stone">vs</span>
          )}
          <TeamDisplay name={match.away_team} logo={match.away_logo} />
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-stone mb-8">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {format(new Date(match.match_time), "EEEE, MMMM d, yyyy • HH:mm")}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {predictionCount} prediction{predictionCount !== 1 ? "s" : ""}
          </span>
        </div>

        {match.status === "upcoming" && (
          <div className="border-t border-border-cream pt-8">
            <h3 className="font-serif text-lg font-medium text-near-black text-center mb-6">
              Make Your Prediction
            </h3>
            <PredictionForm matchId={match.id} matchTime={match.match_time} />
          </div>
        )}

        {match.status === "finished" && (
          <div className="border-t border-border-cream pt-6 text-center">
            <p className="text-stone text-sm">
              This match has ended. Predictions are closed.
            </p>
          </div>
        )}

        {match.status === "live" && (
          <div className="border-t border-border-cream pt-6 text-center">
            <p className="text-stone text-sm">
              This match is currently in progress. Predictions are closed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TeamDisplay({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className="flex flex-col items-center gap-3">
      {logo ? (
        <img src={logo} alt={name} className="w-16 h-16 rounded-full object-cover" />
      ) : (
        <div className="w-16 h-16 rounded-full bg-sand flex items-center justify-center text-olive font-medium text-xl">
          {name.charAt(0)}
        </div>
      )}
      <span className="text-base font-medium text-near-black text-center">{name}</span>
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
    <span className={`text-xs px-2.5 py-1 rounded-full border ${classes}`}>
      {label}
    </span>
  );
}
