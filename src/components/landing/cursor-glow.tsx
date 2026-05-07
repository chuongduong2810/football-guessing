"use client";

import { useEffect, useRef } from "react";

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    let x = 0, y = 0, currentX = 0, currentY = 0;
    let raf: number;

    function onMove(e: MouseEvent) {
      x = e.clientX;
      y = e.clientY;
    }

    function animate() {
      if (!glow) return;
      currentX += (x - currentX) * 0.08;
      currentY += (y - currentY) * 0.08;
      glow.style.transform = `translate(${currentX - 200}px, ${currentY - 200}px)`;
      raf = requestAnimationFrame(animate);
    }

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed top-0 left-0 z-0 hidden md:block"
      style={{
        width: 400,
        height: 400,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(201,100,66,0.08) 0%, rgba(201,100,66,0.03) 40%, transparent 70%)",
        willChange: "transform",
      }}
    />
  );
}
