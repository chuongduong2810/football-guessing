"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Search,
  Download,
  CheckCircle,
  Loader2,
  Globe,
  Calendar,
  Filter,
} from "lucide-react";
import type { Tournament } from "@/types/database";

type Fixture = {
  fixture_id: number;
  date: string;
  status: string;
  status_long: string;
  league: string;
  country: string;
  home_team: string;
  away_team: string;
  home_logo: string;
  away_logo: string;
  home_score: number | null;
  away_score: number | null;
};

export default function AdminImportPage() {
  const supabase = createClient();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [leagueFilter, setLeagueFilter] = useState("");
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    supabase
      .from("tournaments")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (data) setTournaments(data);
      });
  }, [supabase]);

  const fetchFixtures = useCallback(async () => {
    setLoading(true);
    setFetched(false);
    setSelected(new Set());
    try {
      const res = await fetch(`/api/football?date=${date}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to fetch fixtures");
        setFixtures([]);
      } else {
        setFixtures(data.fixtures || []);
        setFetched(true);
      }
    } catch {
      toast.error("Network error");
    }
    setLoading(false);
  }, [date]);

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll(filtered: Fixture[]) {
    if (filtered.every((f) => selected.has(f.fixture_id))) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((f) => next.delete(f.fixture_id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((f) => next.add(f.fixture_id));
        return next;
      });
    }
  }

  async function importSelected() {
    if (!selectedTournament) {
      toast.error("Select a tournament first");
      return;
    }
    if (selected.size === 0) {
      toast.error("Select at least one match");
      return;
    }

    setImporting(true);
    const toImport = fixtures.filter((f) => selected.has(f.fixture_id));

    try {
      const res = await fetch("/api/football", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournament_id: selectedTournament,
          fixtures: toImport,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Import failed");
      } else {
        toast.success(`Imported ${data.imported} match(es)`);
        setSelected(new Set());
      }
    } catch {
      toast.error("Network error");
    }
    setImporting(false);
  }

  const leagues = [...new Set(fixtures.map((f) => f.league))].sort();
  const filtered = leagueFilter
    ? fixtures.filter((f) => f.league === leagueFilter)
    : fixtures;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif font-bold text-near-black mb-6">
        Import Matches from API-Football
      </h1>

      <div className="bg-ivory border border-border-cream rounded-xl p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-stone mb-1">
              <Calendar className="w-3 h-3 inline mr-1" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-border-cream rounded-lg px-3 py-2 text-sm text-near-black"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone mb-1">
              <Globe className="w-3 h-3 inline mr-1" />
              Import into Tournament
            </label>
            <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              className="w-full bg-white border border-border-cream rounded-lg px-3 py-2 text-sm text-near-black"
            >
              <option value="">Select tournament...</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchFixtures}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-near-black text-ivory rounded-lg px-4 py-2 text-sm font-medium hover:bg-dark-surface transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {loading ? "Fetching..." : "Fetch Fixtures"}
            </button>
          </div>
        </div>

        {fetched && leagues.length > 1 && (
          <div>
            <label className="block text-xs font-medium text-stone mb-1">
              <Filter className="w-3 h-3 inline mr-1" />
              Filter by League
            </label>
            <select
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
              className="bg-white border border-border-cream rounded-lg px-3 py-2 text-sm text-near-black"
            >
              <option value="">All Leagues ({fixtures.length})</option>
              {leagues.map((l) => (
                <option key={l} value={l}>
                  {l} ({fixtures.filter((f) => f.league === l).length})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {fetched && filtered.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-stone">
              {selected.size} of {filtered.length} selected
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => selectAll(filtered)}
                className="text-sm text-terracotta hover:text-coral font-medium"
              >
                {filtered.every((f) => selected.has(f.fixture_id))
                  ? "Deselect All"
                  : "Select All"}
              </button>
              <button
                onClick={importSelected}
                disabled={importing || selected.size === 0 || !selectedTournament}
                className="flex items-center gap-2 bg-terracotta text-ivory rounded-lg px-4 py-2 text-sm font-medium hover:bg-coral transition-colors disabled:opacity-50"
              >
                {importing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {importing
                  ? "Importing..."
                  : `Import ${selected.size} Match(es)`}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {filtered.map((f) => (
              <label
                key={f.fixture_id}
                className={`flex items-center gap-4 bg-ivory border rounded-xl p-4 cursor-pointer transition-colors ${
                  selected.has(f.fixture_id)
                    ? "border-terracotta bg-terracotta/5"
                    : "border-border-cream hover:border-sand"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(f.fixture_id)}
                  onChange={() => toggleSelect(f.fixture_id)}
                  className="w-4 h-4 accent-terracotta"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-stone bg-sand px-2 py-0.5 rounded-full">
                      {f.league}
                    </span>
                    <span className="text-xs text-stone">{f.country}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        ["FT", "AET", "PEN"].includes(f.status)
                          ? "bg-green-100 text-green-700"
                          : ["NS", "TBD", "PST"].includes(f.status)
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {f.status_long}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      {f.home_logo && (
                        <img
                          src={f.home_logo}
                          alt=""
                          className="w-5 h-5 object-contain"
                        />
                      )}
                      <span className="font-medium text-near-black">
                        {f.home_team}
                      </span>
                    </div>
                    {f.home_score !== null ? (
                      <span className="font-bold text-terracotta">
                        {f.home_score} - {f.away_score}
                      </span>
                    ) : (
                      <span className="text-stone">vs</span>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-near-black">
                        {f.away_team}
                      </span>
                      {f.away_logo && (
                        <img
                          src={f.away_logo}
                          alt=""
                          className="w-5 h-5 object-contain"
                        />
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-stone mt-1">
                    {format(new Date(f.date), "HH:mm · MMM d, yyyy")}
                  </div>
                </div>
                {selected.has(f.fixture_id) && (
                  <CheckCircle className="w-5 h-5 text-terracotta flex-shrink-0" />
                )}
              </label>
            ))}
          </div>
        </>
      )}

      {fetched && filtered.length === 0 && (
        <div className="text-center py-12 text-stone">
          <Globe className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No fixtures found for this date</p>
        </div>
      )}

      {!fetched && !loading && (
        <div className="text-center py-12 text-stone">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            Select a date and click &quot;Fetch Fixtures&quot; to browse matches
          </p>
        </div>
      )}
    </div>
  );
}
