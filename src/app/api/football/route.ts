import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
const API_BASE = "https://v3.football.api-sports.io";

type FixtureResponse = {
  response: {
    fixture: {
      id: number;
      date: string;
      status: { short: string; long: string };
    };
    league: { id: number; name: string; country: string };
    teams: {
      home: { id: number; name: string; logo: string };
      away: { id: number; name: string; logo: string };
    };
    goals: { home: number | null; away: number | null };
    score: {
      fulltime: { home: number | null; away: number | null };
    };
  }[];
};

function normalizeTeamName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function teamsMatch(apiTeam: string, dbTeam: string): boolean {
  const a = normalizeTeamName(apiTeam);
  const b = normalizeTeamName(dbTeam);
  return a.includes(b) || b.includes(a);
}

export async function GET(request: Request) {
  if (!API_FOOTBALL_KEY) {
    return NextResponse.json(
      { error: "API_FOOTBALL_KEY not configured" },
      { status: 500 }
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const res = await fetch(
    `${API_BASE}/fixtures?date=${date}`,
    {
      headers: { "x-apisports-key": API_FOOTBALL_KEY },
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch from API-Football" },
      { status: res.status }
    );
  }

  const data: FixtureResponse = await res.json();

  return NextResponse.json({
    fixtures: data.response.map((f) => ({
      fixture_id: f.fixture.id,
      date: f.fixture.date,
      status: f.fixture.status.short,
      status_long: f.fixture.status.long,
      league: f.league.name,
      country: f.league.country,
      home_team: f.teams.home.name,
      away_team: f.teams.away.name,
      home_logo: f.teams.home.logo,
      away_logo: f.teams.away.logo,
      home_score: f.score.fulltime.home ?? f.goals.home,
      away_score: f.score.fulltime.away ?? f.goals.away,
    })),
  });
}

export async function POST(request: Request) {
  if (!API_FOOTBALL_KEY) {
    return NextResponse.json(
      { error: "API_FOOTBALL_KEY not configured" },
      { status: 500 }
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .in("status", ["upcoming", "live"]);

  if (!matches || matches.length === 0) {
    return NextResponse.json({ synced: 0, message: "No active matches to sync" });
  }

  const dates = new Set<string>();
  for (const m of matches) {
    dates.add(new Date(m.match_time).toISOString().slice(0, 10));
  }

  const allFixtures: FixtureResponse["response"] = [];
  for (const date of dates) {
    const res = await fetch(`${API_BASE}/fixtures?date=${date}`, {
      headers: { "x-apisports-key": API_FOOTBALL_KEY },
    });
    if (res.ok) {
      const data: FixtureResponse = await res.json();
      allFixtures.push(...data.response);
    }
  }

  let synced = 0;
  const results: { match: string; action: string }[] = [];

  for (const match of matches) {
    const apiMatch = allFixtures.find(
      (f) =>
        teamsMatch(f.teams.home.name, match.home_team) &&
        teamsMatch(f.teams.away.name, match.away_team)
    );

    if (!apiMatch) continue;

    const apiStatus = apiMatch.fixture.status.short;
    const isFinished = ["FT", "AET", "PEN"].includes(apiStatus);
    const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(apiStatus);

    if (isFinished && apiMatch.score.fulltime.home !== null && apiMatch.score.fulltime.away !== null) {
      const { error } = await supabase
        .from("matches")
        .update({
          status: "finished",
          final_home_score: apiMatch.score.fulltime.home,
          final_away_score: apiMatch.score.fulltime.away,
        })
        .eq("id", match.id);

      if (!error) {
        synced++;
        results.push({
          match: `${match.home_team} vs ${match.away_team}`,
          action: `Finished: ${apiMatch.score.fulltime.home}-${apiMatch.score.fulltime.away}`,
        });
      }
    } else if (isLive && match.status !== "live") {
      await supabase
        .from("matches")
        .update({ status: "live" })
        .eq("id", match.id);

      results.push({
        match: `${match.home_team} vs ${match.away_team}`,
        action: "Status → live",
      });
    }
  }

  return NextResponse.json({ synced, results });
}

export async function PUT(request: Request) {
  if (!API_FOOTBALL_KEY) {
    return NextResponse.json(
      { error: "API_FOOTBALL_KEY not configured" },
      { status: 500 }
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { fixtures, tournament_id } = body as {
    fixtures: {
      home_team: string;
      away_team: string;
      home_logo: string;
      away_logo: string;
      date: string;
      status: string;
      home_score: number | null;
      away_score: number | null;
    }[];
    tournament_id: string;
  };

  if (!fixtures?.length || !tournament_id) {
    return NextResponse.json(
      { error: "fixtures and tournament_id are required" },
      { status: 400 }
    );
  }

  const rows = fixtures.map((f) => {
    const apiStatus = f.status;
    const isFinished = ["FT", "AET", "PEN"].includes(apiStatus);
    const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(apiStatus);

    return {
      tournament_id,
      home_team: f.home_team,
      away_team: f.away_team,
      home_logo: f.home_logo || null,
      away_logo: f.away_logo || null,
      match_time: f.date,
      status: isFinished ? "finished" : isLive ? "live" : "upcoming",
      final_home_score: isFinished ? f.home_score : null,
      final_away_score: isFinished ? f.away_score : null,
    };
  });

  const { data, error } = await supabase.from("matches").insert(rows).select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ imported: data.length });
}
