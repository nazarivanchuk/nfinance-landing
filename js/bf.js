/* Black Friday 2026 — DOM layer for the course site (needs js/bf-core.js first).
   Phase from BFCore.getPhase(now, ?bf= override). 'off' → does nothing at all.
   One render function per phase (teaser, sale).
   Swap targets in the HTML: data-bf="pill" | "cta" | "hero"; data-bf-price="course_*". */
(function () {
  "use strict";
  var BF = window.BFCore;
  if (!BF) return;

  var override = BF.getOverride(location.search);
  var phase = BF.getPhase(new Date(), override);
  if (phase === "off") return;

  var cleanups = []; // undo steps for everything a render adds (used by in-place re-render)
  var LANG = /^en\b/i.test(document.documentElement.getAttribute("lang") || "") ? "en" : "uk";
  var T = BF.TEXT[LANG];
  var S = BF.SALE_TEXT[LANG];

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // Top bar is position:fixed above the fixed Webflow nav; its real height (it wraps on
  // phones) goes into --bf-bar-h, which pushes the nav and the page content down.
  function link(cls, text, href, newTab) {
    var a = el("a", cls, text);
    a.href = href;
    if (newTab) { a.target = "_blank"; a.rel = "noopener"; }
    return a;
  }

  // fill(inner) adds the bar content; extraCls is a modifier class (sale = violet bar).
  function mountBar(fill, extraCls) {
    var bar = el("div", "bf-bar" + (extraCls ? " " + extraCls : ""));
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Black Friday");
    var inner = el("div", "bf-bar-inner");
    fill(inner);
    bar.appendChild(inner);
    document.body.insertBefore(bar, document.body.firstChild);

    var root = document.documentElement;
    function sync() {
      if (bar.parentNode) root.style.setProperty("--bf-bar-h", bar.offsetHeight + "px");
    }
    sync();
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(sync); // catches wrap changes from resize, fonts, zoom
      ro.observe(bar);
      cleanups.push(function () { ro.disconnect(); });
    } else {
      window.addEventListener("resize", sync);
      window.addEventListener("orientationchange", sync);
      cleanups.push(function () {
        window.removeEventListener("resize", sync);
        window.removeEventListener("orientationchange", sync);
      });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync);
    cleanups.push(function () {
      bar.parentNode && bar.parentNode.removeChild(bar);
      root.style.removeProperty("--bf-bar-h");
    });
  }

  // Replace an element's text and register the undo step.
  function swapText(node, text) {
    if (!node) return;
    var original = node.textContent;
    node.textContent = text;
    cleanups.push(function () { node.textContent = original; });
  }

  function swapPill(text) {
    var pill = document.querySelector('[data-bf="pill"]');
    if (!pill) return;
    swapText(pill.querySelector("p") || pill, text);
  }

  function mountTicker(text) {
    var hero = document.querySelector('[data-bf="hero"]');
    if (!hero || !hero.parentNode) return;
    var tk = el("div", "bf-ticker");
    var track = el("div", "bf-ticker-track");
    for (var i = 0; i < 2; i++) {
      // The "·" between copies is CSS (::after), so a lone copy never ends with a separator.
      var item = el("span", "bf-ticker-item", text);
      if (i) item.setAttribute("aria-hidden", "true"); // 2nd copy only makes the loop seamless
      track.appendChild(item);
    }
    tk.appendChild(track);
    hero.parentNode.insertBefore(tk, hero.nextSibling);
    cleanups.push(function () { tk.parentNode && tk.parentNode.removeChild(tk); });
  }

  function mountChip() {
    var cta = document.querySelector('[data-bf="cta"]');
    if (!cta || !cta.parentNode) return null;
    var chip = el("span", "bf-chip");
    chip.setAttribute("aria-live", "off");
    var dot = el("span", "bf-chip-dot");
    dot.setAttribute("aria-hidden", "true");
    var txt = el("span", "bf-chip-text");
    chip.appendChild(dot);
    chip.appendChild(txt);
    cta.parentNode.insertBefore(chip, cta.nextSibling);
    cleanups.push(function () { chip.parentNode && chip.parentNode.removeChild(chip); });
    return txt;
  }

  // nodes: text nodes that show "<prefix> 2d 14h 37m" (chip, sale bar).
  function startClock(nodes, prefix) {
    var last = "";
    function tick() {
      var now = new Date();
      // Real phase flipped (e.g. teaser → sale at 18:00 Kyiv).
      var next = override ? phase : BF.getPhase(now);
      if (next !== phase) { clearInterval(id); switchPhase(next); return; }
      var s = prefix + " " + BF.formatCountdown(BF.countdownTo(now, phase), LANG);
      if (s !== last) {
        for (var i = 0; i < nodes.length; i++) nodes[i].textContent = s;
        last = s;
      }
    }
    var id = setInterval(tick, 1000);
    cleanups.push(function () { clearInterval(id); });
    tick();
  }

  // Reload at most once per phase value per tab (sessionStorage guard). If storage is
  // unavailable or this tab already reloaded for that phase, re-render in place instead.
  function switchPhase(next) {
    var key = "bf_reloaded_" + next;
    var canReload = false;
    try {
      if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, "1"); canReload = true; }
    } catch (e) { canReload = false; }
    if (canReload) { location.reload(); return; }
    teardown();
    phase = next;
    if (phase !== "off") RENDER[phase]();
  }

  function teardown() {
    while (cleanups.length) { try { cleanups.pop()(); } catch (e) {} }
    document.documentElement.classList.remove("bf-on", "bf-teaser", "bf-sale");
  }

  function renderTeaser() {
    document.documentElement.classList.add("bf-on", "bf-teaser");
    mountBar(function (inner) {
      inner.appendChild(el("span", "bf-bar-text", T.bar));
      inner.appendChild(link("bf-bar-link", T.barLink, BF.EARLY_LIST_URL, true));
    });
    swapPill(T.pill);
    var txt = mountChip();
    mountTicker(T.ticker);
    if (txt) startClock([txt], T.chipPrefix);
  }

  // Every [data-bf-price] gets: struck old price before it, the sale price, and its
  // per-day / per-month sub-label (next sibling) recalculated. Pro badge → BF badge.
  function applyPrices() {
    var nodes = document.querySelectorAll("[data-bf-price]");
    for (var i = 0; i < nodes.length; i++) {
      var priceEl = nodes[i];
      var key = priceEl.getAttribute("data-bf-price");
      var p = BF.COURSE_PRICES[key];
      if (!p) continue;
      var row = priceEl.parentNode;
      row.classList.add("bf-price-row");
      var old = el("s", "bf-old-price");
      old.appendChild(el("span", "bf-sr", S.oldPriceLabel + ": "));
      old.appendChild(document.createTextNode(BF.formatUsd(p.normal, LANG)));
      row.insertBefore(old, priceEl);
      swapText(priceEl, BF.formatUsd(p.sale, LANG));
      var sub = priceEl.nextElementSibling;
      var unit = sub && BF.rateUnit(sub.textContent);
      if (unit) swapText(sub, BF.rateLabel(key, unit, LANG));
      if (key === "course_pro") {
        var card = priceEl, badge = null;
        for (var up = 0; up < 8 && card && !badge; up++) {
          card = card.parentNode;
          badge = card && card.querySelector ? card.querySelector(".popular-tag-text") : null;
        }
        if (badge) {
          swapText(badge, S.badge);
          badge.parentNode.classList.add("bf-badge");
        }
      }
      (function (row, old) {
        cleanups.push(function () {
          old.parentNode && old.parentNode.removeChild(old);
          row.classList.remove("bf-price-row");
        });
      })(row, old);
    }
    cleanups.push(function () {
      var b = document.querySelectorAll(".bf-badge");
      for (var j = 0; j < b.length; j++) b[j].classList.remove("bf-badge");
    });
  }

  function renderSale() {
    document.documentElement.classList.add("bf-on", "bf-sale");
    var barCount = null;
    mountBar(function (inner) {
      inner.appendChild(el("span", "bf-bar-text", S.bar));
      barCount = el("span", "bf-bar-count");
      inner.appendChild(barCount);
      // Long label on desktop, short one on phones (CSS swaps them at <480px).
      var plans = link("bf-bar-link", null, BF.PLANS_ANCHOR, false);
      plans.appendChild(el("span", "bf-long", S.plansLink));
      plans.appendChild(el("span", "bf-short", S.plansLinkShort));
      inner.appendChild(plans);
      inner.appendChild(link("bf-bar-link bf-bar-link--nfif", S.nfifLink, BF.NFIF_PRICING_URL, true));
    }, "bf-bar--sale");
    swapPill(S.pill);
    var cta = document.querySelector('[data-bf="cta"] a');
    swapText(cta, S.cta);
    var txt = mountChip();
    mountTicker(S.ticker);
    applyPrices();
    var clockNodes = [barCount];
    if (txt) clockNodes.push(txt);
    startClock(clockNodes, S.chipPrefix);
  }

  var RENDER = { teaser: renderTeaser, sale: renderSale };

  function run() { RENDER[phase](); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
