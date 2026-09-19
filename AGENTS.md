# Load N' Go — agent instructions

Static, single-page marketing site for a local outdoor/handyman services business. No framework, no build step.

## Stack
- `index.html` — all markup (semantic HTML5, one page, anchor navigation)
- `css/styles.css` — design tokens (CSS variables) + component classes (`.btn-primary`, `.field`, `.nav-link`, `.reveal`)
- `js/tailwind.config.js` — Tailwind theme extension; reads the CSS variables
- `js/main.js` — vanilla JS: theme toggle, mobile menu, scroll reveal, form validation
- Tailwind via Play CDN (`<script src="https://cdn.tailwindcss.com">`). Do not introduce npm, bundlers, or frameworks unless the user asks.

## Conventions
- Colors: never hardcode hex in markup. Use the token utilities (`bg-accent-600`, `text-ink`, `bg-surface-raised`, `border-line`) or the `--accent-*` / `--surface-*` / `--ink-*` variables. Both light and dark values live in `css/styles.css`.
- Dark mode is class-based (`.dark` on `<html>`). Any new colored element needs a readable dark variant.
- Keep `@apply` out of `css/styles.css` — the CDN only processes `@apply` inside inline `<style type="text/tailwindcss">` blocks. Write plain CSS there.
- Accessibility floor: semantic elements, labels on every input, `aria-*` on interactive widgets, visible `:focus-visible`, honor `prefers-reduced-motion`.
- Copy style: plain, specific, sentence case. CTAs say what happens ("Get a free quote", not "Submit"). No ALL-CAPS labels, no emoji.
- Motion: one scroll reveal per section via `.reveal`; hover states only on interactive elements. Don't add more animation.
- Mobile-first. Check layouts at 375px, 768px, and 1280px after any structural change.

## Placeholders to replace before launch
Service-area towns, Google/Yelp rating numbers on `#reviews` (`data-google-rating` / `data-yelp-rating`), optional `data-google-place-id` + `data-google-maps-key` for live Google ratings, official Yelp embed snippets in `#yelp-embeds`, Facebook `href="#"`, OG image URL, and the quote form `action` (currently `#`, which simulates success). Business name is live: `Load N' Go`. Phone is live: `(425) 350-3046` / `+14253503046`. Email is live: `loadngojunkremoval1@gmail.com`. Instagram is live: `https://www.instagram.com/loadngojunkremoval1/`. Google listing is live: `https://maps.app.goo.gl/DXfTBZzLSrAyWY1s5`. Yelp listing is live: `https://www.yelp.com/biz/load-n-go-monmouth-2`. Quote cards in `#reviews` are live excerpts from those listings.

## Review ratings
Google and Yelp chip numbers live on `#reviews` (`data-google-rating`, `data-google-count`, `data-yelp-rating`, `data-yelp-count`). To sync them from the live listings, follow `.cursor/skills/update-review-ratings/SKILL.md`.

## Editing services
Each service is one `<article>` in `#services`. Keep the same structure (icon → h3 → p → "Request a quote" link with `data-service`). Add a matching `<option>` in the `#service` select so the card prefill keeps working.
