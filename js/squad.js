/* Squad page — grouped by position from data/players.json */
(function () {
  "use strict";
  var C = window.CLUB;
  window.CLUB.onReady(function () {
    var mount = document.getElementById("squad-mount");
    if (!mount) return;
    var groups = C.squadByPosition();
    var order = ["GK", "DEF", "MID", "ATT"];
    var html = "";
    order.forEach(function (pos) {
      var list = groups[pos] || [];
      if (!list.length) return;
      html += '<div class="position-group"><div class="pos-label">' + C.POS_LABEL[pos] +
        ' <span style="color:var(--muted);font-size:0.95rem;">(' + list.length + ")</span></div>" +
        '<div class="player-grid">' +
        list.map(function (p) {
          var img = p.photo
            ? '<img class="pc-photo" src="' + C.esc(p.photo) + '" alt="' + C.esc(p.name) + '" loading="lazy">'
            : '<div class="pc-avatar">' + C.initials(p.name) + "</div>";
          var gl = (p.goals || 0) + ((C.goalLog()[p.id] || []).length);
          return '<a class="player-card" href="player.html?id=' + encodeURIComponent(p.id) + '">' +
            '<span class="pc-number">' + C.esc(p.number) + "</span>" + img +
            '<div class="pc-name">' + C.esc(p.name) + "</div>" +
            '<div class="pc-pos">' + C.esc(p.positionLabel || "") + "</div>" +
            (gl ? '<div class="pc-goals">' + gl + " GOAL" + (gl > 1 ? "S" : "") + "</div>" : "") + "</a>";
        }).join("") + "</div></div>";
    });
    var total = C.squad().length;
    document.getElementById("squad-count").textContent = total + " PLAYERS";
    mount.innerHTML = html;
  });
})();
