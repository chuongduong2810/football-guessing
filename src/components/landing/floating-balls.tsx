"use client";

import { useEffect, useRef } from "react";

const BALL_COUNT = 8;

export function FloatingBalls() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const balls = Array.from(container.children) as HTMLElement[];
    const speeds = balls.map(() => ({
      x: (Math.random() - 0.5) * 0.3,
      y: (Math.random() - 0.5) * 0.2,
      rot: (Math.random() - 0.5) * 0.5,
    }));
    const positions = balls.map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      rot: Math.random() * 360,
    }));

    let raf: number;

    function animate() {
      for (let i = 0; i < balls.length; i++) {
        positions[i].x += speeds[i].x;
        positions[i].y += speeds[i].y;
        positions[i].rot += speeds[i].rot;

        if (positions[i].x < -5 || positions[i].x > 105) speeds[i].x *= -1;
        if (positions[i].y < -5 || positions[i].y > 105) speeds[i].y *= -1;

        balls[i].style.transform = `translate(${positions[i].x}vw, ${positions[i].y}vh) rotate(${positions[i].rot}deg)`;
      }
      raf = requestAnimationFrame(animate);
    }

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {Array.from({ length: BALL_COUNT }, (_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            width: 20 + Math.random() * 30,
            height: 20 + Math.random() * 30,
            opacity: 0.04 + Math.random() * 0.06,
            willChange: "transform",
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="48" fill="none" stroke="#c96442" strokeWidth="2" />
            <path d="M50 2 L50 98 M2 50 L98 50 M15 15 L85 85 M85 15 L15 85" stroke="#c96442" strokeWidth="1" opacity="0.5" />
            <circle cx="50" cy="50" r="20" fill="none" stroke="#c96442" strokeWidth="1.5" />
          </svg>
        </div>
      ))}
    </div>
  );
}
