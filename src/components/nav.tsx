"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Trophy, Menu, X, LogOut, LayoutDashboard, Shield, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";

export function Nav() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-xl border border-border-cream bg-ivory px-2.5 py-1.5 hover:border-border-warm transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-terracotta text-ivory flex items-center justify-center text-xs font-semibold uppercase">
                    {user.username.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-near-black max-w-[100px] truncate">
                    {user.username}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-stone transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 z-50 w-52 bg-ivory border border-border-cream rounded-xl shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-border-cream">
                        <p className="text-sm font-medium text-near-black truncate">{user.username}</p>
                        <p className="text-xs text-stone truncate">{user.email}</p>
                        {user.role === "admin" && (
                          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium text-terracotta bg-terracotta/10 px-1.5 py-0.5 rounded-full">
                            <Shield className="w-2.5 h-2.5" />
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-olive hover:bg-parchment transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          My Dashboard
                        </Link>
                        {user.role === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-olive hover:bg-parchment transition-colors"
                          >
                            <Shield className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-border-cream py-1">
                        <button
                          onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-error hover:bg-error/5 transition-colors w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
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
              <div className="flex items-center gap-3 pb-3 mb-2 border-b border-border-cream">
                <div className="w-9 h-9 rounded-full bg-terracotta text-ivory flex items-center justify-center text-sm font-semibold uppercase">
                  {user.username.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-near-black truncate">{user.username}</p>
                  <p className="text-xs text-stone truncate">{user.email}</p>
                </div>
              </div>
              <Link href="/dashboard" className="flex items-center gap-2 text-olive hover:text-near-black" onClick={() => setMenuOpen(false)}>
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" className="flex items-center gap-2 text-olive hover:text-near-black" onClick={() => setMenuOpen(false)}>
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}
              <button onClick={handleLogout} className="flex items-center gap-2 text-error hover:text-error/80">
                <LogOut className="w-4 h-4" />
                Sign out
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
