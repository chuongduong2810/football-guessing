"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function LoadingBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);

  useEffect(() => {
    if (pathname !== prevPath) {
      setLoading(true);
      setPrevPath(pathname);
      const timeout = setTimeout(() => setLoading(false), 400);
      return () => clearTimeout(timeout);
    }
  }, [pathname, prevPath]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 overflow-hidden bg-border-cream">
      <div className="h-full w-1/2 bg-terracotta loading-bar" />
    </div>
  );
}
