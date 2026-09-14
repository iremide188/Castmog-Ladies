import { useState } from "react";
import { PageHero, EmptyState } from "../components/ui";
import { galleryCategories } from "../data/content";

// Gallery images are managed by the academy. Add items here once official
// photos are available — never use stock photos presented as Castmog players.
const galleryItems = [];

export default function Gallery() {
  const [active, setActive] = useState("All");

  const filtered =
    active === "All" ? galleryItems : galleryItems.filter((i) => i.category === active);

  return (
    <>
      <PageHero
        title="Gallery"
        subtitle="Photos from training, matches, players, team activities and events."
      />

      <section className="container-site py-14 sm:py-16">
        <div className="mb-8 flex flex-wrap gap-2">
          {galleryCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActive(cat)}
              className={`rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                active === cat
                  ? "bg-castmog-green text-white"
                  : "bg-castmog-soft text-gray-600 hover:text-castmog-green"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="Gallery coming soon"
            text="Official Castmog Ladies photos will be published here as soon as they become available."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <figure key={item.id} className="overflow-hidden rounded-lg border border-gray-200">
                <img
                  src={item.image}
                  alt={item.caption || item.category}
                  className="aspect-[4/3] w-full object-cover"
                />
                <figcaption className="px-4 py-3 text-xs text-gray-600">
                  <span className="font-semibold uppercase tracking-wide text-castmog-green">
                    {item.category}
                  </span>
                  {item.caption && <span className="ml-2">{item.caption}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
