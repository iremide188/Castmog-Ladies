/* Player profile — renders from data/players.json, hides empty fields */
(function () {
  "use strict";
  var C = window.CLUB;
  var id = new URLSearchParams(window.location.search).get("id");

  window.CLUB.onReady(function () {
    var mount = document.getElementById("player-mount");
    if (!mount) return;
    var p = C.playerById(id);

    if (!p || p.published === false) {
      mount.innerHTML = '<div class="empty-state"><span class="es-title">PLAYER NOT FOUND</span>' +
        'This player profile is not available. <a href="squad.html" style="color:var(--yellow);">Back to squad</a></div>';
      return;
    }

    document.title = p.name + " — Castmog Ladies";
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", p.name + " — " + (p.positionLabel || "Player") + " of Castmog Ladies.");

    var avatar = p.photo
      ? '<img class="ph-photo" src="' + C.esc(p.photo) + '" alt="' + C.esc(p.name) + '">'
      : '<div class="ph-avatar">' + C.initials(p.name) + "</div>";

    var chips = '<span class="chip chip-yellow">' + C.esc(p.positionLabel || "") + "</span>";
    if (p.secondaryPosition) chips += '<span class="chip">' + C.esc(p.secondaryPosition) + "</span>";
    if (p.foot) chips += '<span class="chip">' + C.esc(p.foot) + ' FOOTED</span>';
    if (p.nationality) chips += '<span class="chip">' + C.esc(p.nationality) + "</span>";

    var html =
      '<div class="profile-head">' + avatar +
      '<div><div class="ph-name">' + C.esc(p.name) + "</div>" +
      (p.nickname ? '<p style="color:var(--muted);">&ldquo;' + C.esc(p.nickname) + "&rdquo;</p>" : "") +
      '<div class="ph-chips">' + chips + "</div></div>" +
      '<div class="ph-jersey">#' + C.esc(p.number) + "</div></div>";

    if (p.biography || p.previousClubs.length) {
      html += '<section class="section" style="padding:2rem 0 0;"><div class="panel">' +
        (p.biography ? "<h3>BIOGRAPHY</h3><p>" + C.esc(p.biography).replace(/\n/g, "<br>") + "</p>" : "") +
        (p.previousClubs && p.previousClubs.length ? '<p style="margin-top:0.8rem;color:var(--muted);font-size:0.88rem;">Previous clubs: ' + C.esc(p.previousClubs.join(", ")) + "</p>" : "") +
        "</div></section>";
    }

    html += '<section class="section" style="padding:2rem 0 0;"><div class="stat-strip">' +
      '<div class="stat-tile"><b>' + C.esc(p.appearances || 0) + '</b><span>Appearances</span></div>' +
      '<div class="stat-tile"><b>' + C.esc(p.goals || 0) + '</b><span>Goals</span></div>' +
      '<div class="stat-tile"><b>' + C.esc(p.assists || 0) + '</b><span>Assists</span></div>' +
      "</div>";

    var info = [
      ["Date of birth", p.dob ? C.fmtDate(p.dob) : ""],
      ["Nationality", p.nationality],
      ["Preferred foot", p.foot],
      ["Height", p.height],
      ["Position", p.positionLabel],
      ["Secondary position", p.secondaryPosition],
      ["Jersey number", p.number],
      ["Previous clubs", p.previousClubs && p.previousClubs.length ? p.previousClubs.join(", ") : ""]
    ].filter(function (r) { return r[1]; });

    if (info.length) {
      html += '<div class="info-grid">' + info.map(function (r) {
        return '<div class="ig-item"><span class="ig-label">' + C.esc(r[0]) + '</span><span class="ig-value">' + C.esc(r[1]) + "</span></div>";
      }).join("") + "</div></section>";
    }

    if (p.highlight) {
      html += '<section class="section" style="padding:2rem 0 0;"><h2 class="section-title" style="font-size:1.5rem;">HIGHLIGHT VIDEO</h2>' +
        '<div style="margin-top:1.2rem;">' + C.ytFacade(p.highlight, p.name + " highlights") + "</div></section>";
    }

    if (p.videos && p.videos.length) {
      html += '<section class="section" style="padding:2rem 0 0;"><h2 class="section-title" style="font-size:1.5rem;">VIDEOS</h2>' +
        '<div class="yt-grid" style="margin-top:1.2rem;">' + p.videos.map(function (v) {
          return C.ytFacade(v, p.name);
        }).join("") + "</div></section>";
    }

    if (p.gallery && p.gallery.length) {
      html += '<section class="section" style="padding:2rem 0 0;"><h2 class="section-title" style="font-size:1.5rem;">GALLERY</h2>' +
        '<div class="media-grid" style="margin-top:1.2rem;">' + p.gallery.map(function (g) {
          return '<div class="media-item"><img src="' + C.esc(g) + '" alt="' + C.esc(p.name) + '" loading="lazy"></div>';
        }).join("") + "</div></section>";
    }

    if (p.social && (p.social.instagram || p.social.twitter)) {
      html += '<section class="section" style="padding:2rem 0 0;"><div class="footer-social">' +
        (p.social.instagram ? '<a href="' + C.esc(p.social.instagram) + '" target="_blank" rel="noopener">INSTAGRAM</a>' : "") +
        (p.social.twitter ? '<a href="' + C.esc(p.social.twitter) + '" target="_blank" rel="noopener">X / TWITTER</a>' : "") +
        "</div></section>";
    }

    html += '<section class="section" style="padding:2rem 0;"><a class="btn btn-outline btn-sm" href="squad.html">&larr; BACK TO SQUAD</a></section>';

    mount.innerHTML = html;
    C.activateFacades(mount);
  });
})();
