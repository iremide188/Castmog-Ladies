/* Coach profile — renders from data/staff.json, hides empty fields */
(function () {
  "use strict";
  var C = window.CLUB;
  var id = new URLSearchParams(window.location.search).get("id");

  window.CLUB.onReady(function () {
    var mount = document.getElementById("coach-mount");
    if (!mount) return;
    var m = C.pub(C.get("staff")).filter(function (s) { return s.id === id; })[0];

    if (!m) {
      mount.innerHTML = '<div class="empty-state"><span class="es-title">COACH NOT FOUND</span>' +
        'This coach profile is not available. <a href="club.html" style="color:var(--yellow);">Back to the club</a></div>';
      return;
    }

    document.title = m.name + " — Castmog Ladies";
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", m.name + " — " + (m.role || "Coach") + " of Castmog Ladies Football Club.");

    var avatar = m.photo
      ? '<img class="ph-photo" src="' + C.esc(m.photo) + '" alt="' + C.esc(m.name) + '">'
      : '<div class="ph-avatar">' + C.initials(m.name) + "</div>";

    var html =
      '<div class="profile-head">' + avatar +
      '<div><div class="ph-name">' + C.esc(m.name) + "</div>" +
      '<div class="ph-chips"><span class="chip chip-yellow">' + C.esc(m.role || "COACH") + "</span>" +
      '<span class="chip">CASTMOG LADIES FC</span></div></div>' +
      "</div>";

    if (m.bio) {
      html += '<section class="section" style="padding:2rem 0 0;"><div class="panel">' +
        '<span class="motto" style="color:var(--green);">BIOGRAPHY</span>' +
        "<p style=\"margin-top:0.8rem;\">" + C.esc(m.bio).replace(/\n/g, "<br>") + "</p></div></section>";
    }

    var info = [
      ["Role", m.role],
      ["Qualifications", m.qualifications],
      ["Coaching experience", m.experience]
    ].filter(function (r) { return r[1]; });

    if (info.length) {
      html += '<section class="section" style="padding:2rem 0 0;"><h2 class="section-title" style="font-size:1.5rem;">PROFILE</h2>' +
        '<div class="info-grid" style="margin-top:1.2rem;">' + info.map(function (r) {
          return '<div class="ig-item"><span class="ig-label">' + C.esc(r[0]) + '</span><span class="ig-value">' + C.esc(r[1]) + "</span></div>";
        }).join("") + "</div></section>";
    }

    if (m.socialUrl) {
      var u = String(m.socialUrl).toLowerCase(), lab = "FOLLOW ON SOCIAL MEDIA";
      if (u.indexOf("instagram") > -1) lab = "FOLLOW ON INSTAGRAM";
      else if (u.indexOf("tiktok") > -1) lab = "FOLLOW ON TIKTOK";
      else if (u.indexOf("twitter") > -1 || u.indexOf("x.com") > -1) lab = "FOLLOW ON X / TWITTER";
      else if (u.indexOf("facebook") > -1) lab = "FOLLOW ON FACEBOOK";
      html += '<section class="section" style="padding:1.6rem 0 0;"><div class="footer-social">' +
        '<a href="' + C.esc(m.socialUrl) + '" target="_blank" rel="noopener">' + lab + "</a></div></section>";
    }

    html += '<section class="section" style="padding:2rem 0;"><a class="btn btn-outline btn-sm" href="club.html">&larr; BACK TO THE CLUB</a></section>';

    mount.innerHTML = html;
  });
})();
