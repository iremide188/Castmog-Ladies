/* =====================================================
   CASTMOG LADIES — data layer
   Loads the JSON "database" (data/*.json) and exposes
   helpers shared by every page: squad grouping, next
   match, latest result, head-to-head, formatting.
   ===================================================== */

window.CLUB = (function () {
  "use strict";

  var FILES = ["settings", "club", "players", "staff", "matches", "news", "achievements", "media", "training", "youtube"];
  var db = {};
  var onReady = [];

  function load() {
    var left = FILES.length;
    FILES.forEach(function (name) {
      fetch("data/" + name + ".json", { cache: "no-cache" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { db[name] = j; })
        .catch(function () { db[name] = null; })
        .then(function () {
          left--;
          if (left === 0) onReady.forEach(function (cb) { cb(); });
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }

  /* ---------- helpers ---------- */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function get(name) { return db[name]; }
  function ready() { return Object.keys(db).length > 0; }

  function pub(list) {
    return (list || []).filter(function (x) { return x.published !== false; });
  }

  var MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
  }

  function shortDate(iso) {
    if (!iso) return { d: "", m: "" };
    var dte = new Date(iso + "T00:00:00");
    if (isNaN(dte)) return { d: "?", m: "" };
    return { d: dte.getDate(), m: MONTHS[dte.getMonth()] };
  }

  var POS_ORDER = { GK: 0, DEF: 1, MID: 2, ATT: 3 };
  var POS_LABEL = { GK: "GOALKEEPERS", DEF: "DEFENDERS", MID: "MIDFIELDERS", ATT: "ATTACKERS" };

  function squad() {
    return pub(db.players)
      .slice()
      .sort(function (a, b) {
        var pa = POS_ORDER[a.position] != null ? POS_ORDER[a.position] : 9;
        var pb = POS_ORDER[b.position] != null ? POS_ORDER[b.position] : 9;
        return pa - pb || (a.number || 0) - (b.number || 0);
      });
  }

  function squadByPosition() {
    var groups = {};
    squad().forEach(function (p) {
      var key = ["GK", "DEF", "MID", "ATT"].indexOf(p.position) !== -1 ? p.position : "ATT";
      (groups[key] = groups[key] || []).push(p);
    });
    return groups;
  }

  function playerById(id) {
    return (db.players || []).filter(function (p) { return p.id === id; })[0] || null;
  }

  function upcoming() {
    var now = new Date();
    return pub(db.matches)
      .filter(function (m) {
        return m.status === "scheduled" && m.date && new Date(m.date + "T" + (m.time || "00:00")) >= new Date(now.toDateString());
      })
      .sort(function (a, b) { return (a.date + (a.time || "")) < (b.date + (b.time || "")) ? -1 : 1; });
  }

  function nextMatch() { return upcoming()[0] || null; }

  function finished() {
    return pub(db.matches)
      .filter(function (m) { return m.status === "finished" && m.date; })
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  }

  function latestResult() { return finished()[0] || null; }

  /* Head-to-head vs one opponent — computed live from match history */
  function headToHead(opponent) {
    var key = String(opponent || "").trim().toLowerCase();
    if (!key) return null;
    var meetings = (db.matches || []).filter(function (m) {
      return String(m.opponent || "").trim().toLowerCase() === key && m.status === "finished";
    }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });

    var gf = 0, ga = 0, w = 0, d = 0, l = 0;
    meetings.forEach(function (m) {
      var cs = m.scoreCastmog == null ? "" : m.scoreCastmog;
      var os = m.scoreOpponent == null ? "" : m.scoreOpponent;
      if (cs !== "" && os !== "") {
        gf += cs; ga += os;
        if (cs > os) w++; else if (cs === os) d++; else l++;
      }
    });
    return { meetings: meetings, total: meetings.length, wins: w, draws: d, losses: l, gf: gf, ga: ga };
  }

  function initials(name) {
    return String(name || "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (p) { return p.charAt(0).toUpperCase(); })
      .join("");
  }

  /* YouTube facade: thumbnail only until clicked (performance) */
  function ytThumb(videoId) {
    return "https://i.ytimg.com/vi/" + encodeURIComponent(videoId) + "/hqdefault.jpg";
  }

  function ytFacade(videoId, title) {
    var id = "yt-" + videoId;
    return (
      '<div class="yt-facade" data-ytid="' + esc(videoId) + '" role="button" tabindex="0" aria-label="Play video">' +
      '<img src="' + ytThumb(videoId) + '" alt="' + esc(title || "Video") + '" loading="lazy">' +
      '<div class="yt-play"></div>' +
      "</div>"
    );
  }

  function activateFacades(root) {
    (root || document).querySelectorAll(".yt-facade[data-ytid]").forEach(function (el) {
      function play() {
        el.innerHTML =
          '<iframe src="https://www.youtube-nocookie.com/embed/' + esc(el.getAttribute("data-ytid")) +
          '?autoplay=1&rel=0" title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
        el.classList.add("live-embed");
      }
      el.addEventListener("click", play);
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); play(); }
      });
    });
  }

  function waLink(text) {
    var s = db.settings || {};
    var base = s.whatsappLink || "https://wa.me/2349130527339";
    return base + "?text=" + encodeURIComponent(text);
  }

  return {
    get: get, ready: ready, pub: pub, esc: esc,
    fmtDate: fmtDate, shortDate: shortDate,
    squad: squad, squadByPosition: squadByPosition, playerById: playerById,
    POS_LABEL: POS_LABEL, POS_ORDER: POS_ORDER,
    upcoming: upcoming, nextMatch: nextMatch, finished: finished, latestResult: latestResult,
    headToHead: headToHead, initials: initials,
    ytThumb: ytThumb, ytFacade: ytFacade, activateFacades: activateFacades,
    waLink: waLink,
    onReady: function (cb) {
      onReady.push(cb);
      if (ready()) cb();
    }
  };
})();
