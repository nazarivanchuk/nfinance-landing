'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const BF = require('../js/bf-core.js');

test('course sale prices match global constraints', () => {
  const P = BF.COURSE_PRICES;
  assert.deepEqual(
    Object.keys(P).sort(), ['course_junior', 'course_middle', 'course_pro']);
  assert.equal(P.course_junior.sale, 339); assert.equal(P.course_junior.normal, 399);
  assert.equal(P.course_middle.sale, 559); assert.equal(P.course_middle.normal, 699);
  assert.equal(P.course_pro.sale, 839); assert.equal(P.course_pro.normal, 1199);
  assert.equal(P.course_junior.days, 60);
  assert.equal(P.course_middle.days, 120);
  assert.equal(P.course_pro.days, 365);
});

test('saleBotHref: bare bot links → ?start=course, others untouched', () => {
  assert.equal(BF.COURSE_BOT_URL, 'https://t.me/NFinanceTradingBot?start=course');
  assert.equal(BF.saleBotHref('https://t.me/NFinanceTradingBot'), BF.COURSE_BOT_URL);
  assert.equal(BF.saleBotHref('https://t.me/NFinanceTradingBot/'), BF.COURSE_BOT_URL);
  assert.equal(BF.saleBotHref('https://t.me/NFinanceTradingBot?start=bf'), null);
  assert.equal(BF.saleBotHref('https://t.me/NFinanceTradingBot?start=course'), null);
  assert.equal(BF.saleBotHref('https://t.me/nfmanager'), null);
  assert.equal(BF.saleBotHref(null), null);
});

test('every bot CTA in both pages is a bare bot link the sale rewrites', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  for (const f of ['index.html', 'en/index.html']) {
    const html = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    const hrefs = [...html.matchAll(/href="(https:\/\/t\.me\/NFinanceTradingBot[^"]*)"/g)].map(m => m[1]);
    assert.ok(hrefs.length > 0, f);
    for (const h of hrefs) assert.equal(BF.saleBotHref(h), BF.COURSE_BOT_URL, f + ' ' + h);
  }
});

test('discountPct', () => {
  assert.equal(BF.discountPct('course_pro'), 30);
  assert.equal(BF.discountPct('course_middle'), 20);
  assert.equal(BF.discountPct('course_junior'), 15);
});

test('formatUsd: whole vs fixed decimals, uk comma', () => {
  assert.equal(BF.formatUsd(339, 'en'), '$339');
  assert.equal(BF.formatUsd(1199, 'uk'), '$1199');
  assert.equal(BF.formatUsd(5.65, 'en', 2), '$5.65');
  assert.equal(BF.formatUsd(5.65, 'uk', 2), '$5,65');
  assert.equal(BF.formatUsd(2.3, 'en', 2), '$2.30');
  assert.equal(BF.formatUsd(169.5, 'uk', 2), '$169,50');
  assert.equal(BF.formatUsd(169.5, 'en', 2), '$169.50');
});

test('per-day / per-month helpers are gone (sale shows old + new price only)', () => {
  for (const k of ['perDay', 'perMonth', 'rateLabel', 'rateUnit']) assert.equal(BF[k], undefined, k);
});

test('savingUsd matches the Pro ribbon', () => {
  assert.equal(BF.savingUsd('course_pro'), 360);
  assert.equal(BF.SALE_TEXT.en.ribbon, 'SAVE ' + BF.formatUsd(BF.savingUsd('course_pro'), 'en'));
  assert.equal(BF.SALE_TEXT.uk.ribbon, 'ЕКОНОМІЯ ' + BF.formatUsd(BF.savingUsd('course_pro'), 'uk'));
});

test('SALE_TEXT verbatim strings, key parity', () => {
  const S = BF.SALE_TEXT;
  assert.deepEqual(Object.keys(S.uk).sort(), Object.keys(S.en).sort());
  for (const lang of ['uk', 'en']) for (const k of Object.keys(S.en)) assert.ok(S[lang][k], lang + '.' + k);
  assert.equal(S.en.bar, '🎁 The first discount ever. Only on Black Friday: up to −30% on the course');
  assert.equal(S.uk.bar, '🎁 Перша знижка в історії. Тільки на Black Friday: до −30% на COT Навчання');
  assert.equal(S.en.plansLink, 'See plans →');
  assert.equal(S.uk.plansLink, 'Дивитись тарифи →');
  assert.equal(S.en.plansLinkShort, 'Plans →');
  assert.equal(S.uk.plansLinkShort, 'Тарифи →');
  assert.equal(S.en.nfifLink, 'NFIF −50% →');
  assert.equal(S.uk.nfifLink, 'NFIF −50% →');
  assert.equal(S.en.pill, '🎁 Black Friday · first discount ever');
  assert.equal(S.uk.pill, '🎁 Black Friday · унікальна можливість');
  assert.equal(S.en.cta, 'Start learning · up to −30%');
  assert.equal(S.uk.cta, 'Почати навчання · до −30%');
  assert.equal(S.en.badge, '🎁 −30% · BF');
  assert.equal(S.uk.badge, '🎁 −30% · BF');
  assert.equal(S.en.ticker, 'PRO $839 ▼30% · MIDDLE $559 ▼20% · JUNIOR $339 ▼15% · FIRST DISCOUNT SINCE LAUNCH · SALES UP TO −50% · ENDS MONDAY 23:59 KYIV!');
  assert.equal(S.uk.ticker, 'PRO $839 ▼30% · MIDDLE $559 ▼20% · JUNIOR $339 ▼15% · ПЕРША ЗНИЖКА З МОМЕНТУ ЗАПУСКУ · ЗНИЖКИ ДО −50% · ЗАКІНЧУЄТЬСЯ В ПОНЕДІЛОК О 23:59 КИЇВ!');
  assert.equal(S.en.chipPrefix + ' ' + BF.formatCountdown({ d: 2, h: 14, m: 37, s: 0 }, 'en'), 'Ends in 2d 14h 37m');
  assert.equal(S.uk.chipPrefix + ' ' + BF.formatCountdown({ d: 2, h: 14, m: 37, s: 0 }, 'uk'), 'Закінчується через 2д 14год 37хв');
  assert.equal(BF.PLANS_ANCHOR, '#plans-section');
  assert.equal(BF.NFIF_PRICING_URL, 'https://www.nfif.pro/#pricing');
});
