"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export function LoadingBar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    setProgress(0);
    setVisible(true);

    requestAnimationFrame(() => {
      setProgress(80);
    });

    const complete = setTimeout(() => {
      setProgress(100);
    }, 150);

    const hide = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 400);

    return () => {
      clearTimeout(complete);
      clearTimeout(hide);
    };
  }, [pathname]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-border-cream"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.2s" }}
    >
      <div
        className="h-full bg-terracotta"
        style={{
          width: `${progress}%`,
          transition: progress === 0 ? "none" : "width 0.3s ease-out",
        }}
      />
    </div>
  );
}
