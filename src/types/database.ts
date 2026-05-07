export type Profile = {
  id: string;
  email: string;
  username: string;
  role: "admin" | "user";
  created_at: string;
};

export type Tournament = {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
};

export type Match = {
  id: string;
  tournament_id: string;
  home_team: string;
  away_team: string;
  home_logo: string | null;
  away_logo: string | null;
  match_time: string;
  status: "upcoming" | "live" | "finished";
  final_home_score: number | null;
  final_away_score: number | null;
  created_at: string;
  tournaments?: Tournament;
};

export type Prediction = {
  id: string;
  user_id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  points: number | null;
  created_at: string;
  matches?: Match;
  profiles?: Profile;
};

export type LeaderboardEntry = {
  user_id: string;
  username: string;
  total_points: number;
  total_predictions: number;
  exact_scores: number;
};
