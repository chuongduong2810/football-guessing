"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type FormValues = {
  predicted_home_score: number;
  predicted_away_score: number;
};

const schema = z.object({
  predicted_home_score: z.coerce.number().int().min(0).max(99),
  predicted_away_score: z.coerce.number().int().min(0).max(99),
});

export function PredictionForm({
  matchId,
  matchTime,
}: {
  matchId: string;
  matchTime: string;
}) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [existingId, setExistingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
  });

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data } = await supabase
        .from("predictions")
        .select("*")
        .eq("user_id", user.id)
        .eq("match_id", matchId)
        .maybeSingle();

      if (data) {
        setExistingId(data.id);
        reset({
          predicted_home_score: data.predicted_home_score,
          predicted_away_score: data.predicted_away_score,
        });
      }
      setLoading(false);
    }
    init();
  }, [supabase, matchId, reset]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-stone" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="text-center py-8">
        <p className="text-olive mb-3">Sign in to make your prediction</p>
        <Link
          href="/login"
          className="inline-block bg-terracotta text-ivory px-6 py-2.5 rounded-xl hover:bg-coral transition-colors font-medium"
        >
          Login to predict
        </Link>
      </div>
    );
  }

  const onSubmit = async (values: FormValues) => {
    if (new Date() > new Date(matchTime)) {
      toast.error("Predictions are closed for this match");
      return;
    }

    const payload = {
      user_id: userId,
      match_id: matchId,
      predicted_home_score: values.predicted_home_score,
      predicted_away_score: values.predicted_away_score,
    };

    const { error } = existingId
      ? await supabase.from("predictions").update(payload).eq("id", existingId)
      : await supabase.from("predictions").insert(payload);

    if (error) {
      toast.error("Failed to save prediction");
      return;
    }

    toast.success(existingId ? "Prediction updated!" : "Prediction submitted!");
    if (!existingId) {
      const { data } = await supabase
        .from("predictions")
        .select("id")
        .eq("user_id", userId)
        .eq("match_id", matchId)
        .single();
      if (data) setExistingId(data.id);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <input
            type="number"
            min={0}
            max={99}
            {...register("predicted_home_score")}
            className="rounded-xl border border-border-warm bg-white px-4 py-2.5 w-20 text-center text-lg focus:outline-none focus:ring-2 focus:ring-ring-warm"
          />
          {errors.predicted_home_score && (
            <span className="text-error text-xs">Required</span>
          )}
        </div>
        <span className="text-stone font-serif text-xl">-</span>
        <div className="flex flex-col items-center gap-1">
          <input
            type="number"
            min={0}
            max={99}
            {...register("predicted_away_score")}
            className="rounded-xl border border-border-warm bg-white px-4 py-2.5 w-20 text-center text-lg focus:outline-none focus:ring-2 focus:ring-ring-warm"
          />
          {errors.predicted_away_score && (
            <span className="text-error text-xs">Required</span>
          )}
        </div>
      </div>
      <div className="flex justify-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-terracotta text-ivory px-8 py-2.5 rounded-xl hover:bg-coral transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {existingId ? "Update Prediction" : "Submit Prediction"}
        </button>
      </div>
    </form>
  );
}
