/* Newsroom — list + article view from data/news.json */
(function () {
  "use strict";
  var C = window.CLUB;
  var id = new URLSearchParams(window.location.search).get("id");
  window.CLUB.onReady(function () {
    var mount = document.getElementById("news-mount");
    if (!mount) return;
    var all = C.pub(C.get("news")).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var article = id && all.filter(function (n) { return n.id === id; })[0];

    if (article) {
      document.title = article.title + " — Castmog Ladies News";
      mount.innerHTML =
        '<div class="article-head"><div class="nc-meta" style="display:flex;gap:0.5rem;flex-wrap:wrap;">' +
        '<span class="chip chip-yellow">' + C.esc(article.category || "CLUB") + "</span>" +
        (article.date ? '<span class="chip">' + C.fmtDate(article.date) + "</span>" : "") + "</div>" +
        '<h1 style="font-family:var(--font-head);font-size:clamp(1.8rem,4.5vw,2.8rem);text-transform:uppercase;margin:0.9rem 0;">' + C.esc(article.title) + "</h1>" +
        (article.author ? '<p style="color:var(--muted);">By ' + C.esc(article.author) + "</p>" : "") + "</div>" +
        (article.image ? '<img src="' + C.esc(article.image) + '" alt="' + C.esc(article.title) + '" style="border-radius:14px;margin:1.4rem 0;aspect-ratio:16/9;object-fit:cover;width:100%;">' : "") +
        '<div class="article-body">' + String(article.body || "").split(/\n+/).map(function (p) {
          return "<p>" + C.esc(p) + "</p>";
        }).join("") + "</div>" +
        '<a class="btn btn-outline btn-sm" href="news.html">&larr; ALL NEWS</a>';
      return;
    }

    mount.innerHTML = all.length
      ? '<div class="grid grid-3">' + all.map(function (n) {
          return '<article class="card news-card">' +
            (n.image ? '<img class="nc-img" src="' + C.esc(n.image) + '" alt="' + C.esc(n.title) + '" loading="lazy">' : "") +
            '<div class="nc-body"><div class="nc-meta"><span class="chip chip-yellow">' + C.esc(n.category || "CLUB") + "</span>" +
            (n.date ? '<span class="chip">' + C.fmtDate(n.date) + "</span>" : "") + "</div>" +
            "<h3>" + C.esc(n.title) + "</h3><p>" + C.esc((n.body || "").slice(0, 150)) + "&hellip;</p>" +
            '<a class="nc-more" href="news.html?id=' + encodeURIComponent(n.id) + '">Read more</a></div></article>';
        }).join("") + "</div>"
      : '<div class="empty-state"><span class="es-title">NEWSROOM COMING SOON</span>Match reports, club announcements and player news will appear here.</div>';

  });
})();
