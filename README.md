# CASTMOG LADIES — Official Club Website & Management Platform

Premium dark sports-media platform for **Castmog Ladies**, the women's team of
**Castmog Football Academy**. Hosted on GitHub Pages.

- Public site: https://iremide188.github.io/Castmog-Ladies/
- Admin dashboard: https://iremide188.github.io/Castmog-Ladies/admin.html

## How it works

GitHub Pages is static hosting, so the "database" is the set of structured JSON
files in `data/`. Every page renders from them:

| File | Contents |
|------|----------|
| `data/settings.json` | Club identity, contacts, socials, application fee, PalmPay details |
| `data/players.json` | Full squad & player profiles (14 players) |
| `data/staff.json` | Coaching staff |
| `data/matches.json` | Fixtures & results — drives next match, countdowns, head-to-head |
| `data/news.json` | Newsroom articles |
| `data/achievements.json` | Honours board |
| `data/media.json` | Media centre items |
| `data/training.json` | Training schedule & latest session |
| `data/youtube.json` | YouTube channel, videos, live toggle |
| `data/club.json` | Club page sections — **externally researched info is stored as UNPUBLISHED drafts with sources; approve via the admin before it appears publicly** |

## Admin dashboard

`admin.html` is a token-gated management panel. It reads/writes the `data/*.json`
files directly through the GitHub Contents API — every change is a commit to this
repository, and the public site updates automatically when GitHub Pages rebuilds
(usually under a minute).

**Setup (one time):**
1. On GitHub: Settings → Developer settings → Fine-grained personal access tokens.
2. Create a token limited to **this repository only**, with **Contents: Read and Write**.
3. Open `/admin.html`, paste the token, connect. It is stored only in your browser.

Everything is managed there: players, staff, fixtures/results (with automatic
head-to-head on the public site), news, achievements, media, YouTube videos and
the live toggle, training, club information (with content approval), site
settings, and the application fee.

## Applications

The Join Castmog flow is: **Application → Review → Payment (₦50,000 via PalmPay) →
Application Received** with a unique `CAST-2026-XXXX` reference, delivered to the
club's WhatsApp with the payment reference for verification. Payment details are
never shown before the payment step.

## Rules

- Never publish invented club information — unpublished sections show "COMING SOON".
- Externally researched information stays draft until an admin approves it.
- Keep the admin token private.
