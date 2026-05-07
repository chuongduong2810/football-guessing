"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Tournament } from "@/types/database";

const tournamentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  logo_url: z.string().url("Must be a valid URL").or(z.literal("")),
});

type TournamentForm = z.infer<typeof tournamentSchema>;

export default function TournamentsAdmin() {
  const supabase = createClient();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TournamentForm>({
    resolver: zodResolver(tournamentSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: isEditSubmitting },
  } = useForm<TournamentForm>({
    resolver: zodResolver(tournamentSchema),
  });

  async function fetchTournaments() {
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load tournaments");
      return;
    }
    setTournaments(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchTournaments();
  }, []);

  async function onAdd(values: TournamentForm) {
    const { error } = await supabase.from("tournaments").insert({
      name: values.name,
      logo_url: values.logo_url || null,
    });

    if (error) {
      toast.error("Failed to add tournament");
      return;
    }
    toast.success("Tournament added");
    reset();
    setShowForm(false);
    fetchTournaments();
  }

  function startEdit(tournament: Tournament) {
    setEditingId(tournament.id);
    resetEdit({
      name: tournament.name,
      logo_url: tournament.logo_url ?? "",
    });
  }

  async function onEdit(values: TournamentForm) {
    if (!editingId) return;

    const { error } = await supabase
      .from("tournaments")
      .update({
        name: values.name,
        logo_url: values.logo_url || null,
      })
      .eq("id", editingId);

    if (error) {
      toast.error("Failed to update tournament");
      return;
    }
    toast.success("Tournament updated");
    setEditingId(null);
    fetchTournaments();
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this tournament?")) return;

    const { error } = await supabase
      .from("tournaments")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete tournament");
      return;
    }
    toast.success("Tournament deleted");
    fetchTournaments();
  }

  const inputClass =
    "w-full rounded-xl border border-border-warm bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-terracotta/30";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif font-bold text-near-black">
          Tournaments
        </h1>
        {!showForm && (
          <button
            onClick={() => {
              reset({ name: "", logo_url: "" });
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-terracotta text-ivory rounded-xl px-6 py-2.5 hover:bg-coral transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Tournament
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onAdd)}
          className="bg-ivory border border-border-cream rounded-2xl p-6 mb-6"
        >
          <h2 className="text-lg font-serif font-semibold text-near-black mb-4">
            New Tournament
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-olive mb-1">
                Name
              </label>
              <input {...register("name")} className={inputClass} />
              {errors.name && (
                <p className="text-error text-sm mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-olive mb-1">
                Logo URL
              </label>
              <input
                {...register("logo_url")}
                placeholder="https://..."
                className={inputClass}
              />
              {errors.logo_url && (
                <p className="text-error text-sm mt-1">
                  {errors.logo_url.message}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-terracotta text-ivory rounded-xl px-6 py-2.5 hover:bg-coral transition-colors font-medium disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-sand text-charcoal rounded-xl px-6 py-2.5 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-ivory border border-border-cream rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="skeleton h-8 w-8 rounded" />
                <div className="skeleton h-4 w-32" />
              </div>
              <div className="flex gap-2">
                <div className="skeleton h-8 w-8 rounded-lg" />
                <div className="skeleton h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <p className="text-stone">No tournaments yet.</p>
      ) : (
        <div>
          {tournaments.map((t) =>
            editingId === t.id ? (
              <form
                key={t.id}
                onSubmit={handleSubmitEdit(onEdit)}
                className="bg-ivory border border-border-cream rounded-xl p-4 mb-3"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-olive mb-1">
                      Name
                    </label>
                    <input
                      {...registerEdit("name")}
                      className={inputClass}
                    />
                    {editErrors.name && (
                      <p className="text-error text-sm mt-1">
                        {editErrors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-olive mb-1">
                      Logo URL
                    </label>
                    <input
                      {...registerEdit("logo_url")}
                      placeholder="https://..."
                      className={inputClass}
                    />
                    {editErrors.logo_url && (
                      <p className="text-error text-sm mt-1">
                        {editErrors.logo_url.message}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isEditSubmitting}
                      className="bg-terracotta text-ivory rounded-xl px-6 py-2.5 hover:bg-coral transition-colors font-medium disabled:opacity-50"
                    >
                      {isEditSubmitting ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="bg-sand text-charcoal rounded-xl px-6 py-2.5 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div
                key={t.id}
                className="bg-ivory border border-border-cream rounded-xl p-4 mb-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {t.logo_url && (
                    <img
                      src={t.logo_url}
                      alt=""
                      className="w-8 h-8 rounded object-cover"
                    />
                  )}
                  <span className="font-medium text-near-black">{t.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(t)}
                    className="text-olive hover:bg-sand rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(t.id)}
                    className="text-error hover:bg-error/10 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
