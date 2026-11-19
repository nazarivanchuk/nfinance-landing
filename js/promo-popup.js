/* Mini-course promo popup.
   3 design variants: "a" centered modal, "b" corner card, "c" sticky bar.
   Preview any variant now with ?promo=a | ?promo=b | ?promo=c (bypasses triggers + cooldown).
   Live trigger: fires after TIME_MS OR after scrolling past SCROLL_FRAC of the page,
   whichever comes first — and is cancelled if the visitor reaches the pricing section. */
(function () {
  "use strict";

  // Black Friday 2026: pause the mini-course popup while the campaign (or a ?bf= preview) runs.
  if (window.BFCore && window.BFCore.getPhase(new Date(), window.BFCore.getOverride(location.search)) !== "off") return;

  var DEFAULT_VARIANT = "b"; // "" = disabled; "a" centered modal | "b" corner card | "c" sticky bar
  var KEY = "nf_minicourse_promo_v1";
  var COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // don't re-show for 3 days after seen/dismissed
  var TIME_MS = 25000; // fallback: 25 seconds
  var SCROLL_FRAC = 0.4; // or when scrolled past 40% of the page
  var PRICING_ID = "plans-section"; // suppress once this section enters the viewport

  var TG = "https://t.me/NFinanceTradingBot?start=minicourse";

  function param() {
    var m = /[?&]promo=([abc])\b/.exec(location.search);
    return m ? m[1] : "";
  }
  function seenRecently() {
    try {
      var t = parseInt(localStorage.getItem(KEY), 10);
      return !!t && Date.now() - t < COOLDOWN_MS;
    } catch (e) { return false; }
  }
  function markSeen() {
    try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
  }
  function anotherModalOpen() {
    return document.body.style.overflow === "hidden" ||
      !!document.querySelector(".cg-backdrop.cg-open, .w--open");
  }

  var el, variant;

  var LANG = /^en\b/i.test(document.documentElement.getAttribute("lang") || "") ? "en" : "uk";
  var T = {
    uk: {
      aria: "Міні-курс", close: "Закрити", head: "Ще не вирішив?", btn: "Спробувати",
      aText: 'Спробуй міні-курс за <span class="mcp-price">$49</span>',
      bText: 'Міні-курс за <span class="mcp-price">$49</span> — швидкий старт з COT.',
      cText: 'Спробуй міні-курс за <span class="mcp-price">$49</span>'
    },
    en: {
      aria: "Mini-course", close: "Close", head: "Still deciding?", btn: "Try it",
      aText: 'Try the mini-course for <span class="mcp-price">$49</span>',
      bText: 'Mini-course for <span class="mcp-price">$49</span> — a fast start with COT.',
      cText: 'Try the mini-course for <span class="mcp-price">$49</span>'
    }
  }[LANG];

  var CTA = '<a class="mcp-btn" href="' + TG + '" target="_blank" rel="noopener">' + T.btn + "</a>";
  var CLOSE = '<button class="mcp-close" type="button" aria-label="' + T.close + '">&#10005;</button>';

  var MARKUP = {
    a:
      '<div class="mcp-card" role="dialog" aria-modal="true" aria-label="' + T.aria + '">' +
      CLOSE +
      '<h3 class="mcp-title">' + T.head + "</h3>" +
      '<p class="mcp-text">' + T.aText + "</p>" +
      CTA +
      "</div>",
    b:
      CLOSE +
      '<p class="mcp-kicker">' + T.head + "</p>" +
      '<p class="mcp-text">' + T.bText + "</p>" +
      CTA,
    c:
      '<p class="mcp-text"><span class="mcp-kicker">' + T.head + "</span> " + T.cText + "</p>" +
      '<div class="mcp-bar-actions">' + CTA + CLOSE + "</div>"
  };

  function build(v) {
    variant = v;
    el = document.createElement("div");
    el.className = "mcp mcp-" + v;
    el.innerHTML = MARKUP[v];
    document.body.appendChild(el);

    el.addEventListener("click", function (e) {
      if ((v === "a" && e.target === el) || e.target.closest(".mcp-close")) { hide(); return; }
      if (e.target.closest(".mcp-btn")) markSeen();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && el && el.classList.contains("mcp-open")) hide();
    });
  }

  function show(v, force) {
    if (!force && seenRecently()) return;
    if (!force && anotherModalOpen()) { setTimeout(function () { show(v, force); }, 20000); return; }
    if (!el) build(v);
    setTimeout(function () { el.classList.add("mcp-open"); }, 30);
  }

  function hide() {
    if (!el) return;
    el.classList.remove("mcp-open");
    markSeen();
  }

  var forced = param();
  if (forced) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { show(forced, true); });
    } else { show(forced, true); }
    return;
  }

  if (!DEFAULT_VARIANT || seenRecently()) return;

  var done = false;
  var timer;

  function scrolledFrac() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? window.scrollY / max : 0;
  }
  function reachedPricing() {
    var p = document.getElementById(PRICING_ID);
    return !!p && p.getBoundingClientRect().top < window.innerHeight;
  }
  function stopWatching() {
    clearTimeout(timer);
    window.removeEventListener("scroll", onScroll);
  }
  function fire() {
    if (done) return;
    done = true;
    stopWatching();
    if (reachedPricing()) return; // visitor is already comparing tiers — don't interrupt
    show(DEFAULT_VARIANT, false);
  }
  function onScroll() {
    if (done) return;
    if (reachedPricing()) { done = true; stopWatching(); return; }
    if (scrolledFrac() >= SCROLL_FRAC) fire();
  }
  function start() {
    timer = setTimeout(fire, TIME_MS);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // handle a page that loads already scrolled (e.g. via #anchor)
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
