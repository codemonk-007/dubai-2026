/* ==========================================================================
   DUBAI 2026 — app.js
   Renders every data-driven section from window.TRIP.
   Vanilla ES5-compatible DOM code: no framework, no CDN, no build step.
   Works from file:// (no fetch, no modules, no CORS surface).

   Contract with data.js — see dubai-2026/DATA-SCHEMA.md:
     meta, hero, summary, flights, stays, spots, itinerary, budget,
     practical, sources  (plus optional: flights_note, quote, credits)
   If a key is missing the section renders a quiet "still being researched"
   line instead of throwing, so a partial dataset still produces a page.
   ========================================================================== */

(function () {
  "use strict";

  var TRIP = window.TRIP;
  var doc = document;
  var CATEGORY_ORDER = [
    "landmark",
    "desert",
    "culture",
    "beach",
    "family",
    "shopping",
    "day-trip"
  ];
  var CATEGORY_LABEL = {
    landmark: "Landmark",
    desert: "Desert",
    culture: "Culture",
    beach: "Beach",
    family: "Family",
    shopping: "Shopping",
    "day-trip": "Day trip"
  };

  /* ---------------------------------------------------------------- helpers */

  function $(id) {
    return doc.getElementById(id);
  }

  function el(tag, attrs, children) {
    var node = doc.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "text") node.textContent = value;
        else if (key === "class") node.className = value;
        else node.setAttribute(key, value === true ? "" : String(value));
      });
    }
    append(node, children);
    return node;
  }

  function append(parent, children) {
    if (children === undefined || children === null) return parent;
    if (Array.isArray(children)) {
      children.forEach(function (child) {
        append(parent, child);
      });
    } else if (children instanceof Node) {
      parent.appendChild(children);
    } else if (typeof children === "string" || typeof children === "number") {
      parent.appendChild(doc.createTextNode(String(children)));
    }
    return parent;
  }

  function mount(id, node) {
    var host = $(id);
    if (!host) return;
    host.textContent = "";
    append(host, node);
  }

  function arr(value) {
    return Array.isArray(value) ? value : [];
  }

  function str(value) {
    return typeof value === "string" ? value : "";
  }

  function isHttp(url) {
    return /^https?:\/\//i.test(str(url));
  }

  function fmtINR(value) {
    var number = Number(value);
    if (!isFinite(number)) return "—";
    return "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(number);
  }

  function fmtDate(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str(iso))) return str(iso);
    var date = new Date(iso + "T00:00:00");
    if (isNaN(date.getTime())) return str(iso);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function pad2(value) {
    return String(value).length < 2 ? "0" + value : String(value);
  }

  function externalLink(url, label, className) {
    if (!isHttp(url)) return null;
    return el(
      "a",
      {
        class: className || "link-out",
        href: url,
        target: "_blank",
        rel: "noopener noreferrer"
      },
      label
    );
  }

  function emptyLine(message) {
    return el("p", { class: "empty-state", text: message });
  }

  /* ------------------------------------------------------------------ media */

  function fallbackPanel(label, name, variant) {
    var panel = el("div", { class: "media-empty" });
    if (variant) panel.setAttribute("data-variant", variant);
    var initial = str(name).trim().charAt(0).toUpperCase();
    if (initial) {
      panel.appendChild(
        el("span", { class: "media-mark", "aria-hidden": "true", text: initial })
      );
    }
    panel.appendChild(el("span", { class: "media-label", text: label || "Photograph" }));
    if (name) panel.appendChild(el("strong", { class: "media-name", text: name }));
    return panel;
  }

  /**
   * Build a .media block. Uses a local image when the dataset has one and
   * swaps to the designed fallback panel if it fails to load (offline, bad
   * path, deleted file) — the layout never collapses and nothing hotlinks.
   */
  function media(options) {
    var wrap = el("div", { class: "media" });
    var fallback = fallbackPanel(options.fallbackLabel, options.fallbackName, options.variant);

    if (options.src) {
      var img = el("img", {
        src: options.src,
        alt: options.alt || "",
        loading: options.eager ? null : "lazy",
        decoding: "async"
      });
      if (options.eager) img.setAttribute("fetchpriority", "high");
      img.addEventListener("error", function () {
        if (img.parentNode === wrap) wrap.replaceChild(fallback, img);
      });
      wrap.appendChild(img);
    } else {
      wrap.appendChild(fallback);
    }

    if (options.tag) {
      wrap.appendChild(el("span", { class: "tag", text: options.tag }));
    }
    return wrap;
  }

  /* ----------------------------------------------------------------- notice */

  function renderNotice() {
    var bar = doc.querySelector(".notice");
    if (!bar) return;
    var meta = TRIP.meta || {};
    if (meta.preview !== true) {
      bar.parentNode.removeChild(bar);
      doc.body.classList.add("notice-removed");
    }
  }

  /* ------------------------------------------------------------------- hero */

  function renderHero() {
    var hero = TRIP.hero || {};
    var meta = TRIP.meta || {};
    var summary = TRIP.summary || {};
    var figure = doc.querySelector(".hero");

    if (figure) {
      if (hero.image) {
        var img = el("img", {
          class: "hero-img",
          src: hero.image,
          alt:
            hero.alt ||
            [hero.headline, meta.subtitle].filter(Boolean).join(" — ") ||
            "Assam landscape"
        });
        img.setAttribute("fetchpriority", "high");
        img.addEventListener("error", function () {
          if (img.parentNode) img.parentNode.removeChild(img);
          figure.classList.add("hero--no-image");
        });
        figure.insertBefore(img, figure.firstChild);
      } else {
        figure.classList.add("hero--no-image");
      }
    }

    var title = $("hero-title");
    if (title) title.textContent = hero.headline || meta.title || "";

    var blurb = $("hero-blurb");
    if (blurb) blurb.textContent = hero.blurb || "";

    var row = $("hero-meta");
    if (!row) return;
    row.textContent = "";

    var items = [
      ["Dates", meta.dates],
      ["Travellers", meta.travellers ? meta.travellers + " adults" : ""],
      ["From", meta.origin],
      ["Length", summary.days ? summary.days + " days / " + summary.nights + " nights" : ""]
    ];

    items.forEach(function (item) {
      if (!item[1]) return;
      row.appendChild(
        el("div", {}, [
          el("dt", { text: item[0] }),
          el("dd", { text: item[1] })
        ])
      );
    });

    if (!row.children.length) row.parentNode.removeChild(row);
  }

  /* --------------------------------------------------------------- at a glance */

  function renderGlance() {
    var summary = TRIP.summary || {};
    var html = [];

    if (summary.one_liner) {
      html.push(el("p", { class: "glance-lede", text: summary.one_liner }));
    }

    var route = arr(summary.route).filter(Boolean);
    if (route.length) {
      var list = el("ol", { class: "route", "aria-label": "Route" });
      route.forEach(function (place) {
        list.appendChild(el("li", { text: place }));
      });
      html.push(list);
    } else {
      html.push(emptyLine("The route is still being researched."));
    }

    var facts = [
      ["Days", summary.days || "—", ""],
      ["Nights", summary.nights || "—", ""],
      ["Total budget", summary.budget_total_inr ? fmtINR(summary.budget_total_inr) : "—", ""],
      [
        "Per person",
        summary.budget_per_person_inr ? fmtINR(summary.budget_per_person_inr) : "—",
        "for two sharing"
      ]
    ];

    var stats = el("dl", { class: "stats" });
    facts.forEach(function (fact) {
      var dd = el("dd", { text: String(fact[1]) });
      if (fact[2]) dd.appendChild(el("small", { text: " " + fact[2] }));
      stats.appendChild(el("div", { class: "stat" }, [el("dt", { text: fact[0] }), dd]));
    });

    if (summary.best_time) {
      stats.appendChild(
        el("div", { class: "best-time" }, [
          el("dt", { text: "Best time to go" }),
          el("dd", { text: summary.best_time })
        ])
      );
    }

    mount(
      "glance-body",
      el("div", { class: "glance" }, [
        el("div", { class: "glance-left" }, html),
        el("div", { class: "glance-right" }, stats)
      ])
    );
  }

  /* ---------------------------------------------------------------- flights */

  function renderFlights() {
    var flights = arr(TRIP.flights).filter(function (f) {
      return f && (f.airline || f.flight_no);
    });

    var host = $("flights-body");
    if (!host) return;
    host.textContent = "";

    if (!flights.length) {
      host.appendChild(emptyLine("Flight options are still being researched."));
      return;
    }

    var table = el("table", { class: "data-table" });
    table.appendChild(
      el("caption", {
        class: "visually-hidden",
        text: "Delhi to Guwahati flight options with indicative fares"
      })
    );

    var headRow = el("tr");
    [
      ["Airline", ""],
      ["Departs", "num"],
      ["Arrives", ""],
      ["Duration", ""],
      ["Stops", ""],
      ["Fare / person", "num"],
      ["Book", ""]
    ].forEach(function (cell) {
      headRow.appendChild(
        el("th", { scope: "col", class: cell[1], text: cell[0] })
      );
    });
    table.appendChild(el("thead", {}, headRow));

    var body = el("tbody");
    flights.forEach(function (flight) {
      var row = el("tr");

      var airline = el("td", { class: "cell-span", "data-label": "Airline" }, [
        el("span", { class: "cell-airline", text: flight.airline || "—" }),
        el("span", {
          class: "cell-sub",
          text: [flight.flight_no, flight.route].filter(Boolean).join(" · ")
        })
      ]);
      row.appendChild(airline);
      row.appendChild(el("td", { class: "cell-time num", "data-label": "Departs", text: flight.depart || "—" }));
      row.appendChild(el("td", { class: "cell-time", "data-label": "Arrives", text: flight.arrive || "—" }));
      row.appendChild(el("td", { class: "cell-duration", "data-label": "Duration", text: flight.duration || "—" }));
      row.appendChild(
        el("td", {
          class: "cell-duration",
          "data-label": "Stops",
          text: flight.stops === 0 ? "Nonstop" : String(flight.stops || "—")
        })
      );
      row.appendChild(
        el("td", { class: "cell-price num", "data-label": "Fare / person" }, [
          fmtINR(flight.price_inr),
          el("small", { text: "one way" })
        ])
      );
      var book = externalLink(flight.booking_url, "Book");
      row.appendChild(
        el("td", { class: "cell-span", "data-label": "Book" }, book || el("span", { class: "cell-sub", text: "—" }))
      );

      body.appendChild(row);
    });
    table.appendChild(body);
    host.appendChild(el("div", { class: "table-wrap" }, table));

    var notes = flights.filter(function (flight) {
      return flight.fare_note;
    });
    if (notes.length) {
      var fareList = el("dl", { class: "fare-notes" });
      notes.forEach(function (flight) {
        fareList.appendChild(
          el("div", {}, [
            el("dt", { text: [flight.flight_no, flight.airline].filter(Boolean).join(" · ") }),
            el("dd", { text: flight.fare_note })
          ])
        );
      });
      host.appendChild(fareList);
    }

    if (TRIP.flights_note) {
      host.appendChild(el("p", { class: "fare-note", text: TRIP.flights_note }));
    }

    host.appendChild(
      el("p", {
        class: "fare-note",
        text:
          "Fares are indicative one-way prices per person, captured 18 October 2026, and exclude seat selection and extra baggage. Check the airline before booking — Dubai fares climb steeply in the last three weeks of December."
      })
    );
  }

  /* ------------------------------------------------------------------ stays */

  function renderStays() {
    var stays = arr(TRIP.stays);
    var host = $("stays-body");
    if (!host) return;
    host.textContent = "";

    if (!stays.length) {
      host.appendChild(emptyLine("Places to stay are still being researched."));
      return;
    }

    var grid = el("div", { class: "cards" });

    stays.forEach(function (stay) {
      var card = el("article", { class: "card stay" });
      card.appendChild(
        media({
          src: stay.image,
          alt: stay.name ? stay.name + ", " + (stay.location || "Assam") : "Stay in Assam",
          tag: stay.image ? stay.type || "Stay" : null,
          fallbackLabel: stay.type || "Stay",
          fallbackName: stay.name,
          variant: str(stay.type).toLowerCase()
        })
      );

      var body = el("div", { class: "card-body" });
      if (stay.location) body.appendChild(el("p", { class: "card-loc", text: stay.location }));

      if (stay.rating) {
        body.appendChild(el("p", { class: "stay-rating", text: stay.rating }));
      }

      body.appendChild(el("h3", { class: "card-title", text: stay.name || "Unnamed stay" }));
      if (stay.why) body.appendChild(el("p", { class: "card-text", text: stay.why }));

      var foot = el("div", { class: "card-foot" });
      foot.appendChild(
        el("p", { class: "price" }, [
          fmtINR(stay.price_per_night_inr),
          el("small", { text: "per night" })
        ])
      );
      var link = externalLink(stay.booking_url, "Check");
      if (link) foot.appendChild(link);
      body.appendChild(foot);

      card.appendChild(body);
      grid.appendChild(card);
    });

    host.appendChild(grid);
  }

  /* ------------------------------------------------------------------ spots */

  function categoriesPresent(spots) {
    var present = [];
    spots.forEach(function (spot) {
      var category = str(spot.category).toLowerCase();
      if (category && present.indexOf(category) === -1) present.push(category);
    });
    present.sort(function (a, b) {
      var ai = CATEGORY_ORDER.indexOf(a);
      var bi = CATEGORY_ORDER.indexOf(b);
      if (ai === -1) ai = CATEGORY_ORDER.length;
      if (bi === -1) bi = CATEGORY_ORDER.length;
      return ai - bi;
    });
    return present;
  }

  function spotCard(spot, index) {
    var card = el("article", {
      class: "card spot",
      "data-category": str(spot.category).toLowerCase()
    });

    var mediaBlock = media({
      src: spot.image,
      alt: spot.name ? spot.name + ", " + (spot.location || "Assam") : "Place in Assam",
      tag: spot.image ? CATEGORY_LABEL[str(spot.category).toLowerCase()] || spot.category : null,
      fallbackLabel: spot.category || "Place",
      fallbackName: spot.name,
      variant: str(spot.category).toLowerCase()
    });
    mediaBlock.appendChild(el("span", { class: "spot-num", text: pad2(index + 1) }));
    card.appendChild(mediaBlock);

    var body = el("div", { class: "card-body" });
    if (spot.location) body.appendChild(el("p", { class: "card-loc", text: spot.location }));
    body.appendChild(el("h3", { class: "card-title", text: spot.name || "Unnamed place" }));
    if (spot.blurb) body.appendChild(el("p", { class: "card-text", text: spot.blurb }));

    var highlights = arr(spot.highlights);
    if (highlights.length) {
      var list = el("ul", { class: "highlights" });
      highlights.forEach(function (item) {
        list.appendChild(el("li", { text: item }));
      });
      body.appendChild(list);
    }

    if (spot.duration) {
      body.appendChild(el("p", { class: "spot-meta", text: spot.duration }));
    }
    if (spot.best_time) {
      body.appendChild(
        el("p", { class: "spot-best", text: "Best time \u2014 " + spot.best_time })
      );
    }

    var foot = el("div", { class: "spot-foot" });
    foot.appendChild(
      el("span", {
        text:
          spot.entry_fee_inr === 0 || spot.entry_fee_inr === undefined
            ? "No entry fee"
            : "Entry " + fmtINR(spot.entry_fee_inr)
      })
    );
    var link = externalLink(spot.source_url, "Source");
    if (link) foot.appendChild(link);
    body.appendChild(foot);

    card.appendChild(body);
    return card;
  }

  function renderSpots() {
    var spots = arr(TRIP.spots);
    var host = $("spots-body");
    if (!host) return;
    host.textContent = "";

    if (!spots.length) {
      host.appendChild(emptyLine("Place data is still being researched."));
      return;
    }

    var present = categoriesPresent(spots);

    var filterBar = el("div", {
      class: "filters",
      role: "group",
      "aria-label": "Filter places by category"
    });

    var status = el("p", { class: "filter-status", role: "status", "aria-live": "polite" });
    var grid = el("div", { class: "cards" });

    spots.forEach(function (spot, index) {
      grid.appendChild(spotCard(spot, index));
    });

    function setFilter(category, button) {
      var shown = 0;
      Array.prototype.forEach.call(grid.children, function (card) {
        var match = category === "all" || card.getAttribute("data-category") === category;
        card.classList.toggle("is-hidden", !match);
        if (match) shown += 1;
      });
      Array.prototype.forEach.call(filterBar.querySelectorAll(".chip"), function (chip) {
        chip.setAttribute("aria-pressed", chip === button ? "true" : "false");
      });
      status.textContent =
        category === "all"
          ? "Showing all " + spots.length + " places."
          : "Showing " + shown + " of " + spots.length + " places: " +
            (CATEGORY_LABEL[category] || category) + ".";
    }

    var allButton = el("button", {
      class: "chip",
      type: "button",
      "aria-pressed": "true",
      "data-category": "all",
      text: "All"
    });
    allButton.addEventListener("click", function () {
      setFilter("all", allButton);
    });
    filterBar.appendChild(allButton);

    present.forEach(function (category) {
      var button = el("button", {
        class: "chip",
        type: "button",
        "aria-pressed": "false",
        "data-category": category,
        text: CATEGORY_LABEL[category] || category
      });
      button.addEventListener("click", function () {
        setFilter(category, button);
      });
      filterBar.appendChild(button);
    });

    status.textContent = "Showing all " + spots.length + " places.";

    host.appendChild(filterBar);
    host.appendChild(status);
    host.appendChild(grid);
  }

  /* -------------------------------------------------------------- itinerary */

  function renderItinerary() {
    var days = arr(TRIP.itinerary);
    var host = $("itinerary-body");
    if (!host) return;
    host.textContent = "";

    if (!days.length) {
      host.appendChild(emptyLine("The day-by-day plan is still being researched."));
      return;
    }

    var timeline = el("ol", { class: "timeline", "aria-label": "Day-by-day itinerary" });

    days.forEach(function (day, index) {
      var number = day.day || index + 1;
      var item = el("li", { class: "day" });

      item.appendChild(
        el("div", { class: "day-marker", "aria-hidden": "true" }, [
          el("span", { class: "day-num", text: pad2(number) }),
          el("span", { class: "day-label", text: "Day " + number })
        ])
      );

      var body = el("div", { class: "day-body" });
      body.appendChild(
        el("h3", {}, [
          el("span", { class: "visually-hidden", text: "Day " + number + ": " }),
          str(day.title)
        ])
      );

      var blocks = el("dl", { class: "day-blocks" });
      [
        ["Morning", day.morning],
        ["Afternoon", day.afternoon],
        ["Evening", day.evening]
      ].forEach(function (slot) {
        if (!slot[1]) return;
        blocks.appendChild(
          el("div", { class: "day-block" }, [
            el("dt", { text: slot[0] }),
            el("dd", { text: slot[1] })
          ])
        );
      });
      body.appendChild(blocks);

      var stay = str(day.stay).trim();
      var hasStay = stay && !/^[\u2014\u2013-]$/.test(stay);
      if (hasStay || day.notes) {
        var foot = el("div", { class: "day-foot" });
        if (hasStay) foot.appendChild(el("span", { class: "stay-chip", text: stay }));
        if (day.notes) foot.appendChild(el("p", { class: "day-notes", text: day.notes }));
        body.appendChild(foot);
      }

      item.appendChild(body);
      timeline.appendChild(item);
    });

    host.appendChild(timeline);

    var total = Number((TRIP.summary || {}).days);
    if (total && days.length < total) {
      host.appendChild(
        el("p", {
          class: "timeline-note",
          text:
            "Preview shows " + days.length + " of " + total +
            " days; the remaining days are still being researched."
        })
      );
    }
  }

  /* ------------------------------------------------------------------ quote */

  function renderQuote() {
    var quote = TRIP.quote;
    var host = $("quote-body");
    if (!host) return;
    host.textContent = "";
    if (!quote || !quote.text) {
      host.classList.add("is-hidden");
      return;
    }

    var figure = el("figure", { class: "quote" });
    if (quote.image) {
      figure.appendChild(
        el("img", {
          src: quote.image,
          alt: quote.alt || "",
          loading: "lazy",
          decoding: "async"
        })
      );
    }
    figure.appendChild(el("blockquote", { text: quote.text }));
    if (quote.attribution) figure.appendChild(el("figcaption", { text: quote.attribution }));

    host.appendChild(figure);
  }

  /* ----------------------------------------------------------------- budget */

  function renderBudget() {
    var rows = arr(TRIP.budget);
    var summary = TRIP.summary || {};
    var host = $("budget-body");
    if (!host) return;
    host.textContent = "";

    if (!rows.length) {
      host.appendChild(emptyLine("The budget is still being worked out."));
      return;
    }

    var total = rows.reduce(function (sum, row) {
      return sum + (Number(row.inr) || 0);
    }, 0);
    var stated = Number(summary.budget_total_inr) || total;
    var denominator = stated || total || 1;

    var table = el("table", { class: "data-table" });
    table.appendChild(
      el("caption", { class: "visually-hidden", text: "Trip budget by line item" })
    );

    var headRow = el("tr");
    [
      ["Item", ""],
      ["What it covers", ""],
      ["Share", ""],
      ["Amount", "num"]
    ].forEach(function (cell) {
      headRow.appendChild(el("th", { scope: "col", class: cell[1], text: cell[0] }));
    });
    table.appendChild(el("thead", {}, headRow));

    var body = el("tbody");
    rows.forEach(function (row) {
      var amount = Number(row.inr) || 0;
      var pct = Math.max(2, Math.round((amount / denominator) * 100));

      var share = el("span", { class: "share-bar", "aria-hidden": "true" });
      share.appendChild(el("span", { style: "width:" + pct + "%" }));

      var shareCell = el("td", { class: "share-cell", "data-label": "Share" }, [
        el("span", { class: "cell-duration", text: pct + "%" }),
        share
      ]);

      body.appendChild(
        el("tr", {}, [
          el("td", { class: "cell-span", "data-label": "Item" }, [
            el("span", { class: "cell-airline", text: row.item || "—" })
          ]),
          el("td", { "data-label": "What it covers" }, [
            el("span", { class: "cell-sub", text: row.detail || "" })
          ]),
          shareCell,
          el("td", { class: "cell-price num", "data-label": "Amount", text: fmtINR(amount) })
        ])
      );
    });
    table.appendChild(body);
    host.appendChild(el("div", { class: "table-wrap" }, table));

    var totalBlock = el("div", { class: "budget-total" }, [
      el("span", { class: "label", text: "Total" }),
      el("span", { class: "amount", text: fmtINR(stated) }),
      el("span", {
        class: "per-person",
        text: summary.budget_per_person_inr
          ? fmtINR(summary.budget_per_person_inr) + " per person"
          : ""
      })
    ]);
    host.appendChild(totalBlock);
  }

  /* -------------------------------------------------------------- practical */

  function renderPractical() {
    var notes = arr(TRIP.practical);
    var host = $("practical-body");
    if (!host) return;
    host.textContent = "";

    if (!notes.length) {
      host.appendChild(emptyLine("Practical notes are still being researched."));
      return;
    }

    /* Dubai's entry rules deserve their own panel: pull the visa note out of
       the list and give it the indigo card, then number the rest. */
    var visa = null;
    var rest = [];
    notes.forEach(function (note) {
      if (!visa && /visa/i.test(str(note.title))) visa = note;
      else rest.push(note);
    });

    if (visa) {
      host.appendChild(
        el("aside", { class: "visa-card", "aria-labelledby": "visa-title" }, [
          el("div", {}, [
            el("p", { class: "eyebrow", text: "Entry formalities" }),
            el("h3", { id: "visa-title", text: visa.title || "Visa & entry" })
          ]),
          el("div", {}, [
            el("p", { text: visa.body || "" }),
            el("p", {
              class: "visa-foot",
              text: "Check the rule the week you book — fees and validity windows change."
            })
          ])
        ])
      );
    }

    if (!rest.length) return;

    var grid = el("div", { class: "notes" });
    rest.forEach(function (note, index) {
      grid.appendChild(
        el("article", { class: "note" }, [
          el("span", { class: "note-num", "aria-hidden": "true", text: pad2(index + 1) }),
          el("div", {}, [
            el("h3", { text: note.title || "" }),
            el("p", { text: note.body || "" })
          ])
        ])
      );
    });
    host.appendChild(grid);
  }

  /* ---------------------------------------------------------------- sources */

  function renderSources() {
    var sources = arr(TRIP.sources);
    var host = $("sources-body");
    if (!host) return;
    host.textContent = "";

    if (!sources.length) {
      host.appendChild(emptyLine("Sources are still being collected."));
      return;
    }

    var list = el("ol", { class: "sources" });
    sources.forEach(function (source) {
      var item = el("li");
      if (isHttp(source.url)) {
        item.appendChild(
          el(
            "a",
            { href: source.url, target: "_blank", rel: "noopener noreferrer" },
            source.title || source.url
          )
        );
      } else {
        item.appendChild(doc.createTextNode(source.title || "Untitled source"));
      }
      list.appendChild(item);
    });
    host.appendChild(list);
  }

  /* ----------------------------------------------------------------- footer */

  function renderFooter() {
    var meta = TRIP.meta || {};
    var summary = TRIP.summary || {};

    var disclaimer = $("footer-disclaimer");
    if (disclaimer) {
      disclaimer.textContent =
        meta.disclaimer ||
        "Prices are indicative and are not a booking. Confirm everything with the operator before you pay.";
    }

    var stamp = $("footer-stamp");
    if (stamp) {
      var bits = [];
      if (meta.generated) bits.push("Prices captured " + fmtDate(meta.generated));
      if (summary.days) bits.push(summary.days + " days / " + summary.nights + " nights");
      if (meta.travellers) bits.push(meta.travellers + " travellers");
      stamp.textContent = bits.join(" · ");
    }

    var credits = arr(TRIP.credits);
    var creditHost = $("credits-body");
    if (!creditHost) return;
    creditHost.textContent = "";

    if (!credits.length) {
      creditHost.appendChild(
        el("p", {
          class: "credit-list",
          text: "Photography credits are recorded in credits.json."
        })
      );
      return;
    }

    var list = el("ul", { class: "credit-list" });
    credits.forEach(function (credit) {
      var line = el("li");
      line.appendChild(doc.createTextNode((credit.name || "Photograph") + " — "));
      if (credit.author) line.appendChild(doc.createTextNode(credit.author + ", "));
      if (isHttp(credit.source_page)) {
        line.appendChild(
          el(
            "a",
            { href: credit.source_page, target: "_blank", rel: "noopener noreferrer" },
            credit.license || "licence"
          )
        );
      } else {
        line.appendChild(doc.createTextNode(credit.license || ""));
      }
      list.appendChild(line);
    });
    creditHost.appendChild(list);
  }

  /* -------------------------------------------------------------- navigation */

  function initScrollSpy() {
    if (!("IntersectionObserver" in window)) return;

    var links = Array.prototype.slice.call(doc.querySelectorAll(".nav-links a[href^='#']"));
    var sections = links
      .map(function (link) {
        var id = link.getAttribute("href").slice(1);
        return { id: id, node: $(id), link: link };
      })
      .filter(function (entry) {
        return entry.node;
      });

    if (!sections.length) return;

    var visible = Object.create(null);

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          visible[entry.target.id] = entry.isIntersecting;
        });
        var current = null;
        for (var i = 0; i < sections.length; i += 1) {
          if (visible[sections[i].id]) {
            current = sections[i];
            break;
          }
        }
        sections.forEach(function (entry) {
          if (entry === current) entry.link.setAttribute("aria-current", "location");
          else entry.link.removeAttribute("aria-current");
          entry.link.classList.toggle("is-active", entry === current);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach(function (entry) {
      observer.observe(entry.node);
    });
  }

  /* -------------------------------------------------------------------- boot */

  function fail(error) {
    var host = $("glance-body");
    if (host) {
      host.textContent = "";
      host.appendChild(
        el("p", {
          class: "empty-state",
          text: "The trip data could not be rendered. Check data.js for a syntax error."
        })
      );
    }
    if (window.console && window.console.error) window.console.error(error);
  }

  function boot() {
    if (!TRIP) {
      fail(new Error("window.TRIP is missing — data.js did not load."));
      return;
    }

    doc.title = (TRIP.meta && TRIP.meta.title) || "Assam 2026 — trip plan";

    renderNotice();
    renderHero();
    renderGlance();
    renderFlights();
    renderStays();
    renderSpots();
    renderItinerary();
    renderQuote();
    renderBudget();
    renderPractical();
    renderSources();
    renderFooter();
    initScrollSpy();
  }

  try {
    boot();
  } catch (error) {
    fail(error);
  }
})();
