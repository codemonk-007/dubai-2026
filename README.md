# Dubai 2026 — static trip site

A single-page, editorial-style travel plan for a seven-day Dubai trip (5–11
December 2026, two travellers from Delhi). It renders entirely in the browser
from one data object — no framework, no build step, no CDN, no tracking.

## Open it

Double-click `index.html`, or serve the folder if you prefer a URL:

```sh
cd dubai-2026/site
python3 -m http.server 8000
# then http://localhost:8000
```

It works from `file://` exactly as well as from a web server. Every image is a
local file; the page makes no network requests at runtime.

## What's in here

```
index.html          semantic shell: nav, hero, eight numbered sections, footer
assets/site.css     the design system (tokens, layout, sand band, print styles)
assets/app.js       renderer — builds every section from window.TRIP
data.js             the dataset: window.TRIP = {...}
credits.json        photo attribution: author, licence, licence URL, source page
images/             local photography, lowercase slugs, .jpg
README.md           this file
```

## How it works

`data.js` assigns one object to `window.TRIP`. `app.js` waits for the DOM, then
renders each section into a named container (`#glance-body`, `#flights-body`,
`#spots-body`, …). The section frames, numbering (01–08) and navigation live in
`index.html`; everything factual comes from the data.

To change the trip, edit `data.js` — nothing else. If a key is missing, that
section shows a short "still being researched" line instead of breaking.

### Data contract

The shape is defined in `../DATA-SCHEMA.md`: `meta`, `hero`, `summary`,
`flights`, `stays`, `spots`, `itinerary`, `budget`, `practical`, `sources`.
Optional keys the renderer understands:

- `flights_note` — a paragraph under the fare table (return legs, fare behaviour)
- `quote` — a full-bleed pull quote: `{ text, attribution, image }`
- `credits` — photography attribution rendered in the footer

### Visa panel

If a `practical` note has "visa" in its title, the renderer lifts it out of the
numbered list and gives it the indigo "Entry formalities" panel above the rest.
Delete the word from the title and the note falls back into the normal grid.

### Preview flag

`meta.preview: true` shows the fixed black bar reading "Preview data — under
research". The researched dataset sets it to `false` (or removes the key) and
the renderer drops the bar. The static bar also lives in `index.html` during
the sample phase.

### Images

Each image row carries:

- `image` — a local path such as `images/burj-khalifa.jpg`
- `image_query` — the Wikimedia Commons search phrase that produced it

If `image` is missing or fails to load, the card falls back to a designed
monogram plate (type, initial, name) — the layout never collapses and nothing is
hotlinked. Stay cards use that plate intentionally (see Status).

### Photo licensing

All photography is from Wikimedia Commons, re-encoded to web sizes. Each image
is credited in `credits.json` with author, licence, licence URL and source page,
and the same attribution is rendered in the page footer from `TRIP.credits`.
Licences in use: CC BY 2.0, CC BY-SA 2.0, CC BY-SA 4.0 — all require attribution.

## Design

Editorial travel-magazine layout: a high-contrast serif display (Didot / Bodoni /
Georgia fallback) against a system sans, hairline rules, small-caps eyebrows,
numbered sections and a 1120px measure.

| Token | Value | Use |
| --- | --- | --- |
| deep indigo | `#14213D` | headings, footer, nav mark, dark panels |
| gulf teal | `#0F6E7A` | links, eyebrow labels, accents |
| brass | `#B98A3C` | section numbers, rules, chips, photo captions |
| sand | `#E8DCC8` | at-a-glance band, table rails, media fallbacks |
| off-white | `#FAF7F1` | page ground |
| ink | `#12100E` | body text |

Distinctive pieces: an airport-code `DXB` monogram in the nav, a coordinate line
on the hero, the at-a-glance section set on a full-bleed sand band, a circular
brass day-marker timeline, and the indigo visa panel. The spots grid filters by
category (landmark / desert / culture / beach / family / shopping / day-trip)
with real `<button>` chips and a live count.

## Accessibility & print

Skip link, landmarks, one `<h1>`, labelled controls, visible focus rings,
`aria-live` filter status, alt text on every photograph, and a
`prefers-reduced-motion` escape. The print stylesheet drops the sticky nav and
filters, flattens the hero, keeps cards from breaking across pages and appends
booking URLs to outbound links.

## Deploying

Copy this folder to any static host — GitHub Pages, Netlify, S3, nginx. Nothing
to compile, no server-side code.

## Status

**Sample data.** `data.js` currently carries a structurally complete preview
(two flights, two stays, three places, two days) so the layout can be judged;
the fixed notice bar says so. Stay cards use the monogram plate because the
sample names real, bookable properties and a stock photo of a different hotel
would misrepresent them. The researched dataset replaces all of this before
publication.
