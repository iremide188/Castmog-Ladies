/* =====================================================
   CASTMOG LADIES — data layer
   Loads the JSON "database" (data/*.json) and exposes
   helpers shared by every page: squad grouping, next
   match, latest result, head-to-head, formatting.
   ===================================================== */

window.CLUB = (function () {
  "use strict";

  var FILES = ["settings", "club", "players", "staff", "matches", "news", "achievements", "media", "training", "youtube", "tiktok"];
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

  /* --- Coach social icon row (shared) ------------------------------------ */
  var SOC_ICONS = {
    instagram: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M18.9 1.2h3.7l-8.1 9.2 9.5 12.4h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L0 1.2h7.6l5.2 6.9 6.1-6.9Zm-1.3 19.6h2L6.5 3.2H4.3l13.3 17.6Z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-1.8-2.5V9.8a6 6 0 1 0 5.2 5.9V8.7a7.3 7.3 0 0 0 4.2 1.4V7a4.3 4.3 0 0 1-3.4-1.2Z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M13.5 21v-7h2.6l.4-3h-3V9.1c0-.9.3-1.5 1.6-1.5h1.5V5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8V11H8v3h2.7v7h2.8Z"/></svg>'
  };
  var SOC_BASES = { instagram: "https://instagram.com/", x: "https://x.com/", tiktok: "https://tiktok.com/@", facebook: "https://facebook.com/" };
  function socialHref(net, v) {
    var t = String(v == null ? "" : v).trim();
    if (!t) return "";
    if (t.charAt(0) === "@") return SOC_BASES[net] + t.slice(1);
    if (/^https?:\/\//i.test(t)) return t;
    return "https://" + t.replace(/^\/+/, "");
  }
  /* small icon-only row for staff cards (club/home/squad) */
  function socialIconRow(m) {
    var soc = (m && m.social) || {};
    var nets = [["instagram", "Instagram"], ["x", "X / Twitter"], ["tiktok", "TikTok"], ["facebook", "Facebook"]];
    var html = nets.map(function (n) {
      var href = socialHref(n[0], soc[n[0]] || (n[0] === "instagram" ? (m.socialUrl || "") : ""));
      if (!href) return "";
      return '<a class="sc-soc" href="' + esc(href) + '" target="_blank" rel="noopener" title="' + n[1] + '" aria-label="' + n[1] + '">' + SOC_ICONS[n[0]] + "</a>";
    }).join("");
    return html ? '<div class="sc-soc-row">' + html + "</div>" : "";
  }

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

  /* accept a full YouTube link or a bare video ID */
  function ytId(v) {
    v = String(v || "").trim();
    var m = v.match(/(?:youtube\.com\/(?:watch\?[^#]*v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,15})/);
    if (m) return m[1];
    return /^[A-Za-z0-9_-]{8,15}$/.test(v) ? v : "";
  }

  function mediaItem(v, label) {
    if (isFileVideo(v)) return '<div class="video-file"><video controls preload="metadata" src="' + esc(v) + '"></video><div class="vf-cap">' + esc(label) + "</div></div>";
    return ytFacade(ytId(v) || v, label);
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

  /* ---------- CLUB WIRE: everything the club posts on its accounts
     (TikTok auto-sync + YouTube auto-feed), newest first ---------- */
  function wire() {
    var items = [];
    var tt = db.tiktok || {};
    (tt.videos || []).forEach(function (v) {
      if (!v.url) return;
      items.push({
        src: "tiktok", url: v.url,
        title: v.desc || "New post on TikTok",
        img: v.cover || "", ts: (v.ts || 0) * 1000,
        plays: v.plays || 0
      });
    });
    var yt = db.youtube || {};
    (yt.videos || []).forEach(function (v) {
      if (!v.youtubeId) return;
      var t = v.date ? new Date(String(v.date).slice(0, 10) + "T12:00:00Z").getTime() : 0;
      items.push({
        src: "youtube", url: "https://www.youtube.com/watch?v=" + v.youtubeId,
        title: v.title || "New video on YouTube",
        img: ytThumb(v.youtubeId), ts: t
      });
    });
    items.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    return items;
  }

  function timeAgo(ts) {
    if (!ts) return "";
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return "just now";
    var m = Math.floor(s / 60); if (m < 60) return m + "m ago";
    var h = Math.floor(m / 60); if (h < 24) return h + "h ago";
    var d = Math.floor(h / 24); if (d < 7) return d + "d ago";
    if (d < 30) return Math.floor(d / 7) + "w ago";
    var dt = new Date(ts);
    return dt.getDate() + " " + MONTHS[dt.getMonth()] + " " + dt.getFullYear();
  }

  function waLink(text) {
    var s = db.settings || {};
    var base = s.whatsappLink || "https://wa.me/2349130527339";
    return base + "?text=" + encodeURIComponent(text);
  }

  /* true when the fixture is an AWAY match (opponent hosts) */
  function isAway(m) {
    var v = String((m && m.homeAway) || "").trim().toLowerCase();
    return v === "away" || v === "a" || v === "@";
  }

  return {
    isAway: isAway,
    get: get, ready: ready, pub: pub, esc: esc,
    socialIconRow: socialIconRow,
    fmtDate: fmtDate, shortDate: shortDate,
    squad: squad, squadByPosition: squadByPosition, playerById: playerById, goalLog: goalLog,
    POS_LABEL: POS_LABEL, POS_ORDER: POS_ORDER,
    upcoming: upcoming, nextMatch: nextMatch, finished: finished, latestResult: latestResult,
    headToHead: headToHead, initials: initials,
    ytThumb: ytThumb, ytFacade: ytFacade, activateFacades: activateFacades,
    parseTime: parseTime, kickoff: kickoff, mediaItem: mediaItem,
    liveClock: liveClock, liveState: liveState,
    waLink: waLink, wire: wire, timeAgo: timeAgo,
    onReady: function (cb) {
      onReady.push(cb);
      if (ready()) cb();
    }
  };
})();
