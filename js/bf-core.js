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
      bar: "🎁 Black Friday 26 листопада: перша знижка на курс в історії",
      barLink: "Записатися в ранній список →",
      pill: "🎁 Black Friday 26 листопада · перша знижка в історії",
      chipPrefix: "Старт через",
      ticker: "BLACK FRIDAY · 26 ЛИСТОПАДА 18:00 КИЇВ · КУРС ДО −30% · ПЕРША ЗНИЖКА З МОМЕНТУ ЗАПУСКУ · ЗАПИШИСЬ У РАННІЙ СПИСОК"
    },
    en: {
      bar: "🎁 Black Friday on 26 Nov: the first course discount ever",
      barLink: "Join the early list →",
      pill: "🎁 Black Friday on 26 Nov · first discount ever",
      chipPrefix: "Starts in",
      ticker: "BLACK FRIDAY · 26 NOV 18:00 KYIV · COURSE UP TO −30% · FIRST DISCOUNT SINCE LAUNCH · JOIN THE EARLY LIST"
    }
  };

  return {
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
