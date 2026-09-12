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
    tone(ctx, start, 0.16, 1050, 'sine', 0.18, 310);
    tone(ctx, start + 0.035, 0.2, 720, 'sine', 0.1, 180);
  } catch { /* Audio may be blocked until a user gesture; selection still proceeds. */ }
}

/** Call from a click so later in-flight effects are allowed to play. */
export function prepareGameAudio() {
  try { context(); } catch { /* The game remains fully usable without audio. */ }
}

export function playUiClick() {
  try {
    const ctx = context();
    tone(ctx, ctx.currentTime, 0.06, 520, 'sine', 0.025, 420);
  } catch { /* UI actions never depend on audio. */ }
}

export function playBetSelection() {
  try {
    const ctx = context();
    const start = ctx.currentTime;
    tone(ctx, start, 0.09, 330, 'triangle', 0.055, 440);
    tone(ctx, start + 0.05, 0.12, 550, 'sine', 0.045, 660);
  } catch { /* UI actions never depend on audio. */ }
}

export function playLaunch() {
  try {
    const ctx = context();
    const start = ctx.currentTime;
    importantUntil = Math.max(importantUntil, performance.now() + 1100);
    tone(ctx, start, 0.5, 110, 'sine', 0.09, 440);
    tone(ctx, start + 0.14, 0.55, 220, 'triangle', 0.07, 880);
  } catch { /* The flight still starts if audio is unavailable. */ }
}

export function playLevelReached() {
  try {
    const ctx = context();
    const start = ctx.currentTime;
    tone(ctx, start, 0.12, 660, 'sine', 0.06, 790);
    tone(ctx, start + 0.07, 0.16, 880, 'triangle', 0.045, 990);
  } catch { /* Level progress remains visible. */ }
}

/** Bright reward chord played when a route booster opens. */
export function playBoosterActivation() {
  try {
    const ctx = context();
    const start = ctx.currentTime;
    importantUntil = Math.max(importantUntil, performance.now() + 900);
    tone(ctx, start, 0.28, 440, 'triangle', 0.14, 880);
    tone(ctx, start + 0.08, 0.34, 660, 'sine', 0.11, 1320);
    tone(ctx, start + 0.16, 0.42, 880, 'sine', 0.09, 1760);
  } catch { /* Audio can remain blocked; the visual activation still plays. */ }
}

export function playCashout() {
  try {
    const ctx = context();
    const start = ctx.currentTime;
    importantUntil = Math.max(importantUntil, performance.now() + 900);
    tone(ctx, start, 0.18, 523, 'triangle', 0.1, 659);
    tone(ctx, start + 0.1, 0.22, 659, 'triangle', 0.09, 784);
    tone(ctx, start + 0.2, 0.3, 784, 'sine', 0.075, 1047);
  } catch { /* Cashout remains confirmed visually. */ }
}

export function playCrash() {
  try {
    const ctx = context();
    const start = ctx.currentTime;
    importantUntil = Math.max(importantUntil, performance.now() + 1200);
    tone(ctx, start, 0.42, 180, 'sawtooth', 0.11, 45);
    tone(ctx, start + 0.03, 0.28, 95, 'square', 0.055, 30);
  } catch { /* Crash remains visible. */ }
}

export function playResult(outcome: 'win' | 'loss') {
  try {
    const ctx = context();
    const start = ctx.currentTime;
    importantUntil = Math.max(importantUntil, performance.now() + 1000);
    if (outcome === 'win') {
      tone(ctx, start, 0.2, 523, 'triangle', 0.07, 659);
      tone(ctx, start + 0.13, 0.24, 659, 'triangle', 0.07, 784);
      tone(ctx, start + 0.26, 0.4, 784, 'sine', 0.075, 1047);
    } else {
      tone(ctx, start, 0.3, 294, 'triangle', 0.055, 220);
      tone(ctx, start + 0.16, 0.36, 220, 'sine', 0.045, 147);
    }
  } catch { /* Results remain visible. */ }
}

/** Quiet feedback for buttons and links across every route. */
export function startInterfaceSounds(): () => void {
  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target.closest('button, a, [role="button"]') : null;
    if (!target || target.matches(':disabled, [aria-disabled="true"]')) return;
    if (target.getAttribute('data-sound') === 'water-drop') return;
    playUiClick();
  };
  document.addEventListener('click', onClick);
  return () => document.removeEventListener('click', onClick);
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
