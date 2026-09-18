/* Match Centre — next match, fixtures, results, history + automatic head-to-head */
(function () {
  "use strict";
  var C = window.CLUB;

  function resultClass(m) {
    if (m.scoreCastmog == null || m.scoreOpponent == null) return "";
    return m.scoreCastmog > m.scoreOpponent ? "win" : m.scoreCastmog === m.scoreOpponent ? "draw" : "loss";
  }

  function matchRow(m, link) {
    var d = C.shortDate(m.date);
    var score = m.status === "finished" && m.scoreCastmog != null
      ? '<span class="mr-score ' + resultClass(m) + '">' + m.scoreCastmog + "&ndash;" + m.scoreOpponent + "</span>"
      : '<span class="chip chip-yellow">' + C.esc(m.homeAway || "HOME") + "</span>";
    return '<div class="match-row">' +
      '<div class="mr-date"><span class="d">' + C.esc(d.d) + '</span><span class="m">' + C.esc(d.m) + "</span></div>" +
      '<div class="mr-main"><div class="mr-teams">' + (C.isAway(m)
          ? C.esc(m.opponent).toUpperCase() + " &nbsp;vs&nbsp; CASTMOG LADIES"
          : "CASTMOG LADIES &nbsp;vs&nbsp; " + C.esc(m.opponent).toUpperCase()) + "</div>" +
      '<div class="mr-meta"><span>' + C.esc(m.competition || "") + "</span>" +
      (m.time ? "<span>" + C.esc(m.time) + "</span>" : "") +
      (m.venue ? "<span>" + C.esc(m.venue) + "</span>" : "") +
      (m.status === "postponed" ? '<span class="chip">POSTPONED</span>' : "") +
      "</div></div>" + score +
      (link ? '<a class="btn btn-outline btn-sm" href="#match-' + C.esc(m.id) + '">DETAILS</a>' : "") +
      "</div>";
  }

  /* highlight video embed (admin adds it on the match record) */
  function rowHighlight(m) {
    if (!m.highlight) return "";
    return '<div class="row-hl">' +
      '<span class="motto" style="color:var(--yellow);">MATCH HIGHLIGHT</span>' +
      (C.mediaItem ? C.mediaItem(m.highlight, "Match highlight") : C.ytFacade(C.ytId ? C.ytId(m.highlight) : m.highlight, "Match highlight")) +
      "</div>";
  }

  function h2hBlock(opponent) {
    var h = C.headToHead(opponent);
    if (!h) return "";
    if (h.total === 0) {
      return '<div class="panel" style="margin-top:1.4rem;"><span class="motto" style="color:var(--green);">HEAD-TO-HEAD</span>' +
        '<p style="margin-top:0.5rem;color:var(--muted);">FIRST RECORDED MEETING &mdash; Castmog Ladies have never played ' +
        C.esc(opponent) + " in recorded match history.</p></div>";
    }
    var rows = h.meetings.map(function (m) {
      var res = m.scoreCastmog > m.scoreOpponent ? '<span style="color:var(--green);font-weight:800;">W</span>'
        : m.scoreCastmog === m.scoreOpponent ? '<span style="color:var(--yellow);font-weight:800;">D</span>'
        : '<span style="color:var(--red);font-weight:800;">L</span>';
      return "<tr><td>" + C.fmtDate(m.date) + "</td><td>" + C.esc(m.competition || "") + "</td><td>" +
        m.scoreCastmog + " &ndash; " + m.scoreOpponent + "</td><td>" + res + "</td></tr>";
    }).join("");
    return '<div class="panel" style="margin-top:1.4rem;"><span class="motto" style="color:var(--green);">HEAD-TO-HEAD &mdash; PREVIOUS MEETINGS</span>' +
      '<div class="h2h-grid" style="margin-top:1rem;">' +
      '<div class="h2h-stat"><b>' + h.total + "</b><span>Meetings</span></div>" +
      '<div class="h2h-stat"><b>' + h.wins + "</b><span>Castmog wins</span></div>" +
      '<div class="h2h-stat"><b>' + h.draws + "</b><span>Draws</span></div>" +
      '<div class="h2h-stat"><b>' + h.losses + "</b><span>Opponent wins</span></div>" +
      '<div class="h2h-stat"><b>' + h.gf + "</b><span>Goals scored</span></div>" +
      '<div class="h2h-stat"><b>' + h.ga + "</b><span>Goals conceded</span></div>" +
      "</div><div class='table-scroll'><table class='schedule-table' style='margin-top:0.4rem;'><thead><tr><th>DATE</th><th>COMPETITION</th><th>SCORE</th><th>RESULT</th></tr></thead><tbody>" +
      rows + "</tbody></table></div></div>";
  }

  function matchDetail(m) {
    var html = '<div class="panel">' +
      '<div class="section-head" style="margin-bottom:1rem;"><h2 class="section-title" style="font-size:1.6rem;">' + (C.isAway(m)
        ? C.esc(m.opponent).toUpperCase() + " vs CASTMOG LADIES"
        : "CASTMOG LADIES vs " + C.esc(m.opponent).toUpperCase()) + "</h2>" +
      '<a class="btn btn-outline btn-sm" href="#matches">&larr; ALL MATCHES</a></div>' +
      (window.CLUB_MATCHCARD ? window.CLUB_MATCHCARD(m, { countdown: m.status === "scheduled" }) : "") +
      "<div class='mc-meta' style='justify-content:flex-start;margin-top:1rem;'>" +
      "<span>" + C.fmtDate(m.date) + "</span>" + (m.time ? "<span>" + C.esc(m.time) + "</span>" : "") +
      (m.venue ? "<span>" + C.esc(m.venue) + "</span>" : "") + "</div>";

    if (m.highlight) html += '<div style="margin-top:1.2rem;"><h3 style="font-family:var(--font-head);text-transform:uppercase;margin-bottom:0.6rem;">MATCH HIGHLIGHT</h3>' +
      (C.mediaItem ? C.mediaItem(m.highlight, "Match highlight") : "") + "</div>";

    if (m.scorers && m.scorers.length) {
      html += '<div style="margin-top:1.1rem;"><h3 style="font-family:var(--font-head);text-transform:uppercase;margin-bottom:0.7rem;">GOALS</h3><div class="lineup-grid">' +
        m.scorers.map(function (s) {
          var nm = typeof s === "string" ? s : (s.name || "");
          var min = (s && s.minute) || "";
          return '<div class="lineup-chip"><span class="lc-num">' + (min ? C.esc(min) + "&prime;" : "G") + '</span><span class="lc-name">' + C.esc(nm) + "</span></div>";
        }).join("") + "</div></div>";
    }

    if (m.report) html += '<div style="margin-top:1.4rem;"><h3 style="font-family:var(--font-head);text-transform:uppercase;margin-bottom:0.5rem;">MATCH REPORT</h3><p style="color:rgba(244,247,241,0.88);">' + C.esc(m.report).replace(/\n/g, "<br>") + "</p></div>";
    if (m.lineup && m.lineup.length) html += '<div style="margin-top:1.2rem;"><h3 style="font-family:var(--font-head);text-transform:uppercase;margin-bottom:0.7rem;">STARTING XI</h3><div class="lineup-grid">' +
      m.lineup.map(function (n, i) {
        return '<div class="lineup-chip"><span class="lc-num">' + (i + 1) + '</span><span class="lc-name">' + C.esc(n) + "</span></div>";
      }).join("") + "</div></div>";
    if (m.subs && m.subs.length) html += '<div style="margin-top:1rem;"><h3 style="font-family:var(--font-head);text-transform:uppercase;margin-bottom:0.7rem;">SUBSTITUTES</h3><div class="lineup-grid">' +
      m.subs.map(function (n) {
        return '<div class="lineup-chip"><span class="lc-num lc-bench">B</span><span class="lc-name">' + C.esc(n) + "</span></div>";
      }).join("") + "</div></div>";
    if (m.events && m.events.length) html += '<div style="margin-top:0.9rem;"><h3 style="font-family:var(--font-head);text-transform:uppercase;margin-bottom:0.4rem;">MATCH EVENTS</h3><ul style="color:var(--muted);font-size:0.92rem;padding-left:1.2rem;">' + m.events.map(function (e) { return "<li>" + C.esc(e) + "</li>"; }).join("") + "</ul></div>";
    if (m.photos && m.photos.length) html += '<div style="margin-top:0.9rem;"><div class="media-grid" style="margin-top:0.8rem;">' + m.photos.map(function (u) {
      return '<div class="media-item"><img src="' + C.esc(u) + '" alt="Match photo" loading="lazy"></div>';
    }).join("") + "</div></div>";
    if (m.videos && m.videos.length) html += '<div style="margin-top:0.9rem;"><div class="yt-grid" style="margin-top:0.8rem;">' + m.videos.map(function (v) { return C.mediaItem ? C.mediaItem(v, "Highlights") : C.ytFacade(v, "Highlights"); }).join("") + "</div></div>";

    html += h2hBlock(m.opponent) + "</div>";
    return html;
  }

  window.CLUB.onReady(function () {
    var root = document.getElementById("matches-mount");
    if (!root) return;

    document.addEventListener("club:matches-updated", function () { render(); });
    document.addEventListener("club:kickoff-reached", function () { render(); });

    function render() {
      var hash = window.location.hash.replace("#match-", "");
      var all = C.pub(C.get("matches"));
      var m = hash && all.filter(function (x) { return x.id === hash; })[0];

      if (m) {
        root.innerHTML = matchDetail(m);
        C.activateFacades(root);
        if (window.CLUB_STARTCLOCKS) window.CLUB_STARTCLOCKS();
        if (window.CLUB_MATCHCARD) { var cd = root.querySelector(".countdown[data-kickoff]"); }
        document.getElementById("matches-anchor").scrollIntoView({ behavior: "instant" });
        return;
      }

      var nm = C.nextMatch();
      var up = C.upcoming();
      var done = C.finished();
      var upIds = {};
      up.forEach(function (x) { upIds[x.id] = true; });
      var history = all.filter(function (x) { return !upIds[x.id]; });

      var nmSt = nm && nm.status === "scheduled" ? C.liveState(nm) : null;
      var nmLive = nmSt && (nmSt.phase === "first" || nmSt.phase === "ht" || nmSt.phase === "second");
      var html = nm
        ? '<h2 class="section-title' + (nmLive ? " live-title" : "") + '" style="font-size:1.6rem;">' +
          (nmLive ? "LIVE NOW" : "NEXT MATCH") + '</h2><div style="margin-bottom:2.4rem;">' +
          (window.CLUB_MATCHCARD ? window.CLUB_MATCHCARD(nm, { countdown: true }) : "") + "</div>"
        : '<div class="empty-state" style="margin-bottom:2.4rem;"><span class="es-title">NO UPCOMING FIXTURE</span>' +
          "Fixture details will appear here automatically once one is added by the club.</div>";

      html += '<h2 class="section-title" style="font-size:1.6rem;">FIXTURES</h2><div class="record-list" style="margin-bottom:2.4rem;">' +
        (up.length
          ? up.map(function (x) { return matchRow(x, true); }).join("")
          : '<div class="empty-state">No fixtures announced yet.</div>') + "</div>";

      html += '<h2 class="section-title" style="font-size:1.6rem;">RESULTS</h2><div class="record-list" style="margin-bottom:2.4rem;">' +
        (done.length
          ? done.map(function (x) { return matchRow(x, true) + rowHighlight(x); }).join("")
          : '<div class="empty-state">No results recorded yet.</div>') + "</div>";

      html += '<h2 class="section-title" style="font-size:1.6rem;">MATCH HISTORY</h2>' +
        (history.length
          ? '<div class="table-scroll"><table class="schedule-table"><thead><tr><th>DATE</th><th>OPPONENT</th><th>COMPETITION</th><th>RESULT</th><th>HIGHLIGHT</th></tr></thead><tbody>' +
            history.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).map(function (x) {
              var r = x.status !== "finished" || x.scoreCastmog == null ? "&mdash;" : x.scoreCastmog + " &ndash; " + x.scoreOpponent;
              return "<tr><td>" + C.fmtDate(x.date) + "</td><td>" + C.esc(x.opponent) + "</td><td>" + C.esc(x.competition || "") + "</td><td>" + r + "</td><td>" +
                (x.highlight ? '<a class="hl-link" href="#match-' + C.esc(x.id) + '">&#9654; WATCH</a>' : "&mdash;") + "</td></tr>";
            }).join("") + "</tbody></table></div>"
          : '<div class="empty-state">Match history will be recorded here.</div>');

      root.innerHTML = html;
      C.activateFacades(root);
      if (window.CLUB_STARTCLOCKS) window.CLUB_STARTCLOCKS();
    }

    window.addEventListener("hashchange", render);
    render();
  });
})();
