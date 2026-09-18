/* Contact page — renders official contacts from data/settings.json */
(function () {
  "use strict";
  var C = window.CLUB;
  window.CLUB.onReady(function () {
    var s = C.get("settings") || {};
    var tr = C.get("training") || {};

    var e = document.getElementById("contact-email");
    if (e) e.innerHTML = '<a href="mailto:' + C.esc(s.email || "") + '">' + C.esc(s.email || "") + "</a>";

    var p = document.getElementById("contact-phone");
    if (p) p.innerHTML = '<a href="' + C.esc(s.whatsappLink || "#") + '" target="_blank" rel="noopener">' + C.esc(s.whatsappDisplay || s.phone || "") + "</a>";

    var t = document.getElementById("contact-training");
    if (t) {
      if (Array.isArray(tr.weekly) && tr.weekly.length) {
        var first = tr.weekly[0] || {};
        t.textContent = "MONDAY – FRIDAY" + (first.time ? " — " + first.time : "") + (first.location ? " · " + first.location : "");
      } else {
        t.textContent = (tr.days || "") + (tr.time ? " — " + tr.time : "") + (tr.location ? " · " + tr.location : " — location to be announced");
      }
    }

    var so = document.getElementById("contact-social");
    if (so && s.social) {
      var names = { youtube: "YOUTUBE", instagram: "INSTAGRAM", facebook: "FACEBOOK", tiktok: "TIKTOK", twitter: "X / TWITTER" };
      so.innerHTML = '<div class="footer-social">' + Object.keys(names).map(function (k) {
        return s.social[k] ? '<a href="' + C.esc(s.social[k]) + '" target="_blank" rel="noopener">' + names[k] + "</a>" : "";
      }).join("") + "</div>";
    }
  });
})();
