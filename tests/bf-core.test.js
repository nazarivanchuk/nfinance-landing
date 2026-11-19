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

test('pinState: nav threshold at 120px', () => {
  // page: scrollHeight 5000, viewport 800 -> max scroll 4200, 40% = 1680px
  assert.equal(BF.pinState(0, 5000, 800), 'full');
  assert.equal(BF.pinState(-30, 5000, 800), 'full'); // iOS overscroll bounce
  assert.equal(BF.pinState(120, 5000, 800), 'full');
  assert.equal(BF.pinState(121, 5000, 800), 'bar');
  assert.equal(BF.pinState(300, 5000, 800), 'bar');
});

test('pinState: bar threshold at 40% of scrollable height', () => {
  assert.equal(BF.pinState(1680, 5000, 800), 'bar');   // exactly 40%
  assert.equal(BF.pinState(1681, 5000, 800), 'none');
  assert.equal(BF.pinState(4200, 5000, 800), 'none');  // bottom
  // scrolling back up restores
  assert.equal(BF.pinState(1679, 5000, 800), 'bar');
  assert.equal(BF.pinState(100, 5000, 800), 'full');
});

test('pinState: short pages', () => {
  // 40% of max (200 * 0.4 = 80px) is below the nav threshold: stays full until 120px
  assert.equal(BF.pinState(100, 1000, 800), 'full');
  assert.equal(BF.pinState(150, 1000, 800), 'none');
  // not scrollable at all
  assert.equal(BF.pinState(0, 800, 800), 'full');
  assert.equal(BF.pinState(200, 700, 800), 'bar');
});
