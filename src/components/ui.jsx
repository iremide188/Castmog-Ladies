import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Phone, Mail } from "lucide-react";
import { site } from "../data/content";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/training", label: "Training" },
  { to: "/coaches", label: "Coaches" },
  { to: "/gallery", label: "Gallery" },
  { to: "/news", label: "News" },
  { to: "/apply", label: "Apply" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="container-site flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-castmog-green text-sm font-extrabold text-castmog-yellow">
            CL
          </span>
          <span className="text-sm font-extrabold uppercase leading-tight tracking-tight sm:text-base">
            Castmog Ladies
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-castmog-green sm:text-[11px]">
              Football Academy
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map(({ to, label }) =>
            label === "Apply" ? (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `ml-2 rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide transition ${
                    isActive
                      ? "bg-castmog-yellow text-castmog-charcoal"
                      : "bg-castmog-green text-white hover:bg-castmog-deep"
                  }`
                }
              >
                {label}
              </NavLink>
            ) : (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `rounded-md px-3.5 py-2 text-sm font-semibold transition hover:text-castmog-green ${
                    isActive ? "text-castmog-green" : "text-gray-600"
                  }`
                }
              >
                {label}
              </NavLink>
            )
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          className="rounded-md p-2 text-castmog-charcoal hover:bg-gray-100 lg:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <nav className="border-t border-gray-200 bg-white lg:hidden">
          <div className="container-site flex flex-col py-2">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  label === "Apply"
                    ? "my-2 rounded-md bg-castmog-green px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-white"
                    : `rounded-md px-4 py-3 text-sm font-semibold ${
                        isActive ? "bg-castmog-soft text-castmog-green" : "text-gray-700"
                      }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-castmog-charcoal text-gray-300">
      <div className="container-site grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-base font-extrabold uppercase tracking-tight text-white">
            Castmog Ladies
            <span className="block text-xs font-semibold uppercase tracking-widest text-castmog-yellow">
              Football Academy
            </span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-gray-400">
            {site.footerDescription}
          </p>
        </div>

        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-castmog-yellow">
            Quick Links
          </p>
          <ul className="space-y-2 text-sm">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="transition hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-castmog-yellow">
            Contact
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Phone size={15} className="text-castmog-yellow" />
              <a href={`tel:${site.phone}`} className="transition hover:text-white">
                {site.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={15} className="text-castmog-yellow" />
              <span>WhatsApp: {site.whatsapp}</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={15} className="text-castmog-yellow" />
              <a href={`mailto:${site.email}`} className="break-all transition hover:text-white">
                {site.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-castmog-yellow">
            Follow Us
          </p>
          {site.socials.length === 0 ? (
            <p className="text-sm text-gray-500">Social media links coming soon.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {site.socials.map((s) => (
                <li key={s.url}>
                  <a href={s.url} className="transition hover:text-white">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="border-t border-gray-800 py-5">
        <p className="container-site text-center text-xs text-gray-500">
          © 2026 Castmog Ladies Football Academy. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}

export function PageHero({ title, subtitle }) {
  return (
    <section className="bg-castmog-charcoal">
      <div className="container-site py-14 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-castmog-yellow">
          Castmog Ladies Football Academy
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-3 max-w-2xl text-sm text-gray-300 sm:text-base">{subtitle}</p>}
      </div>
    </section>
  );
}

export function EmptyState({ title, text }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-castmog-soft px-6 py-14 text-center">
      <p className="text-base font-bold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{text}</p>
    </div>
  );
}

export function ComingSoonField({ label }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-castmog-soft p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-castmog-green">{label}</p>
      <p className="mt-1 text-sm text-gray-500">Information coming soon.</p>
    </div>
  );
}

export function ImagePlaceholder({ label = "Castmog Ladies Football Academy" }) {
  return (
    <div className="flex aspect-[16/9] w-full items-center justify-center rounded-lg bg-castmog-soft">
      <div className="p-6 text-center">
        <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-castmog-green text-xs font-extrabold text-castmog-yellow">
          CL
        </span>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">{label}</p>
        <p className="mt-1 text-[11px] text-gray-400">Official photo coming soon</p>
      </div>
    </div>
  );
}
