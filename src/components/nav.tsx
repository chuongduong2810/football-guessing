"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Trophy, Menu, X, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";

export function Nav() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile(userId: string) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (data) setUser(data);
    }

    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        fetchProfile(authUser.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, setUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-ivory/80 backdrop-blur-sm border-b border-border-cream">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-near-black hover:text-terracotta transition-colors">
          <Trophy className="w-5 h-5 text-terracotta" />
          <span className="font-serif text-lg font-medium">Football Predictions</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/" className="text-olive hover:text-near-black transition-colors">
            Matches
          </Link>
          <Link href="/leaderboard" className="text-olive hover:text-near-black transition-colors">
            Leaderboard
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-olive hover:text-near-black transition-colors flex items-center gap-1">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" className="text-olive hover:text-near-black transition-colors flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}
              <span className="text-stone text-xs">
                {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-olive hover:text-error transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-olive hover:text-near-black transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-terracotta text-ivory px-4 py-1.5 rounded-lg text-sm hover:bg-coral transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </nav>

        <button
          className="md:hidden text-olive"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border-cream bg-ivory p-4 space-y-3">
          <Link href="/" className="block text-olive hover:text-near-black" onClick={() => setMenuOpen(false)}>
            Matches
          </Link>
          <Link href="/leaderboard" className="block text-olive hover:text-near-black" onClick={() => setMenuOpen(false)}>
            Leaderboard
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="block text-olive hover:text-near-black" onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" className="block text-olive hover:text-near-black" onClick={() => setMenuOpen(false)}>
                  Admin
                </Link>
              )}
              <button onClick={handleLogout} className="block text-olive hover:text-error">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="block text-olive hover:text-near-black" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
              <Link href="/register" className="block text-olive hover:text-near-black" onClick={() => setMenuOpen(false)}>
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
