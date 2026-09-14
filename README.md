# Castmog Ladies Football Academy

Website and player recruitment platform for **Castmog Ladies Football Academy** — a football academy for female players aged 17 and above.

## About this repository

This repository contains the standalone frontend source for the Castmog Ladies Football Academy public website: Home, About, Training, Coaches, Gallery, News, Apply and Contact pages, plus the player application form with full validation (including the 17+ minimum age check) and reference generation.

> **Note:** The production platform — including the secure database storage of applications, the admin dashboard, authentication, the assessment workflow and the content management system — runs on Base44. In this standalone copy, the application and contact forms perform the same validation and show the success/confirmation states, but data persistence and admin tooling live in the production environment.

## Tech stack

- React 18 + Vite
- React Router
- Tailwind CSS
- lucide-react icons

## Getting started

```bash
npm install
npm run dev      # start the local dev server
npm run build    # production build
npm run preview  # preview the production build
```

## Project structure

```
src/
  pages/        # One file per route (Home, About, Training, Coaches, Gallery, News, Apply, Contact)
  components/   # Shared UI (navbar, footer, page hero, empty states)
  data/         # Site content — single source of truth for editable content
```

## Content rules

This project follows one strict rule: **no information about Castmog Ladies Football Academy is invented.**

Only confirmed information is published (coach names and roles, training days and start time, phone/WhatsApp and email). Anything not yet confirmed — training location, mission, vision, coach biographies, gallery photos, news — renders as a clean "coming soon" placeholder. Update `src/data/content.js` to add confirmed content.

## Brand

- Primary: green `#15803d` / deep green `#14532d`
- Accent: yellow `#f5b301`
- Supporting: white and charcoal `#171717`

## Recruitment process

1. **Apply** — the player submits the online application.
2. **Review** — the coaching staff reviews the submitted information.
3. **Invitation** — suitable applicants are invited for a physical assessment.
4. **Physical Assessment** — the player attends in person.
5. **Coach Decision** — the coach records the assessment and selects an outcome: Accepted, Further Assessment, or Not Selected.

The online application is never a substitute for physical assessment.

---

© 2026 Castmog Ladies Football Academy. All Rights Reserved.
