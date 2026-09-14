import { PageHero, ComingSoonField } from "../components/ui";
import { about, playerLevels } from "../data/content";

export default function About() {
  return (
    <>
      <PageHero
        title="About the Academy"
        subtitle="Castmog Ladies Football Academy — a football academy focused on female player development, regular training and competitive football."
      />

      <section className="container-site py-14 sm:py-16">
        <div className="prose-sm max-w-3xl">
          <h2 className="section-title">About Castmog Ladies Football Academy</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
            Castmog Ladies Football Academy provides a structured environment where female players
            aged 17 and above can develop their game, train regularly and compete. Whether a
            player is just learning the fundamentals or already playing at a competitive level,
            the academy focuses on individual growth and long-term player development.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {about.mission ? (
            <div className="card">
              <h3 className="text-base font-bold">Mission</h3>
              <p className="mt-2 text-sm text-gray-600">{about.mission}</p>
            </div>
          ) : (
            <ComingSoonField label="Mission" />
          )}
          {about.vision ? (
            <div className="card">
              <h3 className="text-base font-bold">Vision</h3>
              <p className="mt-2 text-sm text-gray-600">{about.vision}</p>
            </div>
          ) : (
            <ComingSoonField label="Vision" />
          )}
        </div>

        <div className="mt-14">
          <h2 className="section-title">Player Development Philosophy</h2>
          <div className="mt-4 rounded-lg border-l-4 border-castmog-green bg-castmog-soft px-6 py-5">
            <p className="text-sm font-semibold leading-relaxed sm:text-base">
              {about.philosophy}
            </p>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-600">
            The online application collects information only. Players do not score their own
            technical, physical or tactical ability — actual player development assessment takes
            place in person, after the coaching staff has seen the player.
          </p>
        </div>

        <div className="mt-14">
          <h2 className="section-title">Who the Academy Is For</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            {playerLevels.map((level) => (
              <div key={level.name} className="card">
                <h3 className="text-sm font-bold uppercase tracking-wide">{level.name}</h3>
                <p className="mt-2 text-sm text-gray-600">{level.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
