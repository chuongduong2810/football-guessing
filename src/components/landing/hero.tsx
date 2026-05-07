"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Trophy, ArrowRight, Zap, Target, BarChart3 } from "lucide-react";

const WORDS = ["Predict.", "Compete.", "Win."];

function TypingText() {
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = WORDS[wordIdx];
    const speed = deleting ? 60 : 120;

    if (!deleting && charIdx === word.length) {
      const pause = setTimeout(() => setDeleting(true), 1800);
      return () => clearTimeout(pause);
    }

    if (deleting && charIdx === 0) {
      setDeleting(false);
      setWordIdx((i) => (i + 1) % WORDS.length);
      return;
    }

    const timeout = setTimeout(() => {
      setCharIdx((c) => c + (deleting ? -1 : 1));
    }, speed);

    return () => clearTimeout(timeout);
  }, [charIdx, deleting, wordIdx]);

  return (
    <span className="text-terracotta">
      {WORDS[wordIdx].slice(0, charIdx)}
      <span className="animate-pulse">|</span>
    </span>
  );
}

export function Hero({ stats }: { stats: { matches: number; predictions: number; tournaments: number } }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      <div
        className="transition-all duration-1000 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(30px)",
        }}
      >
        <div className="inline-flex items-center gap-2 bg-terracotta/10 text-terracotta rounded-full px-4 py-1.5 text-sm font-medium mb-8">
          <Zap className="w-3.5 h-3.5" />
          Live Football Predictions
        </div>

        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-medium text-near-black mb-6 leading-[1.1]">
          Football<br />
          <TypingText />
        </h1>

        <p className="text-olive text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
          Predict match scores, compete on the leaderboard,
          and prove you know the beautiful game.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/register"
            className="group flex items-center gap-2 bg-terracotta text-ivory rounded-xl px-8 py-3.5 font-medium hover:bg-coral transition-all hover:gap-3 text-lg"
          >
            Get Started
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/leaderboard"
            className="flex items-center gap-2 bg-sand text-charcoal rounded-xl px-8 py-3.5 font-medium hover:bg-border-warm transition-colors"
          >
            <Trophy className="w-5 h-5" />
            Leaderboard
          </Link>
        </div>
      </div>

      <div
        className="grid grid-cols-3 gap-6 md:gap-10 transition-all duration-1000 delay-300 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
        }}
      >
        <StatPill icon={<Target className="w-4 h-4" />} value={stats.matches} label="Matches" />
        <StatPill icon={<BarChart3 className="w-4 h-4" />} value={stats.predictions} label="Predictions" />
        <StatPill icon={<Trophy className="w-4 h-4" />} value={stats.tournaments} label="Tournaments" />
      </div>
    </section>
  );
}

function StatPill({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    const duration = 1200;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2 text-terracotta">{icon}</div>
      <p className="text-2xl md:text-3xl font-serif font-medium text-near-black">{count}</p>
      <p className="text-xs md:text-sm text-stone">{label}</p>
    </div>
  );
}
