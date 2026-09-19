---
name: update-review-ratings
description: >-
  Checks Load N' Go Google Maps and Yelp listings for current star rating and
  review count, then updates the review chips in index.html when they change.
  Use when checking reviews, syncing Google or Yelp ratings, updating
  data-google-rating / data-yelp-count, or running the daily review check.
---

# Update review ratings

Keep the Google and Yelp chips on `#reviews` in sync with the live listings. Do not use paid Google or Yelp APIs. Do not commit unless the user asks.

## Source of truth

Read `index.html` section `#reviews`:

| Platform | Listing | Attributes |
|----------|---------|------------|
| Google | `data-google-url` (Maps short link) | `data-google-rating`, `data-google-count` |
| Yelp | `data-yelp-url` (`/biz/load-n-go-monmouth-2`) | `data-yelp-rating`, `data-yelp-count` |

Also keep the matching `href` on `#google-reviews-card`, `#yelp-reviews-card`, `#footer-google`, and `#footer-yelp` equal to those URLs.

## Workflow

1. Read the four `data-*` numbers currently in `index.html`.
2. Open each listing in the browser (not curl — both pages are JavaScript). Prefer a new tab, then lock, read, unlock.
3. Parse **rating** (one decimal, 1–5) and **count** (integer):
   - **Google:** header like `5.0` next to `(6)` or `6 reviews`.
   - **Yelp:** header like `5.0 (1 review)`. Use Yelp’s **recommended** count only. Ignore “not currently recommended” reviews.
4. If a page fails to load or the numbers are unclear, leave that platform unchanged and say so.
5. If a number changed, update only those attributes on `#reviews`. Keep `5.0` style (one decimal). Do not invent counts.
6. Do not edit quote `<blockquote>`s, AGENTS.md placeholders, or add API keys.
7. Tell the user: old → new for each platform, or that nothing changed.

## Daily run

This skill does not schedule itself. To run it daily:

- In chat: “check review ratings” (or `@update-review-ratings`).
- For unattended daily runs, use a Cursor Automation on a daily schedule whose prompt is: follow the `update-review-ratings` skill; if counts changed, update `index.html` and stop; if unchanged, say so and stop. Do not commit.
