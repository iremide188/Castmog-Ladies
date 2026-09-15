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

    var autoGoals = (C.goalLog()[p.id] || []);
    var totalGoals = (p.goals || 0) + autoGoals.length;
    html += '<section class="section" style="padding:2rem 0 0;"><div class="stat-strip">' +
      '<div class="stat-tile"><b>' + C.esc(p.appearances || 0) + '</b><span>Appearances</span></div>' +
      '<div class="stat-tile"><b>' + C.esc(totalGoals) + '</b><span>Goals</span></div>' +
      '<div class="stat-tile"><b>' + C.esc(p.assists || 0) + '</b><span>Assists</span></div>' +
      "</div>";

    if (autoGoals.length) {
      html += '<div class="panel" style="margin-top:1.2rem;"><span class="motto" style="color:var(--green);">GOAL LOG &mdash; FROM MATCHES</span>' +
        autoGoals.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).map(function (g) {
          return '<div class="goal-row"><b class="gr-min">' + C.esc(g.minute ? g.minute + "&prime;" : "GOAL") + "</b>" +
            '<span class="gr-main">vs ' + C.esc(g.opponent) +
            (g.competition ? " &middot; " + C.esc(g.competition) : "") +
            (g.score ? " &middot; " + C.esc(g.score) : "") + "</span>" +
            '<span class="gr-date">' + C.fmtDate(g.date) + "</span></div>";
        }).join("") + "</div>";
    }

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
          return C.mediaItem ? C.mediaItem(v, p.name) : C.ytFacade(v, p.name);
        }).join("") + "</div></section>";
    }

    if (p.gallery && p.gallery.length) {
      html += '<section class="section" style="padding:2rem 0 0;"><h2 class="section-title" style="font-size:1.5rem;">GALLERY</h2>' +
        '<div class="media-grid" style="margin-top:1.2rem;">' + p.gallery.map(function (g) {
          return '<div class="media-item"><img src="' + C.esc(g) + '" alt="' + C.esc(p.name) + '" loading="lazy"></div>';
        }).join("") + "</div></section>";
    }

    var socialLinks = [];
    if (p.socialUrl) {
      var u = String(p.socialUrl).toLowerCase(), lab = "SOCIAL MEDIA";
      if (u.indexOf("instagram") > -1) lab = "INSTAGRAM";
      else if (u.indexOf("tiktok") > -1) lab = "TIKTOK";
      else if (u.indexOf("twitter") > -1 || u.indexOf("x.com") > -1) lab = "X / TWITTER";
      else if (u.indexOf("facebook") > -1) lab = "FACEBOOK";
      socialLinks.push('<a href="' + C.esc(p.socialUrl) + '" target="_blank" rel="noopener">' + lab + "</a>");
    }
    if (p.social && p.social.instagram) socialLinks.push('<a href="' + C.esc(p.social.instagram) + '" target="_blank" rel="noopener">INSTAGRAM</a>');
    if (p.social && p.social.twitter) socialLinks.push('<a href="' + C.esc(p.social.twitter) + '" target="_blank" rel="noopener">X / TWITTER</a>');
    if (socialLinks.length) {
      html += '<section class="section" style="padding:2rem 0 0;"><div class="footer-social">' + socialLinks.join("") + "</div></section>";
    }

    html += '<section class="section" style="padding:2rem 0;"><a class="btn btn-outline btn-sm" href="squad.html">&larr; BACK TO SQUAD</a></section>';

    mount.innerHTML = html;
    C.activateFacades(mount);
  });
})();
