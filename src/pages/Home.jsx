import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, ShieldCheck, Trophy } from "lucide-react";
import { playerLevels, recruitmentSteps } from "../data/content";
import { ImagePlaceholder } from "../components/ui";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-castmog-charcoal">
        <div className="container-site grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-castmog-yellow">
              Female Football Academy · Ages 17+
            </p>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              DEVELOP YOUR GAME.
              <br />
              BUILD YOUR FUTURE.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-gray-300 sm:text-base">
              Whether you're learning the game or already playing competitively, Castmog provides
              an environment for female players to develop, train and compete.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/apply" className="btn-secondary">
                Apply to Join
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-600 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:border-castmog-yellow hover:text-castmog-yellow"
              >
                Learn More
              </Link>
            </div>
          </div>
          <ImagePlaceholder />
        </div>
      </section>

      {/* Who can join */}
      <section className="container-site py-16 sm:py-20">
        <div className="mb-10 text-center">
          <h2 className="section-title">Who Can Join</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600">
            Castmog Ladies Football Academy is for female players. Players of all levels are
            welcome — from complete beginners to experienced competitors.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {playerLevels.map((level) => (
            <div key={level.name} className="card">
              <h3 className="text-lg font-bold">{level.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{level.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-lg border-l-4 border-castmog-yellow bg-castmog-soft px-6 py-5">
          <p className="text-sm font-bold sm:text-base">
            Minimum age: 17 years.
            <span className="font-normal text-gray-600">
              {" "}
              The academy is exclusively for female players.
            </span>
          </p>
        </div>
      </section>

      {/* Recruitment process */}
      <section className="bg-castmog-soft">
        <div className="container-site py-16 sm:py-20">
          <div className="mb-10 text-center">
            <h2 className="section-title">How Recruitment Works</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600">
              Every application goes through the same process — and the final decision is always
              made after our coaches see you play in person.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {recruitmentSteps.map(({ step, title, text }) => (
              <div key={step} className="card">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-castmog-green text-sm font-extrabold text-white">
                  {step}
                </span>
                <h3 className="mt-3 text-sm font-bold uppercase tracking-wide">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights strip */}
      <section className="container-site grid gap-6 py-16 sm:grid-cols-3 sm:py-20">
        {[
          {
            icon: CalendarClock,
            title: "Regular Training",
            text: "Structured weekday training sessions, Monday to Friday, starting 7:00 AM.",
          },
          {
            icon: ShieldCheck,
            title: "Player Development",
            text: "Coaching staff assess each player in person and identify the areas that require further development.",
          },
          {
            icon: Trophy,
            title: "Competitive Football",
            text: "An environment for female players to develop, train and compete.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="card">
            <Icon size={26} className="text-castmog-green" />
            <h3 className="mt-3 text-base font-bold">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{text}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="bg-castmog-green">
        <div className="container-site flex flex-col items-center gap-6 py-14 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="text-xl font-extrabold uppercase tracking-tight text-white sm:text-2xl">
              Ready to take the next step?
            </h2>
            <p className="mt-1 text-sm text-castmog-yellow">
              Submit your application online — it only takes a few minutes.
            </p>
          </div>
          <Link to="/apply" className="btn-secondary">
            Apply to Join <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
