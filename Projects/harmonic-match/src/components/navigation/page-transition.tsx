"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== previousPathname.current) {
      setIsTransitioning(true);

      // Start fade out
      const fadeOutTimer = setTimeout(() => {
        setDisplayChildren(children);
        previousPathname.current = pathname;

        // Start fade in
        const fadeInTimer = setTimeout(() => {
          setIsTransitioning(false);
        }, 50);

        return () => clearTimeout(fadeInTimer);
      }, 150);

      return () => clearTimeout(fadeOutTimer);
    } else {
      setDisplayChildren(children);
    }
  }, [children, pathname]);

  return (
    <div
      className={cn(
        "transition-all duration-150 ease-in-out",
        isTransitioning ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0",
        className
      )}
    >
      {displayChildren}
    </div>
  );
}
