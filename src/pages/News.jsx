import { PageHero, EmptyState } from "../components/ui";
import { newsCategories } from "../data/content";

// News articles are managed by the academy. Published articles appear here.
const newsArticles = [];

export default function News() {
  return (
    <>
      <PageHero title="News & Updates" subtitle="The latest announcements and updates from Castmog Ladies Football Academy." />

      <section className="container-site py-14 sm:py-16">
        {newsArticles.length === 0 ? (
          <EmptyState
            title="No news yet"
            text="Announcements about training, matches, player achievements and recruitment will be published here."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {newsArticles.map((article) => (
              <article key={article.id} className="card">
                <p className="text-xs font-bold uppercase tracking-widest text-castmog-green">
                  {article.category}
                </p>
                <h2 className="mt-2 text-base font-bold">{article.title}</h2>
                <p className="mt-2 text-sm text-gray-600">{article.excerpt}</p>
              </article>
            ))}
          </div>
        )}

        <div className="mt-10">
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
            Topics covered
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {newsCategories.map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-castmog-soft px-4 py-1.5 text-xs font-semibold text-gray-600"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
