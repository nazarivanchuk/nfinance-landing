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

  // fill(inner) adds the bar content; extraCls is a modifier class (sale = red bar).
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

  // Undoable DOM helpers (each registers its own cleanup).
  function addClass(node, cls) {
    node.classList.add(cls);
    cleanups.push(function () { node.classList.remove(cls); });
  }
  function append(parent, child, before) {
    parent.insertBefore(child, before || null);
    cleanups.push(function () { child.parentNode && child.parentNode.removeChild(child); });
  }
  // Take a node out of the DOM; teardown puts it back in the same place.
  function detach(node) {
    var parent = node.parentNode, next = node.nextSibling;
    parent.removeChild(node);
    cleanups.push(function () { parent.insertBefore(node, next && next.parentNode === parent ? next : null); });
  }

  // Every [data-bf-price] gets: struck old price before it + the sale price; the
  // per-day / per-month sub-label is removed. Junior/Middle get a red "−N%" chip;
  // the Pro card turns red (CSS .bf-pro) with a white BF badge and a "SAVE $360" ribbon.
  function applyPrices() {
    var nodes = document.querySelectorAll("[data-bf-price]");
    for (var i = 0; i < nodes.length; i++) {
      var priceEl = nodes[i];
      var key = priceEl.getAttribute("data-bf-price");
      var p = BF.COURSE_PRICES[key];
      if (!p) continue;
      var row = priceEl.parentNode;
      addClass(row, "bf-price-row");
      var old = el("s", "bf-old-price");
      old.appendChild(el("span", "bf-sr", S.oldPriceLabel + ": "));
      old.appendChild(document.createTextNode(BF.formatUsd(p.normal, LANG)));
      append(row, old, priceEl);
      swapText(priceEl, BF.formatUsd(p.sale, LANG));
      var sub = priceEl.nextElementSibling;
      if (sub && /(^|\s)monthly-price/.test(sub.className)) detach(sub);
      var card = priceEl.closest ? priceEl.closest(".plans_card") : null;
      if (key === "course_pro") {
        if (!card) continue;
        addClass(card, "bf-pro");
        var badge = card.querySelector(".popular-tag-text");
        if (badge) {
          swapText(badge, S.badge);
          addClass(badge.parentNode, "bf-badge");
        }
        var wrap = el("div", "bf-ribbon-wrap");
        wrap.setAttribute("aria-hidden", "true");
        wrap.appendChild(el("span", "bf-ribbon", S.ribbon));
        append(card, wrap, card.firstChild);
        // Decorative layers (CSS animates them; static under reduced motion).
        var glow = el("span", "bf-glow");
        glow.setAttribute("aria-hidden", "true");
        append(card, glow, card.firstChild);
        var shine = el("span", "bf-shine");
        shine.setAttribute("aria-hidden", "true");
        append(card, shine, wrap);
      } else {
        append(row, el("span", "bf-off-chip", "−" + BF.discountPct(key) + "%"));
      }
    }
  }

  // ---- Sale: one-time price-drop animation when each card first scrolls into view ----
  // Rest state is the final state (sale price, struck old price, everything visible);
  // the observer only plays one-shot CSS animations from it, so if JS/IO fails or the
  // visitor prefers reduced motion, nothing is ever hidden. Cards in the phone slider
  // play when their slide becomes visible (the slider mask clips the others).
  var PRICE_MS = 1200;

  // Add a one-shot animation class with a start delay; it removes itself when done
  // (so a later display:none → block cannot replay it) and on teardown.
  function oneShot(node, cls, delay, keep) {
    if (!node) return;
    node.style.setProperty("--bf-delay", delay + "ms");
    node.classList.add(cls);
    function done(e) {
      if (e && (e.target !== node || e.animationName.indexOf("bf-") !== 0)) return; // ignore bubbled child events
      node.removeEventListener("animationend", done);
      // Cards keep the class: Webflow gives .plans_card "transition: all", and removing the
      // finished animation there makes a visible opacity/transform blip.
      if (keep && e) return;
      node.classList.remove(cls);
      node.style.removeProperty("--bf-delay");
    }
    node.addEventListener("animationend", done);
    cleanups.push(function () { done(); });
  }

  function countPrice(priceEl, p, delay) {
    var from = p.normal, to = p.sale, start = 0, raf = 0, last = "";
    priceEl.classList.add("bf-counting");
    function frame(now) {
      if (!start) start = now + delay;
      var s = BF.priceFrame(from, to, (now - start) / PRICE_MS, LANG);
      if (s !== last) { priceEl.textContent = s; last = s; }
      if (now - start < PRICE_MS) raf = requestAnimationFrame(frame);
      else { raf = 0; priceEl.textContent = BF.formatUsd(to, LANG); priceEl.classList.remove("bf-counting"); }
    }
    priceEl.textContent = BF.formatUsd(from, LANG);
    raf = requestAnimationFrame(frame);
    cleanups.push(function () {
      if (raf) cancelAnimationFrame(raf);
      priceEl.classList.remove("bf-counting");
    });
  }

  // entering: the card is just coming up from below (only a sliver on screen).
  // On desktop (>=992px) Webflow's own scroll-into-view "slide in" already moves the cards
  // in (inline opacity/transform), so the CSS rise runs only below 992px.
  function playCard(card, i, entering) {
    var rise = entering && !(window.matchMedia && window.matchMedia("(min-width: 992px)").matches);
    var priceEl = card.querySelector("[data-bf-price]");
    var p = priceEl && BF.COURSE_PRICES[priceEl.getAttribute("data-bf-price")];
    if (!p) return;
    var base = i * 140;
    if (rise) oneShot(card, "bf-rise", base, true);
    var priceDelay = base + (entering ? 350 : 80);
    countPrice(priceEl, p, priceDelay);
    var row = priceEl.parentNode;
    oneShot(row.querySelector(".bf-old-price"), "bf-strike", priceDelay);
    var popAt = priceDelay + PRICE_MS - 120;
    var pops = card.querySelectorAll(".bf-off-chip, .bf-badge");
    for (var k = 0; k < pops.length; k++) oneShot(pops[k], "bf-pop", popAt + k * 90);
  }

  function animatePlans() {
    if (!window.IntersectionObserver || !window.requestAnimationFrame) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var cards = document.querySelectorAll("#plans-section .plans_card");
    if (!cards.length) return;
    var io = new IntersectionObserver(function (entries) {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var n = 0;
      for (var j = 0; j < entries.length; j++) {
        var e = entries[j];
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        // A card already in view (anchor jump, slider swipe) is never faded out.
        playCard(e.target, n++, e.boundingClientRect.top > vh * 0.82);
      }
    }, { threshold: 0 });
    for (var i = 0; i < cards.length; i++) io.observe(cards[i]);
    cleanups.push(function () { io.disconnect(); });
  }

  // Sale only: every bare bot CTA → ?start=course (bot opens the course catalog with BF prices).
  function swapBotLinks() {
    var links = document.querySelectorAll('a[href*="t.me/NFinanceTradingBot"]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var original = a.getAttribute("href");
      var next = BF.saleBotHref(original);
      if (!next) continue;
      a.setAttribute("href", next);
      (function (a, original) {
        cleanups.push(function () { a.setAttribute("href", original); });
      })(a, original);
    }
  }

  function renderSale() {
    document.documentElement.classList.add("bf-on", "bf-sale");
    swapBotLinks();
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
    animatePlans();
    var clockNodes = [barCount];
    if (txt) clockNodes.push(txt);
    startClock(clockNodes, S.chipPrefix);
  }

  var RENDER = { teaser: renderTeaser, sale: renderSale };

  function run() { RENDER[phase](); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
