# Castmog Ladies Football Academy — Website

The official website and player application form for **Castmog Ladies Football Academy** (female football academy, Nigeria).

Built with **only HTML, CSS and JavaScript** — no frameworks, no build tools, no dependencies. Open any page in a browser and it works.

## Pages

| File | Page |
|------|------|
| `index.html` | Home |
| `about.html` | About the academy |
| `training.html` | Training schedule |
| `coaches.html` | Coaching team |
| `gallery.html` | Gallery (coming soon) |
| `news.html` | News & updates |
| `apply.html` | Player application form |
| `contact.html` | Contact details + message form |

## How it works

- `css/styles.css` — the entire site design. Brand colours are defined once at the top in `:root` (green `#1e5631`, yellow `#ffd700`, dark charcoal `#1c1c1c`).
- `js/main.js` — inserts the header (navigation) and footer on every page. **Edit the menu or footer in this one file** and it changes on all pages automatically.
- `js/apply.js` — the application form: validates every field, **enforces the 17+ age rule** (under-17 applicants are rejected with a message), generates a reference number (`CM-2026-XXXX`), and submits the application to the academy's WhatsApp with all details.
- `js/contact.js` — the contact form, also delivered via WhatsApp.

## How the applications reach you

This is a static website (no server), so applications are delivered straight to the academy's WhatsApp: **0913 052 7339**. When a player submits, WhatsApp opens with a pre-filled message containing every field plus her reference number — she just presses Send and can attach her player photo in the same chat.

To change the receiving number, edit `ACADEMY_WHATSAPP` in `js/apply.js` (international format, no `+`).

## Editing the content

- **Text on pages** — open the page's HTML file, the content is plain readable HTML.
- **Colours** — change the values in `:root` at the top of `css/styles.css`.
- **Navigation / footer** — edit `js/main.js`.
- **Logo** — the academy crest is referenced by the `LOGO_URL` variable in `js/main.js`. To use a local copy, drop the image in the project and change it to e.g. `"assets/logo.jpg"`.

## Hosting it free

1. Push these files to a GitHub repository.
2. In the repo: **Settings → Pages → Source: Deploy from a branch → main / (root)** → Save.
3. The site goes live at `https://<your-username>.github.io/<repo-name>/` in a minute or two.

Any other static host (Netlify, Vercel, cPanel, etc.) also works — just upload the files.
