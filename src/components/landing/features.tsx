"use client";

import { useEffect, useRef, useState } from "react";
import { Target, Trophy, BarChart3, Clock, Zap, Shield } from "lucide-react";

const STEPS = [
  {
    icon: Target,
    title: "Predict Scores",
    description: "Enter your predicted score for upcoming matches before kickoff.",
  },
  {
    icon: Clock,
    title: "Watch & Wait",
    description: "Follow along as matches unfold. Results update automatically.",
  },
  {
    icon: Trophy,
    title: "Earn Points",
    description: "3 points for exact scores, 1 for correct outcomes. Climb the ranks!",
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Live Results",
    description: "Real-time score updates powered by API-Football.",
  },
  {
    icon: BarChart3,
    title: "Leaderboard",
    description: "Compete with friends and track rankings across tournaments.",
  },
  {
    icon: Shield,
    title: "Fair Play",
    description: "Predictions lock at kickoff. No late changes allowed.",
  },
];

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

export function HowItWorks() {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-widest text-terracotta font-medium">How It Works</span>
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-near-black mt-3">
            Three simple steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="relative text-center transition-all duration-700 ease-out"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(30px)",
                transitionDelay: `${i * 150}ms`,
              }}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-terracotta/10 text-terracotta mb-5">
                <step.icon className="w-6 h-6" />
              </div>
              <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-terracotta text-ivory text-xs font-medium flex items-center justify-center md:left-auto md:right-auto md:-top-3 md:mx-auto md:relative md:mb-2">
                {i + 1}
              </div>
              <h3 className="font-serif text-xl font-medium text-near-black mb-2">
                {step.title}
              </h3>
              <p className="text-olive text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Features() {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="py-20 md:py-28 bg-near-black rounded-[2rem] mx-4 md:mx-8 mb-20">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-widest text-coral font-medium">Features</span>
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-ivory mt-3">
            Built for football fans
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((feat, i) => (
            <div
              key={feat.title}
              className="group bg-dark-surface border border-border-dark rounded-2xl p-6 transition-all duration-500 ease-out hover:border-terracotta/30"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
                transitionDelay: `${i * 120}ms`,
              }}
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-terracotta/15 text-terracotta mb-4 group-hover:bg-terracotta/25 transition-colors">
                <feat.icon className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-medium text-ivory mb-2">
                {feat.title}
              </h3>
              <p className="text-warm-silver text-sm leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
