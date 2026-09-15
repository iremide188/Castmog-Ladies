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
          if (left === 0) {
            var st = (db.settings && typeof db.settings === "object") ? db.settings : {};
            fetchChannelVideos();
            if (st.bannerImage) {
              document.documentElement.classList.add("has-banner");
              document.documentElement.style.setProperty("--page-banner", 'url("' + st.bannerImage + '")');
            }
            onReady.forEach(function (cb) { cb(); });
          }
        });
    });
  }


  /* ---------- Auto YouTube videos: anything posted on the club channel
     appears on the site automatically (feed fetched through public
     JSON/XML converters, with a fallback; silent if unreachable) ---------- */
  function mergeChannelVideos(feedVids) {
    if (!feedVids.length) return;
    var yt = db.youtube && typeof db.youtube === "object" ? db.youtube : (db.youtube = {});
    var vids = yt.videos || (yt.videos = []);
    var seen = {};
    vids.forEach(function (v) { if (v && v.youtubeId) seen[v.youtubeId] = true; });
    var added = feedVids.filter(function (v) { return v.youtubeId && !seen[v.youtubeId]; });
    if (!added.length) return;
    yt.videos = vids.concat(added).sort(function (x, y) {
      return String(y.date || "").localeCompare(String(x.date || ""));
    });
    try { document.dispatchEvent(new CustomEvent("club:videos-updated")); } catch (e) {}
  }

  function parseChannelFeed(xmlText) {
    var doc = new DOMParser().parseFromString(xmlText, "text/xml");
    var out = [];
    Array.prototype.forEach.call(doc.getElementsByTagName("entry"), function (e) {
      function tag(name) {
        var t = e.getElementsByTagName(name)[0];
        return t ? (t.textContent || "").trim() : "";
      }
      var id = tag("yt:videoId") || (tag("link").indexOf("v=") > -1 ? tag("link").split("v=")[1].split("&")[0] : "");
      if (id) out.push({
        title: tag("title"),
        youtubeId: id,
        date: tag("published").slice(0, 10),
        auto: true
      });
    });
    return out;
  }

  function fetchChannelVideos() {
    var cid = (db.youtube && db.youtube.channelId) || "";
    if (!cid) return;
    var rss = "https://www.youtube.com/feeds/videos.xml?channel_id=" + encodeURIComponent(cid);
    fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(rss))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (j && j.items && j.items.length) {
          mergeChannelVideos(j.items.map(function (it) {
            var id = "";
            try { id = (it.link || "").split("v=")[1] || (it.guid || "").replace("yt:video:", "") || ""; } catch (e) {}
            return { title: it.title || "", youtubeId: id.split("&")[0], date: String(it.pubDate || "").slice(0, 10), auto: true };
          }).filter(function (v) { return v.youtubeId; }));
        } else {
          return fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(rss))
            .then(function (r) { return r.ok ? r.text() : ""; })
            .then(function (txt) { if (txt) mergeChannelVideos(parseChannelFeed(txt)); })
            .catch(function () {});
        }
      })
      .catch(function () {
        fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(rss))
          .then(function (r) { return r.ok ? r.text() : ""; })
          .then(function (txt) { if (txt) mergeChannelVideos(parseChannelFeed(txt)); })
          .catch(function () {});
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }

  startLivePolling();

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

  /* Auto goal log — every scorer saved on a match feeds the player profile:
     opponent, competition (friendly/tournament), minute, score and date. */
  function goalLog() {
    var log = {};
    (db.matches || []).forEach(function (m) {
      if (!m || m.published === false) return;
      var finalScore = m.status === "finished" && m.scoreCastmog != null && m.scoreOpponent != null;
      var liveScore = m.liveScoreCastmog != null || m.liveScoreOpponent != null;
      if (!finalScore && !liveScore) return;
      var score = finalScore
        ? (m.scoreCastmog + "\u2013" + m.scoreOpponent)
        : ((m.liveScoreCastmog == null ? 0 : m.liveScoreCastmog) + "\u2013" + (m.liveScoreOpponent == null ? 0 : m.liveScoreOpponent));
      (m.scorers || []).forEach(function (s) {
        if (!s || !s.name) return;
        var key = s.id || s.name.toLowerCase().replace(/\s+/g, "-");
        (log[key] = log[key] || []).push({
          opponent: m.opponent || "",
          competition: m.competition || "",
          date: m.date || "",
          minute: s.minute || "",
          score: score
        });
      });
    });
    return log;
  }

  function playerById(id) {
    return (db.players || []).filter(function (p) { return p.id === id; })[0] || null;
  }

  /* Understands 8am, 8 AM, 8:00, 8.00am, 15:30, 4:00 PM etc. */
  function parseTime(t) {
    t = String(t == null ? "" : t).trim().toUpperCase().replace(/[.]/g, ":");
    var m = t.match(/^(\d{1,2})(?::?(\d{2}))?\s*(AM|PM)?$/);
    if (!m) return null;
    var h = parseInt(m[1], 10);
    var min = m[2] ? parseInt(m[2], 10) : 0;
    if (m[3] === "PM" && h < 12) h += 12;
    if (m[3] === "AM" && h === 12) h = 0;
    if (h > 23 || min > 59) return null;
    return (h < 10 ? "0" : "") + h + ":" + (min < 10 ? "0" : "") + min;
  }

  function kickoff(m) {
    return new Date(m.date + "T" + (parseTime(m.time) || "00:00") + ":00");
  }

  /* direct video files render as <video>, everything else as YouTube facade */
  function isFileVideo(v) {
    v = String(v || "").toLowerCase();
    return v.indexOf("assets/") === 0 || /\.(mp4|webm|mov|m4v|ogg)$/.test(v);
  }

  function mediaItem(v, label) {
    if (isFileVideo(v)) return '<div class="video-file"><video controls preload="metadata" src="' + esc(v) + '"></video><div class="vf-cap">' + esc(label) + "</div></div>";
    return ytFacade(v, label);
  }

  /* ---------- live match clock ----------
     Real minutes from kickoff: 0-45 first half, 15-minute
     HALF TIME break, second half to 90, then FULL TIME. */
  function liveClock(ts) {
    var el = (Date.now() - ts) / 60000;
    if (el < 0) return { phase: "pre", minute: 0 };
    if (el < 45) return { phase: "first", minute: Math.min(45, Math.max(1, Math.ceil(el))) };
    if (el < 60) return { phase: "ht", minute: 45 };
    if (el < 105) return { phase: "second", minute: Math.min(90, 45 + Math.max(1, Math.ceil(el - 60))) };
    return { phase: "ft", minute: 90 };
  }

  function liveState(m) {
    if (!m || !m.date) return null;
    var k = kickoff(m);
    if (isNaN(k.getTime())) return null;
    var st = liveClock(k.getTime());
    st.kickoff = k.getTime();
    return st;
  }

  function isLivePhase(p) { return p === "first" || p === "ht" || p === "second"; }

  /* While a match is being played, quietly refetch matches.json every 30s so
     goals added in the dashboard appear without anyone refreshing the page. */
  function startLivePolling() {
    var timer = null;
    function anyLive() {
      return ((db && db.matches) || []).some(function (m) {
        var st = m.status === "scheduled" ? liveState(m) : null;
        return st && isLivePhase(st.phase);
      });
    }
    function check() {
      if (anyLive() && !timer) {
        timer = setInterval(function () {
          fetch("data/matches.json", { cache: "no-cache" })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (j) {
              if (!j) return;
              if (JSON.stringify(j) !== JSON.stringify(db.matches)) {
                db.matches = j;
                document.dispatchEvent(new CustomEvent("club:matches-updated"));
              }
            })
            .catch(function () {});
        }, 30000);
      } else if (!anyLive() && timer) {
        clearInterval(timer);
        timer = null;
      }
    }
    onReady.push(check);
    setInterval(check, 60000);
  }

  function upcoming() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return pub(db.matches)
      .filter(function (m) {
        return m.status === "scheduled" && m.date && kickoff(m) >= today;
      })
      .sort(function (a, b) { return kickoff(a) - kickoff(b); });
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
    squad: squad, squadByPosition: squadByPosition, playerById: playerById, goalLog: goalLog,
    POS_LABEL: POS_LABEL, POS_ORDER: POS_ORDER,
    upcoming: upcoming, nextMatch: nextMatch, finished: finished, latestResult: latestResult,
    headToHead: headToHead, initials: initials,
    ytThumb: ytThumb, ytFacade: ytFacade, activateFacades: activateFacades,
    parseTime: parseTime, kickoff: kickoff, mediaItem: mediaItem,
    liveClock: liveClock, liveState: liveState,
    waLink: waLink,
    onReady: function (cb) {
      onReady.push(cb);
      if (ready()) cb();
    }
  };
})();
