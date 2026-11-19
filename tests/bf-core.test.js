'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const BF = require('../js/bf-core.js');

test('constants are absolute UTC', () => {
  assert.equal(BF.TEASER_START.toISOString(), '2026-11-19T22:00:00.000Z');
  assert.equal(BF.SALE_START.toISOString(), '2026-11-26T16:00:00.000Z');
  assert.equal(BF.SALE_END.toISOString(), '2026-11-30T21:59:59.000Z');
});

test('getPhase boundaries (six instants)', () => {
  const cases = [
    ['2026-11-19T21:59:59Z', 'off'],
    ['2026-11-19T22:00:00Z', 'teaser'],
    ['2026-11-26T15:59:59Z', 'teaser'],
    ['2026-11-26T16:00:00Z', 'sale'],
    ['2026-11-30T21:59:59Z', 'sale'],
    ['2026-11-30T22:00:00Z', 'off'],
  ];
  for (const [iso, want] of cases) assert.equal(BF.getPhase(new Date(iso)), want, iso);
});

test('getPhase ignores visitor timezone (same instant, different offsets)', () => {
  assert.equal(BF.getPhase(new Date('2026-11-20T00:00:00+02:00')), 'teaser');
  assert.equal(BF.getPhase(new Date('2026-11-19T17:00:00-05:00')), 'teaser');
  assert.equal(BF.getPhase(new Date('2026-11-19T23:59:59+02:00')), 'off');
});

test('override wins; invalid override ignored', () => {
  const off = new Date('2026-11-01T00:00:00Z');
  assert.equal(BF.getPhase(off, 'sale'), 'sale');
  assert.equal(BF.getPhase(off, 'teaser'), 'teaser');
  assert.equal(BF.getPhase(new Date('2026-11-27T00:00:00Z'), 'off'), 'off');
  assert.equal(BF.getPhase(off, 'bogus'), 'off');
  assert.equal(BF.getPhase(off, null), 'off');
  assert.equal(BF.getPhase(off, undefined), 'off');
});

test('getOverride reads ?bf= from a query string', () => {
  assert.equal(BF.getOverride('?bf=teaser'), 'teaser');
  assert.equal(BF.getOverride('?x=1&bf=sale'), 'sale');
  assert.equal(BF.getOverride('?bf=off&y=2'), 'off');
  assert.equal(BF.getOverride('?bf=nope'), null);
  assert.equal(BF.getOverride('?abf=sale'), null);
  assert.equal(BF.getOverride(''), null);
  assert.equal(BF.getOverride(undefined), null);
});

test('countdownTo', () => {
  assert.deepEqual(BF.countdownTo(new Date('2026-11-26T15:00:00Z'), 'teaser'), { d: 0, h: 1, m: 0, s: 0 });
  assert.deepEqual(BF.countdownTo(new Date('2026-11-19T22:00:00Z'), 'teaser'), { d: 6, h: 18, m: 0, s: 0 });
  assert.deepEqual(BF.countdownTo(new Date('2026-11-30T21:00:00Z'), 'sale'), { d: 0, h: 0, m: 59, s: 59 });
  assert.equal(BF.countdownTo(new Date('2026-11-26T15:00:00Z'), 'off'), null);
  // forced teaser after the target: clamp to zero, never negative
  assert.deepEqual(BF.countdownTo(new Date('2026-11-27T00:00:00Z'), 'teaser'), { d: 0, h: 0, m: 0, s: 0 });
});

test('formatCountdown uk/en', () => {
  assert.equal(BF.formatCountdown({ d: 2, h: 14, m: 37, s: 5 }, 'uk'), '2д 14год 37хв');
  assert.equal(BF.formatCountdown({ d: 2, h: 14, m: 37, s: 5 }, 'en'), '2d 14h 37m');
  assert.equal(BF.formatCountdown({ d: 0, h: 3, m: 5, s: 0 }, 'en'), '3h 5m');
  assert.equal(BF.formatCountdown({ d: 0, h: 0, m: 7, s: 0 }, 'uk'), '7хв');
});

test('TEXT has every string in both languages', () => {
  const keys = Object.keys(BF.TEXT.en).sort();
  assert.deepEqual(Object.keys(BF.TEXT.uk).sort(), keys);
  for (const lang of ['uk', 'en']) for (const k of keys) assert.ok(BF.TEXT[lang][k], lang + '.' + k);
  assert.equal(BF.TEXT.en.bar, '🎁 Black Friday on 26 Nov: the first course discount ever');
  assert.equal(BF.TEXT.en.barLink, 'Join the early list →');
  assert.equal(BF.TEXT.uk.bar, '🎁 Black Friday 26 листопада: не пропусти єдину можливість знижки на навчання');
  assert.equal(BF.TEXT.uk.pill, '🎁 Black Friday 26 листопада · унікальна можливість');
  assert.ok(BF.TEXT.uk.ticker.includes('COT НАВЧАННЯ ДО −30%'));
  assert.equal(BF.TEXT.uk.barLink, 'Записатися в ранній список →');
  assert.equal(BF.TEXT.en.pill, '🎁 Black Friday on 26 Nov · first discount ever');
  assert.equal(BF.EARLY_LIST_URL, 'https://t.me/NFinanceTradingBot?start=bf');
});

test('no UA campaign string uses the word "курс" (any form)', () => {
  for (const group of [BF.TEXT.uk, BF.SALE_TEXT.uk])
    for (const [k, v] of Object.entries(group)) assert.doesNotMatch(v, /курс/i, k);
});

// page: scrollHeight 5000, viewport 800 -> max scroll 4200, 5% = 210px
const P = (scrollY, extra) => BF.pinState(Object.assign(
  { scrollY, scrollHeight: 5000, innerHeight: 800, dir: 'down', pricingVisible: false, menuOpen: false }, extra));

test('pinState: nav threshold at 120px', () => {
  assert.equal(P(0), 'full');
  assert.equal(P(-30), 'full'); // iOS overscroll bounce
  assert.equal(P(120), 'full');
  assert.equal(P(121), 'bar');
  assert.equal(P(120, { dir: 'up' }), 'full');
});

test('pinState: 5% threshold, then direction decides', () => {
  assert.equal(P(210), 'bar');                  // exactly 5%
  assert.equal(P(211), 'none');                 // past 5%, scrolling down
  assert.equal(P(211, { dir: 'up' }), 'bar');   // past 5%, scrolling up
  assert.equal(P(4200), 'none');                // bottom, down
  assert.equal(P(4200, { dir: 'up' }), 'bar');
  assert.equal(P(200, { dir: 'down' }), 'bar'); // within 5%: bar either way
});

test('pinState: pricing section on screen always shows the bar', () => {
  assert.equal(P(2000, { pricingVisible: true }), 'bar');
  assert.equal(P(2000, { pricingVisible: true, dir: 'up' }), 'bar');
  assert.equal(P(100, { pricingVisible: true }), 'full'); // top of page wins
});

test('pinState: open mobile menu never hides', () => {
  assert.equal(P(2000, { menuOpen: true }), 'full');
  assert.equal(P(300, { menuOpen: true }), 'full');
  assert.equal(P(2000, { menuOpen: true, pricingVisible: true }), 'full');
});

test('pinState: short / non-scrollable pages', () => {
  // max 200 -> 5% = 10px, below the nav threshold
  assert.equal(BF.pinState({ scrollY: 100, scrollHeight: 1000, innerHeight: 800, dir: 'down' }), 'full');
  assert.equal(BF.pinState({ scrollY: 150, scrollHeight: 1000, innerHeight: 800, dir: 'down' }), 'none');
  assert.equal(BF.pinState({ scrollY: 0, scrollHeight: 800, innerHeight: 800, dir: 'down' }), 'full');
  assert.equal(BF.pinState({ scrollY: 200, scrollHeight: 700, innerHeight: 800, dir: 'down' }), 'bar');
});

test('scrollDir: flips only after 8px against the current direction', () => {
  let s = BF.scrollDir(null, 500);
  assert.deepEqual(s, { dir: 'down', anchor: 500 });
  s = BF.scrollDir(s, 600);                     // further down: anchor follows
  assert.deepEqual(s, { dir: 'down', anchor: 600 });
  s = BF.scrollDir(s, 593);                     // 7px up: no flip
  assert.equal(s.dir, 'down');
  s = BF.scrollDir(s, 592);                     // 8px up: flip
  assert.deepEqual(s, { dir: 'up', anchor: 592 });
  s = BF.scrollDir(s, 580);                     // further up
  assert.deepEqual(s, { dir: 'up', anchor: 580 });
  s = BF.scrollDir(s, 587);                     // 7px down: still up
  assert.equal(s.dir, 'up');
  s = BF.scrollDir(s, 588);                     // 8px down: flip
  assert.deepEqual(s, { dir: 'down', anchor: 588 });
});
