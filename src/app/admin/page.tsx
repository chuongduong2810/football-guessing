import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Trophy, Swords, BarChart3, Users, ClipboardCheck } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [tournamentsRes, matchesRes, predictionsRes, usersRes] = await Promise.all([
    supabase.from("tournaments").select("id", { count: "exact", head: true }),
    supabase.from("matches").select("id", { count: "exact", head: true }),
    supabase.from("predictions").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    {
      label: "Tournaments",
      count: tournamentsRes.count ?? 0,
      icon: Trophy,
      href: "/admin/tournaments",
    },
    {
      label: "Matches",
      count: matchesRes.count ?? 0,
      icon: Swords,
      href: "/admin/matches",
    },
    {
      label: "Predictions",
      count: predictionsRes.count ?? 0,
      icon: BarChart3,
      href: "/admin/results",
    },
    {
      label: "Users",
      count: usersRes.count ?? 0,
      icon: Users,
      href: "/admin/users",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif font-bold text-near-black mb-8">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-ivory border border-border-cream rounded-2xl p-6 hover:border-border-warm transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <stat.icon className="w-5 h-5 text-terracotta" />
              <span className="text-stone text-sm font-medium">
                {stat.label}
              </span>
            </div>
            <p className="text-3xl font-serif font-bold text-near-black">
              {stat.count}
            </p>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        <Link
          href="/admin/tournaments"
          className="bg-terracotta text-ivory rounded-xl px-6 py-2.5 hover:bg-coral transition-colors font-medium"
        >
          Manage Tournaments
        </Link>
        <Link
          href="/admin/matches"
          className="bg-terracotta text-ivory rounded-xl px-6 py-2.5 hover:bg-coral transition-colors font-medium"
        >
          Manage Matches
        </Link>
        <Link
          href="/admin/results"
          className="bg-terracotta text-ivory rounded-xl px-6 py-2.5 hover:bg-coral transition-colors font-medium"
        >
          Results & Scoring
        </Link>
        <Link
          href="/admin/users"
          className="bg-terracotta text-ivory rounded-xl px-6 py-2.5 hover:bg-coral transition-colors font-medium"
        >
          Manage Users
        </Link>
      </div>
    </div>
  );
}
