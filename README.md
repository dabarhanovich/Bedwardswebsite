# Northline Outdoor & Handyman — website

Static single-page site. No build step. Open `index.html` directly, or in Cursor use the Live Server extension / `npx serve .` for auto-reload.

## Project layout
```
index.html               all markup
css/styles.css           design tokens + component styles
js/tailwind.config.js    Tailwind theme (reads the CSS variables)
js/main.js               theme toggle, menu, reveal, form
AGENTS.md                instructions Cursor's agent reads automatically
.cursor/rules/           project rule that points at AGENTS.md
```

## Deploy
- **GitHub Pages:** push the folder to a repo, enable Pages on main / root.
- **Cloudflare Pages:** connect the repo, no build command, output directory `/`.

## Customize
| What | Where |
|---|---|
| Business name, phone, email | Find-and-replace `Northline`, `(555) 012-3456`, `+15550123456`, `hello@example.com` |
| Accent color | `--accent-*` in `css/styles.css` (both `:root` and `.dark`) |
| Services | `<article>`s in `#services` + `<option>`s in the form's `#service` select |
| Service area towns | `<ul>` inside `#service-area` |
| Reviews | `<blockquote>`s in `#reviews` |
| SEO / social preview | `<title>`, meta description, OG tags, JSON-LD in `<head>` |
| Project image | Replace the placeholder SVG in the hero `<figure>` with an `<img>` |

## Before launch
1. **Form endpoint** — set `<form action="...">` to Formspree, Web3Forms, Basin, or a Cloudflare Worker. Until then the form simulates success and logs a console warning.
2. **Tailwind** — the Play CDN is convenient but Tailwind documents it as not intended for production (runtime JIT, extra script weight). When you're ready, compile once: move the theme object into a root `tailwind.config.js` with a `content` array, run the Tailwind CLI to output a static CSS file, and replace the CDN `<script>` with a `<link>`. Nothing in the markup needs to change.
3. Add `og-image.jpg` (1200×630) and a favicon.
4. Replace the placeholder social links.
