import canvasConfetti from 'canvas-confetti';

let lastFiredTime = 0;
const THROTTLE_WINDOW_MS = 120;

export type ConfettiOptions = canvasConfetti.Options;

/**
 * High-performance, hardware-friendly confetti wrapper:
 * 1. Automatically reduces particle count by 50-60% on mobile devices to prevent GPU drop-frames.
 * 2. Throttles rapid successive bursts to protect canvas performance.
 * 3. Skips rendering when the tab is backgrounded (document.hidden).
 * 4. Strictly respects user's prefers-reduced-motion setting.
 */
export function confetti(opts?: ConfettiOptions): Promise<undefined> | null {
  if (typeof window === 'undefined') return null;

  // Don't render confetti if the document is hidden
  if (document.hidden) return null;

  const now = performance.now();
  if (now - lastFiredTime < THROTTLE_WINDOW_MS) {
    return null;
  }
  lastFiredTime = now;

  // Respect system reduced-motion preference
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (prefersReduced) {
    return canvasConfetti({
      ...opts,
      particleCount: Math.min(opts?.particleCount ?? 12, 12),
      spread: Math.min(opts?.spread ?? 35, 35),
      disableForReducedMotion: true,
    });
  }

  // Detect mobile / touch devices with lower GPU headroom
  const isMobile =
    window.innerWidth < 768 ||
    (typeof navigator !== 'undefined' &&
      (navigator.maxTouchPoints > 0 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)));

  const baseCount = opts?.particleCount ?? 50;
  // Reduce particle count on mobile (capped at 35) to maintain solid 60 FPS
  const adjustedCount = isMobile ? Math.min(Math.round(baseCount * 0.45), 35) : baseCount;

  return canvasConfetti({
    ...opts,
    particleCount: adjustedCount,
    disableForReducedMotion: true,
  });
}

// Pass-through static methods for full canvas-confetti compatibility
confetti.reset = () => {
  if (typeof window !== 'undefined' && canvasConfetti.reset) {
    canvasConfetti.reset();
  }
};

confetti.create = canvasConfetti.create;

export default confetti;
