import { Clock, CalendarDays, MapPin } from "lucide-react";
import { PageHero, ComingSoonField } from "../components/ui";
import { training } from "../data/content";

export default function Training() {
  return (
    <>
      <PageHero
        title="Training"
        subtitle="Structured weekday training sessions designed around player development."
      />

      <section className="container-site py-14 sm:py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="card">
            <CalendarDays size={22} className="text-castmog-green" />
            <h3 className="mt-3 text-sm font-bold uppercase tracking-wide">Training Days</h3>
            <p className="mt-1.5 text-sm text-gray-600">{training.days}</p>
            <p className="mt-1 text-xs text-gray-500">{training.weekend}</p>
          </div>
          <div className="card">
            <Clock size={22} className="text-castmog-green" />
            <h3 className="mt-3 text-sm font-bold uppercase tracking-wide">Start Time</h3>
            <p className="mt-1.5 text-sm text-gray-600">Training starts: {training.startTime}</p>
            <p className="mt-1 text-xs text-gray-500">
              End time to be announced by the academy.
            </p>
          </div>
          <div className="card">
            <MapPin size={22} className="text-castmog-green" />
            <h3 className="mt-3 text-sm font-bold uppercase tracking-wide">Location</h3>
            <p className="mt-1.5 text-sm text-gray-500">Training location to be announced.</p>
          </div>
        </div>

        <div className="mt-10 max-w-3xl">
          <h2 className="section-title">Training at Castmog</h2>
          {training.description ? (
            <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
              {training.description}
            </p>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
              Castmog Ladies Football Academy trains Monday to Friday, with sessions beginning at
              7:00 AM. Sessions are led by the academy's coaching team and structured around the
              development needs of the players. Additional training information will be published
              here.
            </p>
          )}
          <div className="mt-6">
            <ComingSoonField label="Additional Training Information" />
          </div>
        </div>
      </section>
    </>
  );
}
