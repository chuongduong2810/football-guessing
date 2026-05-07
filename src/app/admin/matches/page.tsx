"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Match, Tournament } from "@/types/database";

const matchSchema = z.object({
  tournament_id: z.string().min(1, "Tournament is required"),
  home_team: z.string().min(1, "Home team is required"),
  away_team: z.string().min(1, "Away team is required"),
  home_logo: z.string().url("Must be a valid URL").or(z.literal("")),
  away_logo: z.string().url("Must be a valid URL").or(z.literal("")),
  match_time: z.string().min(1, "Match time is required"),
  status: z.enum(["upcoming", "live", "finished"]),
  final_home_score: z.string(),
  final_away_score: z.string(),
});

type MatchForm = z.infer<typeof matchSchema>;

function toLocalDatetime(iso: string) {
  return new Date(iso).toISOString().slice(0, 16);
}

function toISOString(local: string) {
  return new Date(local).toISOString();
}

const statusColors: Record<Match["status"], string> = {
  upcoming: "bg-sand text-charcoal",
  live: "bg-terracotta/10 text-terracotta",
  finished: "bg-stone/10 text-stone",
};

export default function MatchesAdmin() {
  const supabase = createClient();
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MatchForm>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      status: "upcoming",
      final_home_score: "",
      final_away_score: "",
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    watch: watchEdit,
    formState: { errors: editErrors, isSubmitting: isEditSubmitting },
  } = useForm<MatchForm>({
    resolver: zodResolver(matchSchema),
  });

  const watchStatus = watch("status");
  const watchEditStatus = watchEdit("status");

  async function fetchData() {
    const [matchesRes, tournamentsRes] = await Promise.all([
      supabase
        .from("matches")
        .select("*, tournaments(*)")
        .order("match_time", { ascending: false }),
      supabase
        .from("tournaments")
        .select("*")
        .order("name", { ascending: true }),
    ]);

    if (matchesRes.error) {
      toast.error("Failed to load matches");
    } else {
      setMatches(matchesRes.data ?? []);
    }

    if (tournamentsRes.error) {
      toast.error("Failed to load tournaments");
    } else {
      setTournaments(tournamentsRes.data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function onAdd(values: MatchForm) {
    const { error } = await supabase.from("matches").insert({
      tournament_id: values.tournament_id,
      home_team: values.home_team,
      away_team: values.away_team,
      home_logo: values.home_logo || null,
      away_logo: values.away_logo || null,
      match_time: toISOString(values.match_time),
      status: values.status,
      final_home_score:
        values.status === "finished" && values.final_home_score
          ? Number(values.final_home_score)
          : null,
      final_away_score:
        values.status === "finished" && values.final_away_score
          ? Number(values.final_away_score)
          : null,
    });

    if (error) {
      toast.error("Failed to add match");
      return;
    }
    toast.success("Match added");
    reset();
    setShowForm(false);
    fetchData();
  }

  function startEdit(match: Match) {
    setEditingId(match.id);
    resetEdit({
      tournament_id: match.tournament_id,
      home_team: match.home_team,
      away_team: match.away_team,
      home_logo: match.home_logo ?? "",
      away_logo: match.away_logo ?? "",
      match_time: toLocalDatetime(match.match_time),
      status: match.status,
      final_home_score:
        match.final_home_score != null ? String(match.final_home_score) : "",
      final_away_score:
        match.final_away_score != null ? String(match.final_away_score) : "",
    });
  }

  async function onEdit(values: MatchForm) {
    if (!editingId) return;

    const { error } = await supabase
      .from("matches")
      .update({
        tournament_id: values.tournament_id,
        home_team: values.home_team,
        away_team: values.away_team,
        home_logo: values.home_logo || null,
        away_logo: values.away_logo || null,
        match_time: toISOString(values.match_time),
        status: values.status,
        final_home_score:
          values.status === "finished" && values.final_home_score
            ? Number(values.final_home_score)
            : null,
        final_away_score:
          values.status === "finished" && values.final_away_score
            ? Number(values.final_away_score)
            : null,
      })
      .eq("id", editingId);

    if (error) {
      toast.error("Failed to update match");
      return;
    }
    toast.success("Match updated");
    setEditingId(null);
    fetchData();
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this match?")) return;

    const { error } = await supabase.from("matches").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete match");
      return;
    }
    toast.success("Match deleted");
    fetchData();
  }

  const inputClass =
    "w-full rounded-xl border border-border-warm bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-terracotta/30";

  const selectClass =
    "w-full rounded-xl border border-border-warm bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-terracotta/30";

  function renderForm(
    onSubmit: (values: MatchForm) => Promise<void>,
    reg: typeof register,
    errs: typeof errors,
    submitting: boolean,
    currentStatus: string,
    onCancel: () => void
  ) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-olive mb-1">
              Tournament
            </label>
            <select {...reg("tournament_id")} className={selectClass}>
              <option value="">Select tournament</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {errs.tournament_id && (
              <p className="text-error text-sm mt-1">
                {errs.tournament_id.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-olive mb-1">
              Status
            </label>
            <select {...reg("status")} className={selectClass}>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="finished">Finished</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-olive mb-1">
              Home Team
            </label>
            <input {...reg("home_team")} className={inputClass} />
            {errs.home_team && (
              <p className="text-error text-sm mt-1">
                {errs.home_team.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-olive mb-1">
              Away Team
            </label>
            <input {...reg("away_team")} className={inputClass} />
            {errs.away_team && (
              <p className="text-error text-sm mt-1">
                {errs.away_team.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-olive mb-1">
              Home Logo URL
            </label>
            <input
              {...reg("home_logo")}
              placeholder="https://..."
              className={inputClass}
            />
            {errs.home_logo && (
              <p className="text-error text-sm mt-1">
                {errs.home_logo.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-olive mb-1">
              Away Logo URL
            </label>
            <input
              {...reg("away_logo")}
              placeholder="https://..."
              className={inputClass}
            />
            {errs.away_logo && (
              <p className="text-error text-sm mt-1">
                {errs.away_logo.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-olive mb-1">
            Match Time
          </label>
          <input type="datetime-local" {...reg("match_time")} className={inputClass} />
          {errs.match_time && (
            <p className="text-error text-sm mt-1">
              {errs.match_time.message}
            </p>
          )}
        </div>

        {currentStatus === "finished" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-olive mb-1">
                Final Home Score
              </label>
              <input
                type="number"
                min={0}
                {...reg("final_home_score")}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-olive mb-1">
                Final Away Score
              </label>
              <input
                type="number"
                min={0}
                {...reg("final_away_score")}
                className={inputClass}
              />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-terracotta text-ivory rounded-xl px-6 py-2.5 hover:bg-coral transition-colors font-medium disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-sand text-charcoal rounded-xl px-6 py-2.5 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif font-bold text-near-black">
          Matches
        </h1>
        {!showForm && (
          <button
            onClick={() => {
              reset({
                tournament_id: "",
                home_team: "",
                away_team: "",
                home_logo: "",
                away_logo: "",
                match_time: "",
                status: "upcoming",
                final_home_score: "",
                final_away_score: "",
              });
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-terracotta text-ivory rounded-xl px-6 py-2.5 hover:bg-coral transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Match
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onAdd)}
          className="bg-ivory border border-border-cream rounded-2xl p-6 mb-6"
        >
          <h2 className="text-lg font-serif font-semibold text-near-black mb-4">
            New Match
          </h2>
          {renderForm(
            onAdd,
            register,
            errors,
            isSubmitting,
            watchStatus,
            () => setShowForm(false)
          )}
        </form>
      )}

      {loading ? (
        <p className="text-stone">Loading...</p>
      ) : matches.length === 0 ? (
        <p className="text-stone">No matches yet.</p>
      ) : (
        <div>
          {matches.map((m) =>
            editingId === m.id ? (
              <form
                key={m.id}
                onSubmit={handleSubmitEdit(onEdit)}
                className="bg-ivory border border-border-cream rounded-xl p-4 mb-3"
              >
                {renderForm(
                  onEdit,
                  registerEdit,
                  editErrors,
                  isEditSubmitting,
                  watchEditStatus,
                  () => setEditingId(null)
                )}
              </form>
            ) : (
              <div
                key={m.id}
                className="bg-ivory border border-border-cream rounded-xl p-4 mb-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[m.status]}`}
                      >
                        {m.status}
                      </span>
                      {m.tournaments && (
                        <span className="text-xs text-stone">
                          {m.tournaments.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {m.home_logo && (
                          <img
                            src={m.home_logo}
                            alt=""
                            className="w-6 h-6 rounded object-cover"
                          />
                        )}
                        <span className="font-medium text-near-black">
                          {m.home_team}
                        </span>
                      </div>
                      {m.status === "finished" &&
                      m.final_home_score != null &&
                      m.final_away_score != null ? (
                        <span className="font-serif font-bold text-terracotta">
                          {m.final_home_score} - {m.final_away_score}
                        </span>
                      ) : (
                        <span className="text-stone">vs</span>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-near-black">
                          {m.away_team}
                        </span>
                        {m.away_logo && (
                          <img
                            src={m.away_logo}
                            alt=""
                            className="w-6 h-6 rounded object-cover"
                          />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-stone mt-1">
                      {format(new Date(m.match_time), "PPp")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(m)}
                      className="text-olive hover:bg-sand rounded-lg px-3 py-1.5 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(m.id)}
                      className="text-error hover:bg-error/10 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
