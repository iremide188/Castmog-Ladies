/* Achievements / Honours from data/achievements.json */
(function () {
  "use strict";
  var C = window.CLUB;
  window.CLUB.onReady(function () {
    var mount = document.getElementById("achievements-mount");
    if (!mount) return;
    var ach = C.pub(C.get("achievements"));
    mount.innerHTML = ach.length
      ? '<div class="grid grid-3">' + ach.map(function (a) {
          return '<div class="card honour-card hc-has-img">' +
            (a.image ? '<img src="' + C.esc(a.image) + '" alt="' + C.esc(a.trophy) + '" class="hc-img" loading="lazy">' : '<div class="hc-icon">&#127942;</div>') +
            '<span class="hc-year">' + C.esc(a.year) + "</span>" +
            "<h3>" + C.esc(a.trophy) + "</h3>" +
            (a.description ? "<p>" + C.esc(a.description) + "</p>" : "") +
            (a.category ? '<span class="chip chip-green" style="margin-top:0.6rem;">' + C.esc(a.category) + "</span>" : "") +
            "</div>";
        }).join("") + "</div>"
      : '<div class="empty-state"><span class="es-title">HONOURS BOARD COMING SOON</span>The club\'s achievements and honours will be listed here once recorded.</div>';
  });
})();
