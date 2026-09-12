export interface DriftSpec {
  id: string;
  top: number;
  left: number;
  scale: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
}

export interface BalloonMotion {
  duration: number;
  rise: number;
  tilt: number;
  delay: number;
}

export function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function makeDrifters(kind: 'bird' | 'cloud', count: number): DriftSpec[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${kind}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    /* Keep birds/clouds in the open sky above the landscape horizon. */
    top: rand(4, kind === 'bird' ? 36 : 40),
    left: rand(-8, 88),
    scale: kind === 'bird' ? rand(0.7, 1.25) : rand(0.75, 1.45),
    duration: kind === 'bird' ? rand(9, 18) : rand(28, 48),
    delay: rand(-12, 0),
    driftX: kind === 'bird' ? rand(90, 220) * (Math.random() < 0.5 ? 1 : -1) : rand(40, 120) * (Math.random() < 0.5 ? 1 : -1),
    driftY: kind === 'bird' ? rand(-40, 40) : rand(-18, 18),
  }));
}

export function makeBalloonMotion(): BalloonMotion {
  return {
    duration: rand(3.6, 5.8),
    rise: rand(8, 16),
    tilt: rand(4, 10),
    delay: rand(-2.5, 0),
  };
}

export function makeSkyVisit() {
  return {
    birds: makeDrifters('bird', 1 + Math.floor(Math.random() * 3)),
    clouds: makeDrifters('cloud', 1 + Math.floor(Math.random() * 3)),
  };
}
