/* Club page — only admin-APPROVED information is shown publicly.
   Unapproved researched info stays hidden; empty sections show COMING SOON. */
(function () {
  "use strict";
  var C = window.CLUB;
  window.CLUB.onReady(function () {
    var mount = document.getElementById("club-mount");
    if (!mount) return;
    var sections = (C.get("club") || {}).sections || [];
    var html = '<div class="grid grid-2">';
    sections.forEach(function (s) {
      if (s.published && s.body) {
        html += '<div class="panel"><span class="motto" style="color:var(--green);">' + C.esc(s.title) + "</span>" +
          '<p style="margin-top:0.7rem;">' + C.esc(s.body).replace(/\n/g, "<br>") + "</p>" +
          (s.source ? '<p style="margin-top:0.8rem;font-size:0.72rem;color:var(--muted);">Source: ' + C.esc(s.source) + "</p>" : "") +
          "</div>";
      } else {
        html += '<div class="empty-state"><span class="es-title">' + C.esc(s.title) + "</span>COMING SOON</div>";
      }
    });
    html += "</div>";
    mount.innerHTML = html;
  });
})();

/* Staff cards on the Club page */
(function () {
  "use strict";
  window.CLUB.onReady(function () {
    var mount = document.getElementById("club-staff");
    if (!mount) return;
    var C = window.CLUB;
    var staff = C.pub(C.get("staff"));
    mount.innerHTML = staff.map(function (m) {
      var img = m.photo
        ? '<img class="sc-photo" src="' + C.esc(m.photo) + '" alt="' + C.esc(m.name) + '" loading="lazy">'
        : '<div class="sc-avatar">' + C.initials(m.name) + "</div>";
      return '<div class="card staff-card">' + img +
        '<p class="sc-name">' + C.esc(m.name) + "</p>" +
        '<span class="sc-role">' + C.esc(m.role) + "</span>" +
        (m.socialUrl ? '<a class="sc-social" href="' + C.esc(m.socialUrl) + '" target="_blank" rel="noopener">FOLLOW ON SOCIAL MEDIA</a>' : "") +
        (m.bio ? '<p style="font-size:0.9rem;">' + C.esc(m.bio.slice(0, 200)) + "&hellip;</p>" : "") +
        "</div>";
    }).join("");
  });
})();
