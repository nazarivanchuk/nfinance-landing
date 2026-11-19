/* Black Friday 2026 — pure campaign core (no DOM).
   Browser: window.BFCore. Node: module.exports (tests in tests/bf-core.test.js).
   All instants are absolute UTC, so every visitor sees the same phase and countdown
   regardless of their own timezone. Same constants as nf-institutional-flow and nfif-bot. */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BFCore = api;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var TEASER_START = new Date("2026-11-19T22:00:00Z"); // 20 Nov 00:00 Kyiv
  var SALE_START = new Date("2026-11-26T16:00:00Z");   // 26 Nov 18:00 Kyiv
  var SALE_END = new Date("2026-11-30T21:59:59Z");     // 30 Nov 23:59:59 Kyiv
  var PHASES = { off: 1, teaser: 1, sale: 1 };
  var EARLY_LIST_URL = "https://t.me/NFinanceTradingBot?start=bf";

  function getPhase(now, override) {
    if (override && PHASES[override] === 1) return override;
    var t = now.getTime();
    if (t < TEASER_START.getTime()) return "off";
    if (t < SALE_START.getTime()) return "teaser";
    if (t <= SALE_END.getTime()) return "sale";
    return "off";
  }

  // Reads ?bf=teaser|sale|off from a location.search string; anything else → null.
  function getOverride(search) {
    var m = /[?&]bf=([a-z]+)(?:&|$)/.exec(search || "");
    return m && PHASES[m[1]] === 1 ? m[1] : null;
  }

  // Time left to SALE_START (teaser) or SALE_END (sale); null when off. Never negative.
  function countdownTo(now, phase) {
    var target = phase === "teaser" ? SALE_START : phase === "sale" ? SALE_END : null;
    if (!target) return null;
    var sec = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
    return {
      d: Math.floor(sec / 86400),
      h: Math.floor((sec % 86400) / 3600),
      m: Math.floor((sec % 3600) / 60),
      s: sec % 60
    };
  }

  var UNITS = { uk: ["д", "год", "хв"], en: ["d", "h", "m"] };

  // "2д 14год 37хв" / "2d 14h 37m"; leading zero units are dropped, minutes always shown.
  function formatCountdown(p, lang) {
    var u = UNITS[lang] || UNITS.en;
    var out = [];
    if (p.d > 0) out.push(p.d + u[0]);
    if (p.d > 0 || p.h > 0) out.push(p.h + u[1]);
    out.push(p.m + u[2]);
    return out.join(" ");
  }

  var TEXT = {
    uk: {
      bar: "🎁 Black Friday 26 листопада: не пропусти єдину можливість знижки на навчання",
      barLink: "Записатися в ранній список →",
      pill: "🎁 Black Friday 26 листопада · унікальна можливість",
      chipPrefix: "Старт через",
      ticker: "BLACK FRIDAY · 26 ЛИСТОПАДА 18:00 КИЇВ · COT НАВЧАННЯ ДО −30% · ПЕРША ЗНИЖКА З МОМЕНТУ ЗАПУСКУ · ЗАПИШИСЬ У РАННІЙ СПИСОК"
    },
    en: {
      bar: "🎁 Black Friday on 26 Nov: the first course discount ever",
      barLink: "Join the early list →",
      pill: "🎁 Black Friday on 26 Nov · first discount ever",
      chipPrefix: "Starts in",
      ticker: "BLACK FRIDAY · 26 NOV 18:00 KYIV · COURSE UP TO −30% · FIRST DISCOUNT SINCE LAUNCH · JOIN THE EARLY LIST"
    }
  };

  // ---- Sale phase: course prices (USD) and pure price helpers ----
  var PLANS_ANCHOR = "#plans-section";
  var NFIF_PRICING_URL = "https://www.nfif.pro/#pricing";
  // Sale phase: bare bot CTAs open the course catalog (BF prices) via ?start=course.
  var COURSE_BOT_URL = "https://t.me/NFinanceTradingBot?start=course";
  function saleBotHref(href) {
    return /^https:\/\/t\.me\/NFinanceTradingBot\/?$/i.test(href || "") ? COURSE_BOT_URL : null;
  }
  var COURSE_PRICES = {
    course_junior: { normal: 399, sale: 339, days: 60, months: 2 },
    course_middle: { normal: 699, sale: 559, days: 120, months: 4 },
    course_pro: { normal: 1199, sale: 839, days: 365, months: 12 }
  };

  function discountPct(key) {
    var p = COURSE_PRICES[key];
    return Math.round((1 - p.sale / p.normal) * 100);
  }
  function savingUsd(key) { var p = COURSE_PRICES[key]; return p.normal - p.sale; }

  // "$339" (whole, no decimals given) or "$5.65" / "$5,65" (uk uses a decimal comma).
  function formatUsd(v, lang, decimals) {
    var s = decimals == null ? String(v) : v.toFixed(decimals);
    if (lang === "uk") s = s.replace(".", ",");
    return "$" + s;
  }

  // ---- Sale price animation (pure; bf.js drives the frames) ----
  // Ease-out cubic on t in [0,1]; clamps outside.
  function easeOutCubic(t) {
    if (!(t > 0)) return 0;
    if (t >= 1) return 1;
    var u = 1 - t;
    return 1 - u * u * u;
  }

  // Price string for frame t (0..1) of the count-down from -> to. Intermediate frames
  // round to whole dollars (or to `decimals`); t >= 1 is exactly formatUsd(to, ...),
  // the same string the static render shows, so the animation always lands on it.
  function priceFrame(from, to, t, lang, decimals) {
    if (t >= 1) return formatUsd(to, lang, decimals);
    var v = from + (to - from) * easeOutCubic(t);
    var f = Math.pow(10, decimals || 0);
    v = Math.round(v * f) / f;
    // Never show the final value before the last frame (or overshoot it).
    if (to < from ? v <= to : v >= to) v = to + (to < from ? 1 : -1) / f;
    return formatUsd(v, lang, decimals);
  }

  var SALE_TEXT = {
    uk: {
      bar: "🎁 Перша знижка в історії. Тільки на Black Friday: до −30% на COT Навчання",
      plansLink: "Дивитись тарифи →",
      plansLinkShort: "Тарифи →",
      nfifLink: "NFIF −50% →",
      pill: "🎁 Black Friday · унікальна можливість",
      cta: "Почати навчання · до −30%",
      chipPrefix: "Закінчується через",
      badge: "🎁 −30% · BF",
      oldPriceLabel: "Стара ціна",
      ribbon: "ЕКОНОМІЯ $360",
      ticker: "PRO $839 ▼30% · MIDDLE $559 ▼20% · JUNIOR $339 ▼15% · ПЕРША ЗНИЖКА З МОМЕНТУ ЗАПУСКУ · ЗНИЖКИ ДО −50% · ЗАКІНЧУЄТЬСЯ В ПОНЕДІЛОК О 23:59 КИЇВ!"
    },
    en: {
      bar: "🎁 The first discount ever. Only on Black Friday: up to −30% on the course",
      plansLink: "See plans →",
      plansLinkShort: "Plans →",
      nfifLink: "NFIF −50% →",
      pill: "🎁 Black Friday · first discount ever",
      cta: "Start learning · up to −30%",
      chipPrefix: "Ends in",
      badge: "🎁 −30% · BF",
      oldPriceLabel: "Old price",
      ribbon: "SAVE $360",
      ticker: "PRO $839 ▼30% · MIDDLE $559 ▼20% · JUNIOR $339 ▼15% · FIRST DISCOUNT SINCE LAUNCH · SALES UP TO −50% · ENDS MONDAY 23:59 KYIV!"
    }
  };

  return {
    PLANS_ANCHOR: PLANS_ANCHOR,
    NFIF_PRICING_URL: NFIF_PRICING_URL,
    COURSE_BOT_URL: COURSE_BOT_URL,
    saleBotHref: saleBotHref,
    COURSE_PRICES: COURSE_PRICES,
    SALE_TEXT: SALE_TEXT,
    discountPct: discountPct,
    savingUsd: savingUsd,
    formatUsd: formatUsd,
    easeOutCubic: easeOutCubic,
    priceFrame: priceFrame,
    TEASER_START: TEASER_START,
    SALE_START: SALE_START,
    SALE_END: SALE_END,
    EARLY_LIST_URL: EARLY_LIST_URL,
    TEXT: TEXT,
    getPhase: getPhase,
    getOverride: getOverride,
    countdownTo: countdownTo,
    formatCountdown: formatCountdown
  };
});
