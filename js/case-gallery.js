/* Case gallery modal — teaser card button opens full breakdown with all screenshots.
   Bilingual: picks UK or EN text from the page's <html lang>. Screenshots are shared. */
(function () {
  "use strict";

  var BASE = "/assets/images/cases/";
  var LANG = /^en\b/i.test(document.documentElement.getAttribute("lang") || "") ? "en" : "uk";

  var UI = {
    uk: { dialog: "Розбір кейсу", close: "Закрити" },
    en: { dialog: "Case breakdown", close: "Close" }
  };

  var DATA = {
    eth: {
      title: "Повна фіксація спот-портфелю по ETH перед корекцією",
      meta: "Розбір кейсу",
      body: [
        "Інституції дуже різко змінили своє позиціонування у тижні, коли ETH був на самому піку. Хоч ефір і продовжував зростати у ціні, по звітностях було видно, що інституції виходили з нього, а згодом взагалі набрали найбільшу у історії кількість шортів.",
        "Фіксація відбулась повністю по всіх активах 7.10.2025 після структурного злому. Через кілька днів ми побачили сильне падіння і найбільшу кількість ліквідацій в історії.",
        "Звіти знову випередили графік, показавши вихід установ з ринку."
      ],
      images: ["/assets/images/69543d905177754d17e28491_fix_ETF.png"]
    },
    eurusd: {
      title: "Визначення наративу по EUR/USD та реалізація ідеї на +9k",
      meta: "Розбір кейсу",
      body: [
        "Фонди по долару скидали свої позиції, те ж саме робили і комерціали — це технічно також співпадало з Supply-зоною на графіку.",
        "По євро спостерігалось продовження нарощення ними лонгів, де раніше вони акумулювали позиції з шортів на лонги у межах боковика на початку року. Комерціали хеджувались по євро.",
        "Після формування Demand Chain і підтримки по стороні попиту це створило чудову можливість для реалізації лонгового сценарію."
      ],
      images: ["/assets/images/69543df32c76ea744a01d911_9k.webp"]
    },
    soybean: {
      title: "$Soybean — як було визначено лонг-сценарій",
      meta: "Розбір кейсу",
      body: [
        "На початку серпня ціна досягла квітневого екстремуму Demand-зони, де раніше були вже об’єми. Це чітко видно на графіку і у звітах. 19.08 відбулась різка зміна позицій інституцій, де вони перевернулись у лонгові позиції. Комерціали почали хеджуватись.",
        "Щотижня відбувалось зростання позицій, окрім крайнього тижня — тоді вони зменшили позиції, проте загальний відкритий інтерес на CME зріс і вцілому до того показував позитивну динаміку. Що означало — у актив заходили.",
        "Технічно виділена зона попиту була крайньою, що потенційно могла дати висхідний імпульс на продовження, враховуючи, що раніше при таких цінах відбувались вже реакції. Індикатор сезонності — Long. Оцінка активу по макро — Long."
      ],
      images: ["/assets/images/69543e3e2c76ea744a01e126_soyabean.webp"]
    },
    palladium: {
      title: "Palladium — реверс позиціонування та продовження в лонг",
      meta: "Розбір від 28.07.2025",
      body: [
        "22.07.2025 — раптова зміна позиціонування, що характеризується скиданням позицій; можливе певне охолодження. По стороні великих спекулянтів присутня перегрітість лонгів за 3 місяці, комерціали мають перегріті шорти (хедж). Досить високі значення показників також за 3-річною оцінкою по обох групах учасників ринку.",
        "Метрики показували SELL кілька тижнів раніше. Структурно змін не було, проте були великі шанси побачити MTF-realignment на продовження основної тенденції. Інституції дали сигнал до охолодження активу та входу по кращих цінах. Сезонність також показувала потенційну короткострокову корекцію."
      ],
      images: ["/assets/images/6954409bf6aa067c25c43fbe_palladium.png"]
    },
    mri: {
      title: "NFinance Macro Relative Index (MRI)",
      meta: "Робота метрики",
      body: [
        "Наглядний приклад роботи метрики, яка проводить оцінку макро-фундаментального позиціонування активу відносно основних активів на ринку: золота, долару та облігацій США. Моменти недооцінки та переоцінки дають розуміння лонг-шорт наративу.",
        "Зелений колір показує, коли актив недооцінений, і вказує на купівлю; червоний колір вказує на переоцінку та потенційний продаж активу. Використовується як допоміжний фактор прийняття рішень у комбінації зі звітами."
      ],
      images: ["/assets/images/69560323c8e8abd28a241e4b_MRI.png"]
    },
    rice: {
      title: "Rice — свінг-позиція в лайв-режимі за звітами COT",
      meta: "Пост від 17 березня",
      body: [
        "По позиціях фонди утримують шорти в діапазоні −1 770 / −4 445 вже 4 тижні поспіль. Відбулось незначне скорочення шортів на +720 контрактів.",
        "Виробники нарощують хедж-лонги і завантажені на 88% — дуже близькі до рекордних лонгів за всю історію. Для малого ринку це багато і дає хороші перспективи. Дивергенція між інституціями +70, що також є великим значенням.",
        "Структура однозначно булліш. Коли вони почнуть змінювати своє позиціонування, рух має бути в рази сильнішим. Поки в режимі очікування і спостерігаю за звітами. Risk off. Головне — пройти повністю поточну Supply і закріпитись вище. Позиція в ВЕ."
      ],
      images: ["rice-1.webp", "rice-2.webp"]
    },
    brent: {
      title: "Brent — нафта: збіг технічних і фундаментальних факторів",
      meta: "Пост від 20.07.2026",
      body: [
        "Максимально зараз подобається нафта на фоні сполучення технічних та фундаментальних факторів і при поточній позиції ціни у зоні, де раніше відбувалось також активне інституційне накопичення позицій. Зараз спостерігається ідентичний патерн.",
        "Графік: https://www.tradingview.com/x/jZlCDK36/"
      ],
      images: ["brent-1.webp", "brent-2.webp"]
    },
    jpy: {
      title: "JPY — повна історія трейду за звітами COT (у лайві)",
      meta: "Розбір із оглядів ринку",
      body: [
        "Як я казав раніше на YouTube (уривок з огляду ринку), інституціонали перейшли у шортові позиції з лонгів +8,8k у чисті шорти −19k буквально за 5 тижнів. Банки і комерційні установи дзеркально стали в хедж +12,6k (з −12k).",
        "На початку січня був дуже різкий фліп у шорти на 600%, при чому на графіку ціна дала памп — класична дивергенція між позиціями та графіком. Перед цим прийшлось запастись терпінням. Дата відпрацьовує себе, і все було описано та роз’яснено до цього публічно.",
        "Графік: https://www.tradingview.com/x/5JaR9Os4/",
        "Поточна ситуація по JPY: фонди різко перейшли з шортів у лонги (+32 061 контрактів, 3-є місце серед усіх активів). Відкритий інтерес на CME зріс на +19 тис. Комерційні установи також агресивно змінили позиції.",
        "Очікую доставку ціни у екстремум. Якщо в кінці тижня отримаємо підтвердження зміни ними позиціонування, це дасть свіжий ковток повітря єні. Поки актуальний сценарій."
      ],
      images: ["jpy-1.webp", "jpy-2.webp"]
    },
    nzd: {
      title: "NZD — історичні екстремуми позиціонування банків і фондів",
      meta: "Опис із постів у Telegram",
      body: [
        "NZDUSD | Банки мають більше лонгових позицій, ніж у 99% за всю історію. Фонди мають більше шортових позицій, ніж у 98%. Цікавий актив — раніше я вже відмічав даний екстремум.",
        "Практично всі інституції цього тижня поставили історичний максимум за кількістю ф’ючерсних позицій. Усі метрики лонгові, макро — також (скрін 1).",
        "Графік: https://www.tradingview.com/x/wdqsGQNO/"
      ],
      images: ["nzd-1.webp", "nzd-2.webp"]
    },
    gold: {
      title: "Gold — інституційна активність на падінні ціни",
      meta: "Пост від 16.07.2026",
      body: [
        "GOLD / XAUUSD. Цікаво, що по золоту за крайній період падіння з’явилась інституційна активність: фонди почали активно купувати ф’ючерси на даний актив. Комерційні компанії також динамічно хеджуються вже шостий тиждень поспіль. Разом з цим є ріст відкритого інтересу на CME.",
        "Наразі інституційна дивергенція негативна, а композитна метрика комерціалів на 50%. Зацікавлений у даному активі ближчим часом.",
        "Графік: https://www.tradingview.com/x/ALXUC78o/"
      ],
      images: ["gold-1.webp", "gold-2.webp"]
    },
    cad: {
      title: "CAD — агресивні шорти фондів біля історичного максимуму",
      meta: "Розбір активу",
      body: [
        "CAD — новий претендент на хороший ап-рух. Позиціонування фондів крайні тижні дуже агресивне у сторону шортів: за 4 тижні вони збільшили майже вдвічі кількість чистих шортових позицій. Їхні позиції дуже близькі вже до історичного максимуму, що вказує на перегрітість. По стороні комерційних компаній та сама ситуація.",
        "Метрики за пів року (і короткострокові) вже почали показувати на купівлю. Загальна перегрітість усіх груп за пів року, за 3 роки також достатньо висока.",
        "Сезонність: наступні місяці мають позитивну динаміку. Макро — в очікуванні оцінки відносно долара та облігацій.",
        "Чарти: https://www.tradingview.com/x/YmzXzEkv/ , https://www.tradingview.com/x/I5xlfW2p/"
      ],
      images: ["cad-1.webp", "cad-2.webp", "cad-3.webp"]
    },
    silver: {
      title: "Silver — фонди тримають лонги проти падіння ціни",
      meta: "Пост від 21.07.2026",
      body: [
        "Silver та інші метали. Мені в цілому подобається як виглядають метали, і один з претендентів на ближчий час — це Silver.",
        "Фонди, на фоні того, що ціна падає, продовжують тримати більше лонгових позицій. Їхня чиста позиція за крайні 2 місяці зросла на +26%. Відкритий інтерес має добру динаміку.",
        "Інституційна дивергенція, швидкість зміни позицій та короткострокові метрики — на середньому, нейтральному положенні, але композиційна метрика банків і комерціалів позитивна +63%.",
        "Моя думка на ближчий час — очікування реверсу з лонговим наративом.",
        "Графік: https://www.tradingview.com/x/XNruts8U/"
      ],
      images: ["silver-1.webp", "silver-2.webp"]
    }
  };

  /* English overrides — title / meta / body only; images reused from DATA. */
  var TX_EN = {
    eth: {
      title: "Full spot-portfolio exit on ETH before the correction",
      meta: "Case breakdown",
      body: [
        "Institutions sharply changed their positioning during the week ETH was at its very peak. Although ether kept rising in price, the reports showed institutions were exiting it, and then went on to build the largest short position in history.",
        "The exit was complete across all assets on 7.10.2025 after a structural break. A few days later we saw a sharp drop and the largest number of liquidations in history.",
        "The reports once again ran ahead of the chart, showing institutions leaving the market."
      ]
    },
    eurusd: {
      title: "Reading the EUR/USD narrative and realising the idea for +9k",
      meta: "Case breakdown",
      body: [
        "Funds were offloading their dollar positions, and so were commercials — which also technically lined up with a Supply zone on the chart.",
        "On the euro, they kept building longs, having earlier accumulated positions from shorts into longs within the range at the start of the year. Commercials were hedging on the euro.",
        "Once a Demand Chain and support formed on the demand side, this created an excellent opportunity to play out the long scenario."
      ]
    },
    soybean: {
      title: "$Soybean — how the long scenario was identified",
      meta: "Case breakdown",
      body: [
        "In early August price reached the April extreme of a Demand zone, where volume had already traded before. This is clearly visible on the chart and in the reports. On 19.08 institutions abruptly flipped their positions to the long side. Commercials began hedging.",
        "Positions grew every week, except the most recent one — then they reduced positions, yet total open interest on CME rose and had shown a positive trend before that. Which meant money was flowing into the asset.",
        "The marked demand zone was the last one technically, which could potentially give an upward impulse for continuation, given that reactions had already occurred at such prices before. Seasonality indicator — Long. Macro assessment of the asset — Long."
      ]
    },
    palladium: {
      title: "Palladium — positioning reversal and continuation to the long side",
      meta: "Breakdown from 28.07.2025",
      body: [
        "22.07.2025 — a sudden change in positioning, marked by position offloading; some cooling-off is possible. On the large speculators' side there is an overheated long position over 3 months; commercials hold overheated shorts (hedge). Fairly high readings on a 3-year basis too, for both groups of market participants.",
        "The metrics had shown SELL a few weeks earlier. Structurally nothing had changed, but there was a strong chance of an MTF realignment for continuation of the main trend. Institutions signalled a cooling-off of the asset and entry at better prices. Seasonality also pointed to a potential short-term correction."
      ]
    },
    mri: {
      title: "NFinance Macro Relative Index (MRI)",
      meta: "How the metric works",
      body: [
        "A clear example of how the metric works: it assesses an asset's macro-fundamental positioning relative to the market's core assets — gold, the dollar and US bonds. Moments of under- and over-valuation give an understanding of the long-short narrative.",
        "Green shows when the asset is undervalued and points to buying; red indicates overvaluation and a potential sell. Used as a supporting factor for decisions in combination with the reports."
      ]
    },
    rice: {
      title: "Rice — a live swing position based on COT reports",
      meta: "Post from March 17",
      body: [
        "On positioning, funds have held shorts in the −1,770 / −4,445 range for 4 weeks running. There was a slight reduction of shorts by +720 contracts.",
        "Producers are building hedge longs and are 88% loaded — very close to their all-time record longs. For a small market that's a lot and gives good prospects. The divergence between institutions is +70, which is also a large value.",
        "The structure is clearly bullish. Once they start changing their positioning, the move should be several times stronger. For now I'm in wait mode and watching the reports. Risk off. The key is to fully clear the current Supply and hold above it. Position at break-even."
      ]
    },
    brent: {
      title: "Brent — oil: technicals and fundamentals line up",
      meta: "Post from 20.07.2026",
      body: [
        "Right now I like oil the most, given the combination of technical and fundamental factors and with price currently in a zone where active institutional accumulation also took place before. The same pattern is playing out now.",
        "Chart: https://www.tradingview.com/x/jZlCDK36/"
      ]
    },
    jpy: {
      title: "JPY — the full history of this trade from COT reports (live)",
      meta: "Breakdown from market reviews",
      body: [
        "As I said earlier on YouTube (a clip from a market review), institutionals moved from longs of +8.8k into net shorts of −19k in just 5 weeks. Banks and commercial institutions mirrored this into a hedge of +12.6k (from −12k).",
        "In early January there was a very sharp 600% flip into shorts, while on the chart price gave a pump — a classic divergence between positioning and the chart. Before that, patience was required. The data is proving itself out, and everything was described and explained publicly beforehand.",
        "Chart: https://www.tradingview.com/x/5JaR9Os4/",
        "Current JPY picture: funds sharply moved from shorts into longs (+32,061 contracts, 3rd place among all assets). Open interest on CME rose by +19k. Commercial institutions also aggressively changed positions.",
        "I expect price to be delivered into the extreme. If we get confirmation of their positioning change by the end of the week, it will give the yen a breath of fresh air. The scenario is still valid for now."
      ]
    },
    nzd: {
      title: "NZD — historic extremes in bank and fund positioning",
      meta: "Description from Telegram posts",
      body: [
        "NZDUSD | Banks hold more long positions than in 99% of all history. Funds hold more short positions than in 98%. An interesting asset — I had already flagged this extreme before.",
        "Practically all institutions this week set an all-time high in the number of futures positions. All metrics are long, macro too (screen 1).",
        "Chart: https://www.tradingview.com/x/wdqsGQNO/"
      ]
    },
    gold: {
      title: "Gold — institutional activity on a falling price",
      meta: "Post from 16.07.2026",
      body: [
        "GOLD / XAUUSD. Interestingly, over the recent decline institutional activity has appeared on gold: funds have started actively buying futures on the asset. Commercial companies are also hedging dynamically for the sixth week running. Alongside this, open interest on CME is rising.",
        "Right now institutional divergence is negative, and the commercials' composite metric is at 50%. I'm interested in this asset in the near term.",
        "Chart: https://www.tradingview.com/x/ALXUC78o/"
      ]
    },
    cad: {
      title: "CAD — aggressive fund shorts near an all-time high",
      meta: "Asset breakdown",
      body: [
        "CAD — a new candidate for a solid up-move. Fund positioning over recent weeks has been very aggressive to the short side: in 4 weeks they nearly doubled their net short positions. Their positions are already very close to an all-time high, which points to overheating. It's the same story on the commercial companies' side.",
        "The six-month (and short-term) metrics have already started pointing to buying. Overall overheating across all groups over six months, and over 3 years it's also fairly high.",
        "Seasonality: the coming months have a positive trend. Macro — awaiting an assessment against the dollar and bonds.",
        "Charts: https://www.tradingview.com/x/YmzXzEkv/ , https://www.tradingview.com/x/I5xlfW2p/"
      ]
    },
    silver: {
      title: "Silver — funds hold longs against a falling price",
      meta: "Post from 21.07.2026",
      body: [
        "Silver and other metals. Overall I like how the metals look, and one candidate for the near term is Silver.",
        "Funds, despite the falling price, keep holding more long positions. Their net position has risen +26% over the last 2 months. Open interest has a good trend.",
        "Institutional divergence, the speed of position change and the short-term metrics are at a mid, neutral level, but the composite metric for banks and commercials is positive +63%.",
        "My view for the near term — expecting a reversal with a long narrative."
      ]
    }
  };

  function resolve(id) {
    var base = DATA[id];
    if (!base) return null;
    if (LANG === "en" && TX_EN[id]) {
      return {
        title: TX_EN[id].title,
        meta: TX_EN[id].meta,
        body: TX_EN[id].body,
        images: base.images
      };
    }
    return base;
  }

  var URL_RE = /(https?:\/\/[^\s,]+)/g;

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function linkify(text) {
    return esc(text).replace(URL_RE, function (u) {
      return '<a href="' + u + '" target="_blank" rel="noopener">' + u + "</a>";
    });
  }

  var backdrop, panel, titleEl, metaEl, bodyEl, imgsEl, lb, lbImg, lastFocus;

  function build() {
    backdrop = document.createElement("div");
    backdrop.className = "cg-backdrop";
    backdrop.innerHTML =
      '<div class="cg-panel" role="dialog" aria-modal="true" aria-label="' + UI[LANG].dialog + '">' +
      '<button class="cg-close" type="button" aria-label="' + UI[LANG].close + '">&#10005;</button>' +
      '<h3 class="cg-title"></h3>' +
      '<p class="cg-meta"></p>' +
      '<div class="cg-body"></div>' +
      '<div class="cg-imgs"></div>' +
      "</div>";
    document.body.appendChild(backdrop);

    panel = backdrop.querySelector(".cg-panel");
    titleEl = backdrop.querySelector(".cg-title");
    metaEl = backdrop.querySelector(".cg-meta");
    bodyEl = backdrop.querySelector(".cg-body");
    imgsEl = backdrop.querySelector(".cg-imgs");

    lb = document.createElement("div");
    lb.className = "cg-lb";
    lb.innerHTML = "<img alt=''>";
    document.body.appendChild(lb);
    lbImg = lb.querySelector("img");

    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop || e.target.closest(".cg-close")) close();
      var img = e.target.closest(".cg-img");
      if (img) openLb(img.getAttribute("src"));
    });
    lb.addEventListener("click", closeLb);
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (lb.classList.contains("cg-open")) closeLb();
      else if (backdrop.classList.contains("cg-open")) close();
    });
  }

  function open(id) {
    var d = resolve(id);
    if (!d) return;
    if (!backdrop) build();
    lastFocus = document.activeElement;
    titleEl.textContent = d.title;
    metaEl.textContent = d.meta || "";
    metaEl.style.display = d.meta ? "" : "none";
    bodyEl.innerHTML = d.body.map(function (p) { return "<p>" + linkify(p) + "</p>"; }).join("");
    imgsEl.innerHTML = d.images
      .map(function (f) {
        var src = f.charAt(0) === "/" ? f : BASE + f;
        return '<img class="cg-img" loading="lazy" alt="' + esc(d.title) + '" src="' + src + '">';
      })
      .join("");
    panel.scrollTop = 0;
    backdrop.classList.add("cg-open");
    document.body.style.overflow = "hidden";
    backdrop.querySelector(".cg-close").focus();
  }

  function close() {
    if (!backdrop) return;
    backdrop.classList.remove("cg-open");
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function openLb(src) {
    lbImg.setAttribute("src", src);
    lb.classList.add("cg-open");
  }
  function closeLb() {
    lb.classList.remove("cg-open");
    lbImg.removeAttribute("src");
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".cg-open");
    if (!btn) return;
    e.preventDefault();
    open(btn.getAttribute("data-case"));
  });
})();
