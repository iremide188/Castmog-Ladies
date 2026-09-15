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

    /* Social follow buttons — accepts full links or @handles */
    var ICONS = {
      instagram: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" style="flex:none;"><rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>',
      x: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="flex:none;"><path d="M18.9 1.2h3.7l-8.1 9.2 9.5 12.4h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L0 1.2h7.6l5.2 6.9 6.1-6.9Zm-1.3 19.6h2L6.5 3.2H4.3l13.3 17.6Z"/></svg>',
      tiktok: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="flex:none;"><path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-1.8-2.5V9.8a6 6 0 1 0 5.2 5.9V8.7a7.3 7.3 0 0 0 4.2 1.4V7a4.3 4.3 0 0 1-3.4-1.2Z"/></svg>',
      facebook: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="flex:none;"><path d="M13.5 21v-7h2.6l.4-3h-3V9.1c0-.9.3-1.5 1.6-1.5h1.5V5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8V11H8v3h2.7v7h2.8Z"/></svg>'
    };
    var BASES = { instagram: "https://instagram.com/", x: "https://x.com/", tiktok: "https://tiktok.com/@", facebook: "https://facebook.com/" };
    function socialHref(net, v) {
      var t = String(v == null ? "" : v).trim();
      if (!t) return "";
      if (t.charAt(0) === "@") return BASES[net] + t.slice(1);
      if (/^https?:\/\//i.test(t)) return t;
      return "https://" + t.replace(/^\/+/, "");
    }
    var NETS = [["instagram", "INSTAGRAM"], ["x", "X"], ["tiktok", "TIKTOK"], ["facebook", "FACEBOOK"]];
    var soc = (m.social || {});
    var links = NETS.map(function (n) {
      return { label: n[1], href: socialHref(n[0], soc[n[0]]) };
    }).filter(function (l) { return l.href; });
    /* legacy single field fallback */
    if (!links.length && m.socialUrl) {
      links = [{ label: "FOLLOW ON SOCIAL MEDIA", href: socialHref("instagram", m.socialUrl) }];
    }
    if (links.length) {
      html += '<section class="section" style="padding:1.6rem 0 0;"><div class="footer-social">' +
        links.map(function (l) {
          var ic = ICONS[(l.label || "").toLowerCase()] || "";
          return '<a href="' + C.esc(l.href) + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:0.45rem;">' + ic + C.esc(l.label) + "</a>";
        }).join("") + "</div></section>";
    }

    html += '<section class="section" style="padding:2rem 0;"><a class="btn btn-outline btn-sm" href="club.html">&larr; BACK TO THE CLUB</a></section>';

    mount.innerHTML = html;
  });
})();
