/** Lightweight Web Audio helpers — no asset files in the repo. */

let sharedCtx: AudioContext | null = null;
let importantUntil = 0;
let birdBusy = false;

function context(): AudioContext {
  if (!sharedCtx) sharedCtx = new AudioContext();
  if (sharedCtx.state === 'suspended') void sharedCtx.resume();
  return sharedCtx;
}

function tone(
  ctx: AudioContext,
  start: number,
  duration: number,
  frequency: number,
  type: OscillatorType,
  gainPeak: number,
  slideTo?: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Short water-drop for theme selection. Safe to call during navigation. */
export function playWaterDrop() {
  try {
    const ctx = context();
    const start = ctx.currentTime;
    importantUntil = Math.max(importantUntil, performance.now() + 450);
    tone(ctx, start, 0.18, 880, 'sine', 0.22, 220);
    tone(ctx, start + 0.05, 0.22, 660, 'sine', 0.12, 140);
  } catch { /* Audio may be blocked until a user gesture; selection still proceeds. */ }
}

function birdChirpA(ctx: AudioContext, at: number) {
  tone(ctx, at, 0.09, 2100, 'triangle', 0.08, 2600);
  tone(ctx, at + 0.1, 0.08, 2400, 'triangle', 0.07, 1900);
  tone(ctx, at + 0.2, 0.11, 2800, 'sine', 0.06, 2200);
  return 0.35;
}

function birdChirpB(ctx: AudioContext, at: number) {
  tone(ctx, at, 0.12, 1600, 'sine', 0.09, 2400);
  tone(ctx, at + 0.14, 0.1, 2000, 'triangle', 0.07, 1500);
  return 0.3;
}

function birdChirpC(ctx: AudioContext, at: number) {
  tone(ctx, at, 0.07, 2500, 'triangle', 0.07, 3100);
  tone(ctx, at + 0.08, 0.07, 2700, 'triangle', 0.065, 2300);
  tone(ctx, at + 0.16, 0.09, 3000, 'sine', 0.05, 1800);
  tone(ctx, at + 0.28, 0.08, 2200, 'sine', 0.045, 1600);
  return 0.42;
}

const chirps = [birdChirpA, birdChirpB, birdChirpC];

function playRandomBird(): number {
  if (birdBusy || performance.now() < importantUntil) return 0;
  try {
    const ctx = context();
    birdBusy = true;
    const duration = chirps[Math.floor(Math.random() * chirps.length)](ctx, ctx.currentTime);
    window.setTimeout(() => { birdBusy = false; }, duration * 1000 + 40);
    return duration;
  } catch {
    birdBusy = false;
    return 0;
  }
}

/** Randomized 1.8–5s bird calls; no overlap; cleaned up on leave. */
export function startBirdAmbience(): () => void {
  let cancelled = false;
  let timer = 0;

  const schedule = () => {
    if (cancelled) return;
    const wait = 1800 + Math.random() * (5000 - 1800);
    timer = window.setTimeout(() => {
      if (cancelled) return;
      playRandomBird();
      schedule();
    }, wait);
  };

  schedule();
  return () => {
    cancelled = true;
    window.clearTimeout(timer);
  };
}
