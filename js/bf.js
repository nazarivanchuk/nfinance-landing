/* Black Friday 2026 — DOM layer for the course site (needs js/bf-core.js first).
   Phase from BFCore.getPhase(now, ?bf= override). 'off' → does nothing at all.
   One render function per phase: teaser is built here; sale is a seam for the sale task.
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

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // Top bar is position:fixed above the fixed Webflow nav; its real height (it wraps on
  // phones) goes into --bf-bar-h, which pushes the nav and the page content down.
  function mountBar() {
    var bar = el("div", "bf-bar");
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Black Friday");
    var inner = el("div", "bf-bar-inner");
    inner.appendChild(el("span", "bf-bar-text", T.bar));
    var a = el("a", "bf-bar-link", T.barLink);
    a.href = BF.EARLY_LIST_URL;
    a.target = "_blank";
    a.rel = "noopener";
    inner.appendChild(a);
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

  function swapPill() {
    var pill = document.querySelector('[data-bf="pill"]');
    if (!pill) return;
    var p = pill.querySelector("p") || pill;
    var original = p.textContent;
    p.textContent = T.pill;
    cleanups.push(function () { p.textContent = original; });
  }

  function mountTicker() {
    var hero = document.querySelector('[data-bf="hero"]');
    if (!hero || !hero.parentNode) return;
    var tk = el("div", "bf-ticker");
    var track = el("div", "bf-ticker-track");
    for (var i = 0; i < 2; i++) {
      // The "·" between copies is CSS (::after), so a lone copy never ends with a separator.
      var item = el("span", "bf-ticker-item", T.ticker);
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

  function startClock(txt, prefix) {
    var last = "";
    function tick() {
      var now = new Date();
      // Real phase flipped (e.g. teaser → sale at 18:00 Kyiv).
      var next = override ? phase : BF.getPhase(now);
      if (next !== phase) { clearInterval(id); switchPhase(next); return; }
      var s = prefix + " " + BF.formatCountdown(BF.countdownTo(now, phase), LANG);
      if (s !== last) { txt.textContent = s; last = s; }
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
    mountBar();
    swapPill();
    var txt = mountChip();
    mountTicker();
    if (txt) startClock(txt, T.chipPrefix);
  }

  function renderSale() {
    // Seam for the sale task (prices via [data-bf-price], CTA label, sale bar/ticker).
    // Intentionally empty in phase 1: with ?bf=sale only the mini-course popup is paused.
    document.documentElement.classList.add("bf-sale");
  }

  var RENDER = { teaser: renderTeaser, sale: renderSale };

  function run() { RENDER[phase](); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
