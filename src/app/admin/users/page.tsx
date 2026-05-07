"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Users,
  Trophy,
  Target,
  CheckCircle,
  Shield,
  ShieldOff,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Profile } from "@/types/database";

type UserStats = {
  profile: Profile;
  total_predictions: number;
  total_points: number;
  exact_scores: number;
  correct_outcomes: number;
  wrong_predictions: number;
};

type SortField = "username" | "total_points" | "total_predictions" | "exact_scores";
type SortDir = "asc" | "desc";

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("total_points");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  async function fetchUsers() {
    const [profilesRes, predictionsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: true }),
      supabase.from("predictions").select("user_id, points"),
    ]);

    if (profilesRes.error || predictionsRes.error) {
      toast.error("Failed to load users");
      setLoading(false);
      return;
    }

    const statsMap = new Map<string, { total: number; points: number; exact: number; correct: number; wrong: number }>();

    for (const p of predictionsRes.data ?? []) {
      const existing = statsMap.get(p.user_id) ?? { total: 0, points: 0, exact: 0, correct: 0, wrong: 0 };
      existing.total += 1;
      if (p.points !== null) {
        existing.points += p.points;
        if (p.points === 3) existing.exact += 1;
        else if (p.points === 1) existing.correct += 1;
        else existing.wrong += 1;
      }
      statsMap.set(p.user_id, existing);
    }

    const result: UserStats[] = (profilesRes.data ?? []).map((profile) => {
      const s = statsMap.get(profile.id) ?? { total: 0, points: 0, exact: 0, correct: 0, wrong: 0 };
      return {
        profile,
        total_predictions: s.total,
        total_points: s.points,
        exact_scores: s.exact,
        correct_outcomes: s.correct,
        wrong_predictions: s.wrong,
      };
    });

    setUsers(result);
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function toggleRole(user: Profile) {
    const newRole = user.role === "admin" ? "user" : "admin";
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update role");
      return;
    }
    toast.success(`${user.username} is now ${newRole}`);
    fetchUsers();
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const filtered = users.filter(
    (u) =>
      u.profile.username.toLowerCase().includes(search.toLowerCase()) ||
      u.profile.email.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === "username") {
      cmp = a.profile.username.localeCompare(b.profile.username);
    } else {
      cmp = a[sortField] - b[sortField];
    }
    return sortDir === "desc" ? -cmp : cmp;
  });

  const totalUsers = users.length;
  const totalAdmins = users.filter((u) => u.profile.role === "admin").length;
  const totalPts = users.reduce((s, u) => s + u.total_points, 0);
  const totalPreds = users.reduce((s, u) => s + u.total_predictions, 0);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "desc" ? (
      <ChevronDown className="w-3.5 h-3.5 inline ml-0.5" />
    ) : (
      <ChevronUp className="w-3.5 h-3.5 inline ml-0.5" />
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif font-bold text-near-black">
          Users
        </h1>
        <span className="text-stone text-sm">{totalUsers} users</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-ivory border border-border-cream rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-terracotta" />
            <span className="text-sm text-stone">Total Users</span>
          </div>
          <p className="text-2xl font-semibold text-near-black">{totalUsers}</p>
        </div>
        <div className="bg-ivory border border-border-cream rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-terracotta" />
            <span className="text-sm text-stone">Admins</span>
          </div>
          <p className="text-2xl font-semibold text-near-black">{totalAdmins}</p>
        </div>
        <div className="bg-ivory border border-border-cream rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-terracotta" />
            <span className="text-sm text-stone">Total Points</span>
          </div>
          <p className="text-2xl font-semibold text-near-black">{totalPts}</p>
        </div>
        <div className="bg-ivory border border-border-cream rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-terracotta" />
            <span className="text-sm text-stone">Total Predictions</span>
          </div>
          <p className="text-2xl font-semibold text-near-black">{totalPreds}</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username or email..."
          className="w-full rounded-xl border border-border-warm bg-ivory pl-10 pr-4 py-2.5 text-near-black placeholder:text-stone focus:outline-none focus:ring-2 focus:ring-terracotta/30"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-ivory border border-border-cream rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="skeleton h-4 w-32" />
                  <div className="skeleton h-3 w-48" />
                </div>
                <div className="flex gap-6">
                  <div className="skeleton h-5 w-10" />
                  <div className="skeleton h-5 w-10" />
                  <div className="skeleton h-8 w-20 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-stone text-center py-8">
          {search ? "No users match your search." : "No users yet."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-stone border-b border-border-warm">
                <th className="pb-3 pr-4 font-medium">
                  <button onClick={() => handleSort("username")} className="hover:text-near-black transition-colors">
                    User <SortIcon field="username" />
                  </button>
                </th>
                <th className="pb-3 px-4 font-medium text-center">Role</th>
                <th className="pb-3 px-4 font-medium text-right">
                  <button onClick={() => handleSort("total_points")} className="hover:text-near-black transition-colors">
                    Points <SortIcon field="total_points" />
                  </button>
                </th>
                <th className="pb-3 px-4 font-medium text-right">
                  <button onClick={() => handleSort("total_predictions")} className="hover:text-near-black transition-colors">
                    Predictions <SortIcon field="total_predictions" />
                  </button>
                </th>
                <th className="pb-3 px-4 font-medium text-right">
                  <button onClick={() => handleSort("exact_scores")} className="hover:text-near-black transition-colors">
                    Exact <SortIcon field="exact_scores" />
                  </button>
                </th>
                <th className="pb-3 px-4 font-medium text-right hidden sm:table-cell">Correct</th>
                <th className="pb-3 px-4 font-medium text-right hidden sm:table-cell">Wrong</th>
                <th className="pb-3 pl-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((u) => (
                <tr
                  key={u.profile.id}
                  className="border-b border-border-cream hover:bg-ivory/60 transition-colors"
                >
                  <td className="py-3.5 pr-4">
                    <p className="font-medium text-near-black">{u.profile.username}</p>
                    <p className="text-xs text-stone">{u.profile.email}</p>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        u.profile.role === "admin"
                          ? "bg-terracotta/10 text-terracotta"
                          : "bg-sand text-olive"
                      }`}
                    >
                      {u.profile.role === "admin" && <Shield className="w-3 h-3" />}
                      {u.profile.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-near-black">
                    {u.total_points}
                  </td>
                  <td className="py-3.5 px-4 text-right text-olive">
                    {u.total_predictions}
                  </td>
                  <td className="py-3.5 px-4 text-right text-olive">
                    {u.exact_scores}
                  </td>
                  <td className="py-3.5 px-4 text-right text-olive hidden sm:table-cell">
                    {u.correct_outcomes}
                  </td>
                  <td className="py-3.5 px-4 text-right text-olive hidden sm:table-cell">
                    {u.wrong_predictions}
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <button
                      onClick={() => toggleRole(u.profile)}
                      title={u.profile.role === "admin" ? "Remove admin" : "Make admin"}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        u.profile.role === "admin"
                          ? "text-olive hover:bg-sand"
                          : "text-terracotta hover:bg-terracotta/10"
                      }`}
                    >
                      {u.profile.role === "admin" ? (
                        <>
                          <ShieldOff className="w-3.5 h-3.5" />
                          Demote
                        </>
                      ) : (
                        <>
                          <Shield className="w-3.5 h-3.5" />
                          Promote
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
