"use client";

import { RefObject, useEffect, useRef, useState } from "react";

interface Options {
  root?: RefObject<Element | null>;
  rootMargin?: string;
  enabled?: boolean;
}

/**
 * Calls `onIntersect` whenever the element given to the returned callback
 * ref scrolls into view.
 *
 * The observer is rebuilt whenever `enabled` flips back on, and a fresh
 * observer reports the current state immediately — so a sentinel that is
 * *still* visible after a page loads triggers the next load, too.
 */
export function useIntersectionObserver<T extends Element>(
  onIntersect: () => void,
  { root, rootMargin = "0px", enabled = true }: Options = {}
) {
  const callbackRef = useRef(onIntersect);
  const [target, setTarget] = useState<T | null>(null);

  useEffect(() => {
    callbackRef.current = onIntersect;
  }, [onIntersect]);

  useEffect(() => {
    if (!enabled || !target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) callbackRef.current();
      },
      { root: root?.current ?? null, rootMargin }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [enabled, target, root, rootMargin]);

  return setTarget;
}
