"use client";

import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const root = document.documentElement;
    const timing = getComputedStyle(root)
      .getPropertyValue("--scroll-duration")
      .trim();
    const duration = parseFloat(timing) * (timing.endsWith("ms") ? 1 : 1000);
    let frame = 0;
    let target = window.scrollY;
    let lastTime = 0;
    let expected = window.scrollY;
    let position = window.scrollY;

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    function locked() {
      return getComputedStyle(document.body).overflow === "hidden";
    }
    function tick(time: number) {
      if (locked() || Math.abs(window.scrollY - expected) > 2) {
        stop();
        return;
      }
      const elapsed = Math.min(time - lastTime, 64);
      lastTime = time;
      const remaining = target - position;
      const next =
        Math.abs(remaining) < 3
          ? target
          : position + remaining * (1 - Math.exp(-elapsed / (duration / 3)));
      position = next;
      window.scrollTo({ top: next, behavior: "instant" });
      expected = window.scrollY;
      if (Math.abs(target - expected) < 1) stop();
      else frame = requestAnimationFrame(tick);
    }
    function wheel(event: WheelEvent) {
      if (
        event.defaultPrevented ||
        !event.cancelable ||
        reduced.matches ||
        !finePointer.matches ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        Math.abs(event.deltaX) >= Math.abs(event.deltaY) ||
        locked()
      )
        return;
      // Leave nested scrolling (forms, dialogs and carousels) to the browser.
      for (
        let node = event.target instanceof Element ? event.target : null;
        node && node !== document.body;
        node = node.parentElement
      ) {
        if (node.matches("input, textarea, select, [role=dialog]")) return;
        if (
          /(auto|scroll)/.test(getComputedStyle(node).overflowY) &&
          node.scrollHeight > node.clientHeight
        )
          return;
      }
      const delta =
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      if (!frame) position = target = expected = window.scrollY;
      target = Math.max(
        0,
        Math.min(root.scrollHeight - innerHeight, target + delta),
      );
      if (target === window.scrollY && !frame) return;
      event.preventDefault();
      if (!frame) {
        lastTime = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }
    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", stop);
    window.addEventListener("pointerdown", stop, { passive: true });
    window.addEventListener("resize", stop);
    reduced.addEventListener("change", stop);
    return () => {
      stop();
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", stop);
      window.removeEventListener("pointerdown", stop);
      window.removeEventListener("resize", stop);
      reduced.removeEventListener("change", stop);
    };
  }, []);
  return null;
}
