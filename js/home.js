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
    var scoreHtml = "";
    if (m.status === "finished" && m.scoreCastmog != null && m.scoreOpponent != null) {
      var cls = m.scoreCastmog > m.scoreOpponent ? "win" : m.scoreCastmog === m.scoreOpponent ? "draw" : "loss";
      scoreHtml = '<div class="mc-score"><span class="mr-score ' + cls + '">' + m.scoreCastmog + " – " + m.scoreOpponent + "</span></div>";
    } else if (opts.countdown) {
      scoreHtml = '<div class="countdown" data-kickoff="' + C.kickoff(m).toISOString() + '">' +
        '<div class="cd-cell"><span class="cd-num">–</span><span class="cd-lab">Days</span></div>' +
        '<div class="cd-cell"><span class="cd-num">–</span><span class="cd-lab">Hrs</span></div>' +
        '<div class="cd-cell"><span class="cd-num">–</span><span class="cd-lab">Min</span></div>' +
        '<div class="cd-cell"><span class="cd-num">–</span><span class="cd-lab">Sec</span></div>' +
        "</div>";
    }
    return (
      '<div class="match-card">' +
      '<span class="mc-comp">' + C.esc(m.competition || "FIXTURE") + " &middot; " + C.esc(m.homeAway || "HOME") + "</span>" +
      '<div class="mc-teams">' +
      '<div class="mc-team"><img src="images/crest.png" alt="Castmog Ladies crest" class="mc-crest"><div class="mc-name">CASTMOG LADIES</div></div>' +
      '<div class="mc-vs">' + (m.status === "finished" ? "FT" : "VS") + "</div>" +
      '<div class="mc-team">' + (m.opponentLogo
          ? '<img src="' + C.esc(m.opponentLogo) + '" alt="' + C.esc(m.opponent) + ' crest" class="mc-crest">'
          : '<div class="mc-crest">' + C.initials(m.opponent) + "</div>") + '<div class="mc-name">' + C.esc(m.opponent) + "</div></div>" +
      "</div>" + scoreHtml +
      '<div class="mc-meta">' +
      "<span>" + C.fmtDate(m.date) + "</span>" +
      (m.time ? "<span>" + C.esc(m.time) + "</span>" : "") +
      (m.venue ? "<span>" + C.esc(m.venue) + "</span>" : "") +
      "</div></div>"
    );
  }

  window.CLUB_MATCHCARD = matchCard;

  function startCountdowns() {
    var cds = document.querySelectorAll(".countdown[data-kickoff]");
    if (!cds.length) return;
    function tick() {
      cds.forEach(function (cd) {
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
      });
    }
    tick();
    setInterval(tick, 1000);
  }

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
      var latest = tr.latest && tr.latest.published !== false ? tr.latest : null;
      trEl.innerHTML =
        '<div class="grid grid-2">' +
        '<div class="panel"><span class="motto">TRAINING SCHEDULE</span>' +
        "<h3 style='font-family:var(--font-head);font-size:1.9rem;text-transform:uppercase;margin:0.6rem 0;'>" + C.esc(tr.days || "") + "</h3>" +
        '<p style="color:var(--yellow);font-weight:800;letter-spacing:0.1em;">' + C.esc(tr.time || "") + "</p>" +
        (tr.location ? '<p style="color:var(--muted);">' + C.esc(tr.location) + "</p>" : "") +
        (tr.notes ? '<p style="color:var(--muted);font-size:0.88rem;">' + C.esc(tr.notes) + "</p>" : "") +
        "</div>" +
        (latest
          ? '<div class="panel"><span class="motto" style="color:var(--green);">LATEST TRAINING</span>' +
            (latest.date ? '<p style="margin-top:0.6rem;color:var(--muted);">' + C.fmtDate(latest.date) + "</p>" : "") +
            (latest.report ? '<p style="margin-top:0.4rem;">' + C.esc(latest.report.slice(0, 220)) + "&hellip;</p>" : '<p style="color:var(--muted);">Report coming soon.</p>') +
            (latest.photos && latest.photos.length
              ? '<div class="grid grid-3" style="margin-top:1rem;">' + latest.photos.slice(0, 3).map(function (u) {
                  return '<img src="' + C.esc(u) + '" alt="Training photo" loading="lazy" style="border-radius:10px;aspect-ratio:4/3;object-fit:cover;">';
                }).join("") + "</div>"
              : "") +
            "</div>"
          : '<div class="empty-state"><span class="es-title">LATEST TRAINING</span>Training updates will appear here.</div>') +
        "</div>";
    }

    // LATEST VIDEOS / YOUTUBE
    var ytEl = document.getElementById("home-videos");
    if (ytEl) {
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

  window.CLUB.onReady(function () { heroSlideshow(); render(); });
})();
