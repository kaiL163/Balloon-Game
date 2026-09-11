import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const bundle = await build({ entryPoints: ['src/api/MockGameApi.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { MockGameApi, STORAGE_KEY } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
function fixture(random = () => 0.5) {
  let time = 100000;
  const data = new Map();
  const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  const options = { now: () => time, random, storage };
  return { api: new MockGameApi(options), storage, options, advance: (ms) => { time += ms; }, saved: () => JSON.parse(data.get(STORAGE_KEY)) };
}

test('start debits once, preserves theme, rejects duplicate and unknown bets', async () => {
  const f = fixture();
  const round = await f.api.startRound('bet-250', 'RED');
  assert.equal(round.levels, 12);
  assert.equal(round.booster, 3);
  assert.ok(round.boosterLevel >= 2 && round.boosterLevel <= 12);
  assert.equal((await f.api.getProfile()).balance, 750);
  await assert.rejects(f.api.startRound('bet-100', 'GREEN'));
  await assert.rejects(f.api.startRound('missing', 'GREEN'));
  assert.equal((await f.api.getProfile()).balance, 750);
  const reloaded = new MockGameApi(f.options);
  assert.equal((await reloaded.getActiveRound()).id, round.id);
  assert.equal((await reloaded.getProfile()).theme, 'RED');
});

test('cashout disabled before level 1, locks payout, booster missed, flight continues', async () => {
  const f = fixture(() => 0.9);
  const r = await f.api.startRound('bet-400', 'GREEN');
  await assert.rejects(f.api.cashout(r.id), /первого уровня/);
  f.advance(3000);
  const cash = await f.api.cashout(r.id);
  assert.equal(cash.cashoutMultiplier, 1.6);
  assert.equal(cash.payout, 640);
  assert.equal(cash.boosterState, 'MISSED');
  assert.equal((await f.api.getProfile()).balance, 1240);
  await f.api.cashout(r.id);
  assert.equal((await f.api.getProfile()).balance, 1240);
  f.advance(10000);
  const flying = await f.api.advanceRound(r.id);
  assert.ok(flying.multiplier > cash.multiplier);
  assert.equal(flying.payout, 640);
  assert.equal(flying.points, 50);
  f.advance(1000000);
  const crash = await f.api.advanceRound(r.id);
  assert.equal(crash.status, 'crashed');
  assert.equal(crash.multiplier, r.crashMultiplier);
  const result = await f.api.finishRound(r.id);
  assert.equal(result.outcome, 'win');
  assert.equal(result.payout, 640);
  assert.equal(result.points, 90);
  assert.equal((await f.api.getProfile()).gamePoints, 90);
  assert.equal((await f.api.getProfile()).balance, 1240);
  await f.api.finishRound(r.id);
  assert.equal((await f.api.getHistory()).filter((item) => item.id === r.id).length, 1);
  assert.equal((await f.api.getProfile()).gamePoints, 90);
});

test('early crash loses stake; late cashout cannot win; reward and history saved', async () => {
  const f = fixture();
  const r = await f.api.startDemoRound('crash');
  assert.equal(r.boosterLevel, null);
  f.advance(2000);
  await assert.rejects(f.api.cashout(r.id), /лопнул/);
  const result = await f.api.finishRound(r.id);
  assert.equal(result.outcome, 'loss');
  assert.equal(result.payout, 0);
  assert.equal(result.points, 0);
  assert.equal(result.crashMultiplier, 1.3);
  assert.equal((await f.api.getProfile()).balance, 900);
  assert.ok(['Balloon', 'Cloud', 'Bird', 'Trophy'].includes(result.reward));
  assert.equal((await f.api.getHistory())[0].id, r.id);
});

test('win demo automatically cashes out and preserves fixed payout until crash', async () => {
  const f = fixture();
  const r = await f.api.startDemoRound('win');
  assert.equal((await f.api.startDemoRound('win')).id, r.id);
  f.advance(3100);
  const cash = await f.api.advanceRound(r.id);
  assert.equal(cash.cashoutMultiplier, 1.6);
  assert.equal(cash.payout, 160);
  assert.equal(cash.status, 'cashed_out');
  f.advance(20000);
  const result = await f.api.finishRound(r.id);
  assert.equal(result.outcome, 'win');
  assert.equal(result.payout, 160);
  assert.equal((await f.api.getProfile()).balance, 1060);
});

test('booster activates at level 2, jumps 2→6, awards 60 extra, auto cashout 6.45', async () => {
  const f = fixture();
  const r = await f.api.startDemoRound('booster');
  f.advance(5000);
  const boosted = await f.api.advanceRound(r.id);
  assert.equal(boosted.boosterState, 'ACTIVATED');
  assert.equal(boosted.multiplier, 6);
  assert.equal(boosted.points, 80);
  f.advance(1000);
  const cash = await f.api.advanceRound(r.id);
  assert.equal(cash.cashoutMultiplier, 6.45);
  assert.equal(cash.payout, 1612.5);
  f.advance(10000);
  const result = await f.api.finishRound(r.id);
  assert.equal(result.points, 90);
  assert.equal(result.crashMultiplier, 8.4);
  assert.equal((await f.api.getProfile()).balance, 2362.5);
});

test('cashout before demo booster permanently misses it', async () => {
  const f = fixture();
  const r = await f.api.startDemoRound('booster');
  f.advance(3000);
  await f.api.cashout(r.id);
  f.advance(6000);
  const next = await f.api.advanceRound(r.id);
  assert.equal(next.boosterState, 'MISSED');
  assert.ok(next.multiplier < 3);
  assert.equal(next.points, 30);
  assert.equal(next.payout, 400);
});

test('reload mid-flight and large time jumps give identical results to frequent ticks', async () => {
  const a = fixture(), b = fixture();
  const ra = await a.api.startDemoRound('booster'), rb = await b.api.startDemoRound('booster');
  for (let i = 0; i < 400; i++) { a.advance(50); await a.api.advanceRound(ra.id); }
  b.advance(20000);
  const reloaded = new MockGameApi(b.options);
  await reloaded.advanceRound(rb.id);
  const resultA = await a.api.finishRound(ra.id), resultB = await reloaded.finishRound(rb.id);
  for (const key of ['payout', 'points', 'cashoutMultiplier', 'crashMultiplier', 'reward', 'outcome']) assert.equal(resultA[key], resultB[key]);
  assert.equal((await reloaded.getProfile()).gamePoints, resultA.points);
  assert.equal(await reloaded.getActiveRound(), null);
});

test('insufficient balance rejects normal start; demo credits only missing stake', async () => {
  const f = fixture();
  for (let i = 0; i < 10; i++) {
    const r = await f.api.startDemoRound('crash');
    f.advance(2000);
    await f.api.finishRound(r.id);
  }
  assert.equal((await f.api.getProfile()).balance, 0);
  await assert.rejects(f.api.startRound('bet-100', 'RED'), /Недостаточно/);
  const demo = await f.api.startDemoRound('booster');
  assert.equal(demo.bet.amount, 250);
  assert.equal((await f.api.getProfile()).balance, 0);
});

test('storage failure does not debit in-memory balance; returned objects are isolated', async () => {
  const f = fixture();
  f.storage.setItem = () => { throw new Error('quota'); };
  await assert.rejects(f.api.startRound('bet-100', 'GREEN'), /quota/);
  assert.equal((await f.api.getProfile()).balance, 1000);
  const bets = await f.api.getBetOptions();
  bets[0].amount = 0;
  assert.equal((await f.api.getBetOptions())[0].amount, 100);
});
