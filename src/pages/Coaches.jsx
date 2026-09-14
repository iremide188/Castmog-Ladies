import { PageHero } from "../components/ui";
import { coaches } from "../data/content";

function initials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function Coaches() {
  return (
    <>
      <PageHero
        title="Coaching Team"
        subtitle="The coaching staff of Castmog Ladies Football Academy."
      />

      <section className="container-site py-14 sm:py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {coaches.map((coach) => (
            <div key={coach.id} className="card text-center">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-castmog-green text-xl font-extrabold text-castmog-yellow">
                {initials(coach.name)}
              </span>
              <h3 className="mt-4 text-base font-bold uppercase tracking-tight">{coach.name}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-castmog-green">
                {coach.role}
              </p>
              <p className="mt-3 text-xs text-gray-500">
                Biography and qualifications coming soon.
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 max-w-3xl text-sm leading-relaxed text-gray-600">
          Every player is different. Our coaching staff assesses each player in person and
          identifies the areas that require further development.
        </p>
      </section>
    </>
  );
}
