/* Homepage dynamic sections — everything renders from data/*.json */
(function () {
  "use strict";
  var C = window.CLUB;

  function heroSlideshow() {
    var mount = document.getElementById("hero-slideshow");
    if (!mount) return;
    var photos = C.pub(C.get("media")).filter(function (m) { return m.type === "photo" && m.url; });
    if (!photos.length) return;
    photos.slice(0, 5).forEach(function (p, i) {
      var s = document.createElement("div");
      s.className = "hero-slide" + (i === 0 ? " is-active" : "");
      s.style.backgroundImage = "url('" + p.url + "')";
      mount.appendChild(s);
    });
    var slides = mount.querySelectorAll(".hero-slide");
    if (slides.length < 2) return;
    var cur = 0;
    setInterval(function () {
      var next = (cur + 1) % slides.length;
      slides[cur].classList.remove("is-active");
      slides[next].classList.add("is-active");
      cur = next;
    }, 5000);
  }

  function matchCard(m, opts) {
    opts = opts || {};
    var ls2 = C.liveState ? C.liveState(m) : null;
    var isLive = m.status === "scheduled" && ls2 && (ls2.phase === "first" || ls2.phase === "ht" || ls2.phase === "second");
    var isFTPhase = m.status === "scheduled" && ls2 && ls2.phase === "ft";
    var finished = m.status === "finished";
    var hasFinal = finished && m.scoreCastmog != null && m.scoreOpponent != null;

    var ourScore = null, oppScore = null;
    if (hasFinal) { ourScore = m.scoreCastmog; oppScore = m.scoreOpponent; }
    else if (isLive || isFTPhase) {
      /* live score stays visible after full time until the final result is entered */
      ourScore = m.liveScoreCastmog == null ? 0 : m.liveScoreCastmog;
      oppScore = m.liveScoreOpponent == null ? 0 : m.liveScoreOpponent;
    }

    var cls = hasFinal
      ? (m.scoreCastmog > m.scoreOpponent ? "win" : m.scoreCastmog === m.scoreOpponent ? "draw" : "loss")
      : "";

    var goals = (m.scorers || []).map(function (s) { return typeof s === "string" ? { name: s, minute: "" } : (s || {}); })
      .filter(function (s) { return s.name; })
      .filter(function (s) { return !s.minute || !isLive || Number(s.minute) <= ls2.minute; })
      .sort(function (a, b) { return (Number(a.minute) || 0) - (Number(b.minute) || 0); });

    var statusHtml = "";
    if (isLive) {
      statusHtml = '<div class="mc-live" data-phase="' + ls2.phase + '">' +
        '<span class="lv-badge">LIVE</span>' +
        '<span class="lv-clock" data-kickoff="' + C.kickoff(m).toISOString() + '">' +
        (ls2.phase === "ht" ? "45&prime;" : ls2.minute + "&prime;") + "</span></div>";
    } else if (isFTPhase) {
      statusHtml = '<div class="mc-live" data-phase="ft"><span class="lv-badge ft">FULL TIME</span></div>';
    } else if (opts.countdown) {
      statusHtml = '<div class="countdown" data-kickoff="' + C.kickoff(m).toISOString() + '">' +
        '<div class="cd-cell"><span class="cd-num">&ndash;</span><span class="cd-lab">Days</span></div>' +
        '<div class="cd-cell"><span class="cd-num">&ndash;</span><span class="cd-lab">Hrs</span></div>' +
        '<div class="cd-cell"><span class="cd-num">&ndash;</span><span class="cd-lab">Min</span></div>' +
        '<div class="cd-cell"><span class="cd-num">&ndash;</span><span class="cd-lab">Sec</span></div>' +
        "</div>";
    }

    var scorerHtml = (ourScore != null && goals.length)
      ? '<div class="lv-goals mc-scorers">' + goals.map(function (s) {
          return '<span class="lv-goal" data-min="' + C.esc(s.minute || "") + '">(' +
            (s.minute ? C.esc(s.minute) + "&prime; " : "") + C.esc(s.name) + ")</span>";
        }).join("") + "</div>"
      : "";

    return (
      '<div class="match-card">' +
      '<span class="mc-comp">' + C.esc(m.competition || "FIXTURE") + " &middot; " + C.esc(m.homeAway || "HOME") + "</span>" +
      '<div class="mc-teams">' +
      '<div class="mc-team"><img src="images/crest.png" alt="Castmog Ladies crest" class="mc-crest"><div class="mc-name">CASTMOG LADIES</div>' +
      '<div class="mc-num' + (cls ? " " + cls : "") + '">' + (ourScore == null ? "&ndash;" : ourScore) + "</div>" +
      scorerHtml +
      "</div>" +
      '<div class="mc-vs">' + (finished ? "FT" : "VS") + "</div>" +
      '<div class="mc-team">' + (m.opponentLogo
          ? '<img src="' + C.esc(m.opponentLogo) + '" alt="' + C.esc(m.opponent) + ' crest" class="mc-crest">'
          : '<div class="mc-crest">' + C.initials(m.opponent) + "</div>") + '<div class="mc-name">' + C.esc(m.opponent) + "</div>" +
      '<div class="mc-num' + (cls ? " " + cls : "") + '">' + (oppScore == null ? "&ndash;" : oppScore) + "</div></div>" +
      "</div>" + statusHtml +
      '<div class="mc-meta">' +
      "<span>" + C.fmtDate(m.date) + "</span>" +
      (m.time ? "<span>" + C.esc(m.time) + "</span>" : "") +
      (m.venue ? "<span>" + C.esc(m.venue) + "</span>" : "") +
      "</div></div>"
    );
  }

  window.CLUB_MATCHCARD = matchCard;

  var clockStarted = false;

  /* Idempotent: safe to call again after every re-render. Queries fresh DOM
     each tick so replaced cards keep ticking, and fires club:kickoff-reached
     the moment a countdown hits zero so the card flips to LIVE without a refresh. */
  function startCountdowns() {
    function tick() {
      document.querySelectorAll(".countdown[data-kickoff]").forEach(function (cd) {
        var t = new Date(cd.getAttribute("data-kickoff")).getTime() - Date.now();
        if (isNaN(t)) return;
        if (t < 0) t = 0;
        var d = Math.floor(t / 86400000);
        var h = Math.floor((t % 86400000) / 3600000);
        var mnt = Math.floor((t % 3600000) / 60000);
        var s = Math.floor((t % 60000) / 1000);
        var nums = cd.querySelectorAll(".cd-num");
        if (nums.length === 4) {
          nums[0].textContent = d; nums[1].textContent = h;
          nums[2].textContent = mnt; nums[3].textContent = s;
        }
        if (t === 0 && !cd.getAttribute("data-fired")) {
          cd.setAttribute("data-fired", "1");
          document.dispatchEvent(new CustomEvent("club:kickoff-reached"));
        }
      });
    }
    function liveTick() {
      document.querySelectorAll(".lv-clock[data-kickoff]").forEach(function (elc) {
        var st = C.liveClock(new Date(elc.getAttribute("data-kickoff")).getTime());
        var box = elc.closest(".mc-live");
        var badge = box ? box.querySelector(".lv-badge") : null;
        if (st.phase === "ht") {
          elc.innerHTML = "45&prime;";
          if (box) box.setAttribute("data-phase", "ht");
          if (badge) { badge.textContent = "HALF TIME"; badge.classList.add("ht"); }
        } else if (st.phase === "ft") {
          elc.textContent = "FULL TIME";
          if (box) box.setAttribute("data-phase", "ft");
          if (badge) { badge.textContent = "FULL TIME"; badge.classList.remove("ht"); }
        } else {
          elc.innerHTML = st.minute + "&prime;";
          if (badge && badge.textContent !== "LIVE") { badge.textContent = "LIVE"; badge.classList.remove("ht"); }
        }
        var card = (box ? box.closest(".match-card") : null) || box;
        if (card) card.querySelectorAll(".lv-goal").forEach(function (g) {
          var gm = Number(g.getAttribute("data-min"));
          g.style.display = (gm && st.minute && gm > st.minute) ? "none" : "";
        });
      });
    }
    if (!clockStarted) {
      clockStarted = true;
      setInterval(function () { tick(); liveTick(); }, 1000);
    }
    tick();
    liveTick();
  }

  /* Match Centre pages load home.js too — let them run the clocks. */
  window.CLUB_STARTCLOCKS = startCountdowns;

  function render() {
    var S = C.get("settings") || {};

    // NEXT MATCH
    var nm = C.nextMatch();
    var nmEl = document.getElementById("home-next-match");
    if (nmEl) {
      nmEl.innerHTML = nm
        ? matchCard(nm, { countdown: true })
        : '<div class="empty-state"><span class="es-title">NO UPCOMING FIXTURE</span>No fixtures announced yet. Match details will appear here automatically once a fixture is added.</div>';
    }

    // LATEST RESULT
    var lr = C.latestResult();
    var lrEl = document.getElementById("home-latest-result");
    if (lrEl) {
      lrEl.innerHTML = lr
        ? matchCard(lr)
        : '<div class="empty-state"><span class="es-title">NO RESULTS YET</span>Results will appear here once matches are played.</div>';
    }

    // LATEST NEWS
    var news = C.pub(C.get("news")).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var nwEl = document.getElementById("home-news");
    if (nwEl) {
      nwEl.innerHTML = news.length
        ? news.slice(0, 3).map(function (n) {
            return '<article class="card news-card">' +
              (n.image ? '<img class="nc-img" src="' + C.esc(n.image) + '" alt="' + C.esc(n.title) + '" loading="lazy">' : "") +
              '<div class="nc-body"><div class="nc-meta"><span class="chip chip-yellow">' + C.esc(n.category || "CLUB") + "</span>" +
              (n.date ? '<span class="chip">' + C.fmtDate(n.date) + "</span>" : "") + "</div>" +
              "<h3>" + C.esc(n.title) + "</h3><p>" + C.esc((n.body || "").slice(0, 140)) + (n.body && n.body.length > 140 ? "&hellip;" : "") + "</p>" +
              '<a class="nc-more" href="news.html?id=' + encodeURIComponent(n.id) + '">Read more</a></div></article>';
          }).join("")
        : '<div class="empty-state"><span class="es-title">NEWSROOM COMING SOON</span>Club announcements and match reports will appear here.</div>';
    }

    // SQUAD PREVIEW
    var sqEl = document.getElementById("home-squad");
    if (sqEl) {
      var players = C.squad().slice(0, 6);
      sqEl.innerHTML = players.map(function (p) {
        var img = p.photo
          ? '<img class="pc-photo" src="' + C.esc(p.photo) + '" alt="' + C.esc(p.name) + '" loading="lazy">'
          : '<div class="pc-avatar">' + C.initials(p.name) + "</div>";
        return '<a class="player-card" href="player.html?id=' + encodeURIComponent(p.id) + '">' +
          '<span class="pc-number">' + C.esc(p.number) + "</span>" + img +
          '<div class="pc-name">' + C.esc(p.name) + "</div>" +
          '<div class="pc-pos">' + C.esc(p.positionLabel || "") + "</div></a>";
      }).join("");
    }

    // TRAINING
    var trEl = document.getElementById("home-training");
    if (trEl) {
      var tr = C.get("training") || {};
      var trOff = String(tr.status || "").toLowerCase() === "off";
      trEl.innerHTML =
        '<div class="panel' + (trOff ? " training-off" : "") + '"><span class="motto">TRAINING SCHEDULE</span>' +
        (trOff
          ? '<div class="off-badge">TRAINING OFF</div>' +
            (tr.offNotice ? '<p class="off-notice">' + C.esc(tr.offNotice) + "</p>" : "")
          : "") +
        "<h3 style='font-family:var(--font-head);font-size:1.9rem;text-transform:uppercase;margin:0.6rem 0;'>" + C.esc(tr.days || "") + "</h3>" +
        '<p style="color:var(--yellow);font-weight:800;letter-spacing:0.1em;">' + C.esc(tr.time || "") + "</p>" +
        (tr.location ? '<p style="color:var(--muted);">' + C.esc(tr.location) + "</p>" : "") +
        (tr.notes ? '<p style="color:var(--muted);font-size:0.88rem;">' + C.esc(tr.notes) + "</p>" : "") +
        "</div>";
    }

    // COACHING STAFF
    var stEl = document.getElementById("home-staff");
    if (stEl) {
      stEl.innerHTML = C.pub(C.get("staff")).map(function (m) {
      var img = m.photo
        ? '<img class="sc-photo" src="' + C.esc(m.photo) + '" alt="' + C.esc(m.name) + '" loading="lazy">'
        : '<div class="sc-avatar">' + C.initials(m.name) + "</div>";
      return '<div class="card staff-card">' +
        '<a class="sc-link" href="coach.html?id=' + encodeURIComponent(m.id) + '" aria-label="View ' + C.esc(m.name) + ' profile"></a>' + img +
        '<p class="sc-name">' + C.esc(m.name) + "</p>" +
        '<span class="sc-role">' + C.esc(m.role) + "</span>" +
        (m.bio ? '<p style="font-size:0.9rem;">' + C.esc(m.bio.slice(0, 200)) + "&hellip;</p>" : "") +
        '<span class="sc-more">VIEW PROFILE &rarr;</span></div>';
      }).join("");
    }

    // LATEST VIDEOS / YOUTUBE (re-renders when channel videos auto-arrive)
    var ytEl = document.getElementById("home-videos");
    if (ytEl) {
      function renderVideos() {
        var yt = C.get("youtube") || {};
        var vids = (yt.videos || []).filter(function (v) { return v.youtubeId; }).slice(0, 3);
        if (yt.live && yt.liveVideoId) {
          ytEl.innerHTML = '<div class="live-embed"><iframe src="https://www.youtube-nocookie.com/embed/' + C.esc(yt.liveVideoId) + '?rel=0" title="Live stream" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div>';
        } else if (vids.length) {
          ytEl.innerHTML = vids.map(function (v) {
            return C.ytFacade(v.youtubeId, v.title) + (v.title ? '<div class="yt-title">' + C.esc(v.title) + "</div>" : "");
          }).join("");
        } else {
          ytEl.innerHTML = '<div class="empty-state"><span class="es-title">NO FIXTURE, NO WORRY &mdash; VIDEOS COMING SOON</span>' +
            'Club videos from the official YouTube channel will appear here.<br>' +
            '<a class="btn btn-outline btn-sm" style="margin-top:1rem;" href="' + C.esc(yt.channel || S.social.youtube || "#") + '" target="_blank" rel="noopener">VISIT OUR YOUTUBE CHANNEL</a></div>';
        }
        C.activateFacades(ytEl);
      }
      renderVideos();
      document.addEventListener("club:videos-updated", renderVideos);
    }

    // YOUTUBE LIVE strip
    var lvEl = document.getElementById("home-live");
    if (lvEl) {
      var y2 = C.get("youtube") || {};
      lvEl.innerHTML = y2.live && y2.liveVideoId
        ? '<span class="live-badge"><span class="live-dot"></span>LIVE NOW</span>'
        : '<span class="chip">NOT CURRENTLY LIVE</span>';
    }

    // ACHIEVEMENTS
    var acEl = document.getElementById("home-achievements");
    if (acEl) {
      var ach = C.pub(C.get("achievements"));
      acEl.innerHTML = ach.length
        ? ach.slice(0, 3).map(function (a) {
            return '<div class="card honour-card">' +
              (a.image ? '<img src="' + C.esc(a.image) + '" alt="' + C.esc(a.trophy) + '" style="width:70px;margin:0 auto 0.6rem;border-radius:10px;" loading="lazy">' : '<div class="hc-icon">&#127942;</div>') +
              '<span class="hc-year">' + C.esc(a.year) + "</span>" +
              "<h3>" + C.esc(a.trophy) + "</h3><p>" + C.esc(a.description || "") + "</p></div>";
          }).join("")
        : '<div class="empty-state"><span class="es-title">HONOURS BOARD COMING SOON</span>The club\'s honours will be listed here.</div>';
    }

    startCountdowns();
  }

  window.CLUB.onReady(function () {
    heroSlideshow();
    render();
    document.addEventListener("club:matches-updated", function () {
      var m = document.getElementById("home-next-match");
      if (m) render();
    });
    document.addEventListener("club:kickoff-reached", function () { render(); });
  });
})();
