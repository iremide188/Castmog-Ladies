/* Media Centre — filterable gallery: photos, videos, training, highlights, interviews, news, YouTube */
(function () {
  "use strict";
  var C = window.CLUB;
  var FILTERS = [
    ["all", "ALL"], ["photos", "PHOTOS"], ["videos", "VIDEOS"], ["training", "TRAINING"],
    ["match-highlights", "MATCH HIGHLIGHTS"], ["interviews", "INTERVIEWS"], ["news", "NEWS"], ["youtube", "YOUTUBE"], ["tiktok", "TIKTOK"]
  ];
  var active = "all";

  function itemHtml(m) {
    var tag = '<span class="mi-tag chip chip-yellow">' + C.esc((m.category || "photos").replace("-", " ").toUpperCase()) + "</span>";
    if (m.type === "photo") {
      return '<figure class="media-item">' + tag +
        '<img src="' + C.esc(m.url) + '" alt="' + C.esc(m.caption || "Castmog media") + '" loading="lazy">' +
        (m.caption ? '<figcaption class="mi-cap">' + C.esc(m.caption) + "</figcaption>" : "") + "</figure>";
    }
    if (m.type === "youtube" && m.youtubeId) {
      return '<div>' + C.ytFacade(m.youtubeId, m.caption) + (m.caption ? '<div class="yt-title">' + C.esc(m.caption) + "</div>" : "") + "</div>";
    }
    if (m.type === "tiktok" && m.url) {
      return '<a class="media-item" href="' + C.esc(m.url) + '" target="_blank" rel="noopener">' + tag +
        '<img src="' + C.esc(m.cover || "") + '" alt="' + C.esc(m.caption || "TikTok post") + '" loading="lazy">' +
        '<figcaption class="mi-cap">' + C.esc(m.caption || "Watch on TikTok") + "</figcaption></a>";
    }
    if (m.type === "video" && m.url) {
      return '<a class="media-item" href="' + C.esc(m.url) + '" target="_blank" rel="noopener">' + tag +
        '<img src="' + C.esc(m.thumb || m.url) + '" alt="' + C.esc(m.caption || "Video") + '" loading="lazy">' +
        '<figcaption class="mi-cap">' + C.esc(m.caption || "Watch video") + "</figcaption></a>";
    }
    return "";
  }

  window.CLUB.onReady(function () {
    var bar = document.getElementById("media-filters");
    var mount = document.getElementById("media-mount");
    if (!bar || !mount) return;
    var yt = C.get("youtube") || {};

    bar.innerHTML = FILTERS.map(function (f) {
      return '<button class="filter-chip' + (f[0] === active ? " active" : "") + '" data-f="' + f[0] + '">' + f[1] + "</button>";
    }).join("");

    function render() {
      var items = C.pub(C.get("media"));
      var list = active === "all" ? items : items.filter(function (m) { return (m.category || "photos") === active; });
      var ytVids = (yt.videos || []).map(function (v) {
        return { type: "youtube", youtubeId: v.youtubeId, caption: v.title, category: "youtube", published: true };
      });
      if (active === "all" || active === "youtube") list = list.concat(ytVids);
      if (active === "videos") list = list.concat(ytVids);
      var tt = C.get("tiktok") || {};
      var ttVids = (tt.videos || []).map(function (v) {
        return { type: "tiktok", url: v.url, cover: v.cover, caption: (v.desc || "New TikTok post").slice(0, 70), category: "tiktok", published: true };
      });
      if (active === "all" || active === "tiktok" || active === "videos") list = list.concat(ttVids);

      mount.innerHTML = list.length
        ? '<div class="media-grid">' + list.map(itemHtml).join("") + "</div>"
        : '<div class="empty-state"><span class="es-title">NOTHING HERE YET</span>Content will appear once the club adds it.</div>';
      C.activateFacades(mount);
    }

    document.addEventListener("club:videos-updated", render);

    bar.addEventListener("click", function (e) {
      var b = e.target.closest("[data-f]");
      if (!b) return;
      active = b.getAttribute("data-f");
      bar.querySelectorAll(".filter-chip").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      render();
    });

    var liveEl = document.getElementById("media-live");
    if (liveEl) {
      liveEl.innerHTML = yt.live && yt.liveVideoId
        ? '<div><span class="live-badge"><span class="live-dot"></span>LIVE NOW</span><div class="live-embed" style="margin-top:1rem;max-width:860px;"><iframe src="https://www.youtube-nocookie.com/embed/' + C.esc(yt.liveVideoId) + '" title="Live stream" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div></div>'
        : '<span class="chip">NOT CURRENTLY LIVE</span>';
    }

    render();
  });
})();
