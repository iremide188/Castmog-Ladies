var PRELOADER_MAX_WAIT_SECONDS = 7;
/* ============================================================
   CASTMOG LADIES FC — OFFICIAL WEBSITE LAUNCH EXPERIENCE
   Full-screen cinematic coming-soon gate on the homepage until
   settings.launch.date, then an automatic premium transition
   into the website. Config lives in settings.json (admin
   Settings tab): launch = { enabled, date (ISO), headline, sub,
   btnComing, welcome, logo, songUrl (YouTube link — plays via the SOUND button) }. Background media = the media.json
   "hero" items (admin Settings -> HOMEPAGE SLIDESHOW), falling
   back to all photos + videos. Dev/testing: add ?launchTest=<minutes>
   to the URL to preview the countdown + transition safely.
   ============================================================ */
(function () {
  var C = window.CLUB;
  if (!C) return;

  var bgMount = null, bgIdx = -1, bgSlides = [], bgTimer = null, bgKilled = false;

  function begin() {
    var s = C.get("settings") || {};
    var L = s.launch || {};
    if (String(L.enabled) !== "true") return noGate();
    var target = L.date ? new Date(L.date) : null;
    if (!target || isNaN(target.getTime())) return noGate();
    /* dev preview: ?launchTest=1 -> gate counting down to 1 minute from now */
    var m = /launchTest=(\d+)/.exec(window.location.search);
    if (m) target = new Date(Date.now() + Number(m[1]) * 60000);
    if (Date.now() >= target.getTime()) return noGate(); /* launch has passed -> normal site */
    /* the crest preloader plays first on fresh visits — gate starts after it */
    if (window.CLUB_PRELOADER_ACTIVE) {
      var started = false;
      var start = function () {
        if (started) return;
        started = true;
        build(L, target);
      };
      document.addEventListener("club:preloader-done", start, { once: true });
      /* safety net: never let a missed event block the gate */
      window.setTimeout(start, (PRELOADER_MAX_WAIT_SECONDS || 7) * 1000);
    } else {
      build(L, target);
    }
  }
  C.onReady(begin);

  /* launch.js decided the gate is OFF — unseal the homepage right away */
  function noGate() {
    window.CLUB_LAUNCH_ACTIVE = false;
    document.documentElement.classList.remove("launch-on");
  }

  function build(L, target) {
    var gate = document.getElementById("launch-gate");
    if (!gate) return;
    document.documentElement.classList.add("launch-on");
    gate.hidden = false;
    window.CLUB_LAUNCH_ACTIVE = true;
    if (!gateViewTracked) { gateViewTracked = true; track("view", "launch-gate"); }

    var logo = L.logo || "images/crest.png";
    gate.innerHTML =
      '<div class="lg-bg" aria-hidden="true"></div>' +
      '<div class="lg-veil" aria-hidden="true"></div>' +
      '<div class="lg-content">' +
        '<img class="lg-logo" src="' + C.esc(logo) + '" alt="Castmog Ladies FC crest">' +
        '<h1 class="lg-title">CASTMOG LADIES FC</h1>' +
        '<p class="lg-tag">' + C.esc(L.headline || "THE NEXT CHAPTER STARTS HERE") + '</p>' +
        '<p class="lg-sub">' + C.esc(L.sub || "OFFICIAL WEBSITE LAUNCH") + '</p>' +
        '<div class="lg-count" role="timer" aria-live="off">' + countUnits() + '</div>' +
        '<p class="lg-btn" aria-hidden="true">' + C.esc(L.btnComing || "COMING SOON") + '</p>' +
        '<p class="lg-welcome" aria-hidden="true">' + C.esc(L.welcome || "WELCOME TO CASTMOG") + '</p>' +
      '</div>';

    bgMount = gate.querySelector(".lg-bg");
    startBackground();
    wireMusic(gate, L);
    runCountdown(gate, target);
  }

  /* --- SOUND: the launch song (YouTube) starts automatically, muted —
         browsers block unmuted autoplay, so one tap on the SOUND button
         unmutes it; tap again to mute. --- */
  function track(kind, page) {
    try {
      fetch("https://superagent-e3f5b6f2.base44.app/functions/castmogTrack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: kind, page: page, visitorId: (localStorage.getItem("castmog_vid") || "anon") })
      }).catch(function () {});
    } catch (e) {}
  }

  var gateViewTracked = false;

  function wireMusic(gate, L) {
    var file = (L.songFile || "").trim();
    if (file) { wireSongFile(gate, file); return; }
    var url = (L.songUrl || "").trim();
    if (!url) return;

    var am = /audiomack\.com\/([A-Za-z0-9_-]+)\/(song|album|playlist)\/([A-Za-z0-9_-]+)/.exec(url);
    var yt = /(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/.exec(url);
    var embed = null;
    if (am) embed = "https://audiomack.com/embed/" + am[1] + "/" + am[2] + "/" + am[3] + "?background=1&color=e5c31a&autoplay=1";
    else if (yt) embed = "https://www.youtube-nocookie.com/embed/" + yt[1] + "?autoplay=1&mute=1&enablejsapi=1&playsinline=1&loop=1&playlist=" + yt[1];
    if (!embed) return;

    var btn = document.createElement("button");
    btn.className = "lg-music";
    btn.type = "button";
    btn.setAttribute("aria-label", "Open the launch song player");
    btn.innerHTML =
      '<svg class="lg-music-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' +
      '<span class="lg-music-lb">SOUND</span>' +
      '<span class="lg-music-eq" aria-hidden="true"><i></i><i></i><i></i></span>';
    gate.appendChild(btn);

    /* floating music notes around the crest while the song plays */
    var notes = document.createElement("div");
    notes.className = "lg-notes";
    notes.setAttribute("aria-hidden", "true");
    notes.innerHTML = "<span>\u266A</span><span>\u266B</span><span>\u266A</span>";
    gate.appendChild(notes);

    /* mini player card — the embed must be VISIBLE and tappable:
       mobile browsers only let a cross-origin player start from a tap
       inside the player itself */
    var card = document.createElement("div");
    card.className = "lg-player";
    card.setAttribute("role", "region");
    card.setAttribute("aria-label", "Launch song player");
    card.innerHTML =
      '<div class="lg-player-head">' +
      '<span class="lg-player-ttl">NOW PLAYING \u00b7 B4 B4</span>' +
      '<button type="button" class="lg-player-x" aria-label="Close the music player">&times;</button>' +
      "</div>" +
      '<div class="lg-player-frame"><iframe title="Launch song" allow="autoplay; encrypted-media" tabindex="0"></iframe></div>';
    gate.appendChild(card);

    /* PRE-WARM: a hidden 1px iframe loads the player page + audio handshake
       WHILE the visitor reads the countdown, so the SOUND tap starts the
       song from a hot browser cache — near-instant instead of a cold load.
       (Autoplay without a tap is blocked by browsers, so it stays silent.) */
    var warm = document.createElement("iframe");
    warm.src = embed;
    warm.title = "";
    warm.setAttribute("aria-hidden", "true");
    warm.allow = "autoplay; encrypted-media";
    warm.style.cssText = "position:absolute;bottom:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0;";
    gate.appendChild(warm);

    var open = false;
    function setOpen(v) {
      if (v && !open) track("sound", "launch-gate");
      open = v;
      var fr = card.querySelector("iframe");
      var lb = btn.querySelector(".lg-music-lb");
      if (v) {
        fr.src = embed;
        card.classList.add("is-open");
        gate.classList.add("lg-dance");
        btn.classList.add("lg-music-on");
        lb.textContent = "PLAYING";
        btn.setAttribute("aria-label", "Close the launch song player");
      } else {
        fr.src = "about:blank";
        card.classList.remove("is-open");
        gate.classList.remove("lg-dance");
        btn.classList.remove("lg-music-on");
        lb.textContent = "SOUND";
        btn.setAttribute("aria-label", "Open the launch song player");
      }
    }
    btn.addEventListener("click", function () { setOpen(!open); });
    card.querySelector(".lg-player-x").addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(false);
    });
  }

  /* same-origin song file: fully controllable hidden <audio> — nothing shows, just the song */
  function wireSongFile(gate, file) {
    var btn = document.createElement("button");
    btn.className = "lg-music";
    btn.type = "button";
    btn.setAttribute("aria-label", "Play the launch song");
    btn.innerHTML =
      '<svg class="lg-music-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' +
      '<span class="lg-music-lb">SOUND</span>' +
      '<span class="lg-music-eq" aria-hidden="true"><i></i><i></i><i></i></span>';
    gate.appendChild(btn);

    var notes = document.createElement("div");
    notes.className = "lg-notes";
    notes.setAttribute("aria-hidden", "true");
    notes.innerHTML = "<span>\u266A</span><span>\u266B</span><span>\u266A</span>";
    gate.appendChild(notes);

    var au = new Audio(file);
    au.loop = true;
    au.preload = "auto";
    au.muted = true;
    var lb = btn.querySelector(".lg-music-lb");

    /* INSTANT SOUND: mobile browsers refuse to preload media before a
       user gesture, so without this a tap has to download the mp3 first
       and the song comes in late. Fetch the WHOLE song up front as a
       blob while the visitor reads the countdown — by the time they
       press SOUND it is fully in memory and starts the same instant. */
    fetch(file).then(function (r) { return r.blob(); }).then(function (b) {
      if (!au.muted) return; /* visitor already tapped — never interrupt the live song */
      var t = au.currentTime || 0;
      au.src = URL.createObjectURL(b);
      au.loop = true;
      au.preload = "auto";
      au.muted = true;
      au.addEventListener("loadedmetadata", function once() {
        au.removeEventListener("loadedmetadata", once);
        try { au.currentTime = t; } catch (e) {}
        au.play().catch(function () {});
      });
      au.play().catch(function () {});
    }).catch(function () {});

    function playing() {
      return !au.paused && !au.muted;
    }
    function paint() {
      var on = playing();
      btn.classList.toggle("lg-music-on", on);
      gate.classList.toggle("lg-dance", on);
      lb.textContent = on ? "PLAYING" : "SOUND";
      btn.setAttribute("aria-label", on ? "Stop the launch song" : "Play the launch song");
    }
    ["play", "pause", "ended"].forEach(function (ev) { au.addEventListener(ev, paint); });

    /* try muted autoplay first — browsers allow it; the button brings the sound */
    au.play().catch(function () {});

    var tapped = false;
    btn.addEventListener("click", function () {
      if (playing()) {
        au.pause();
      } else {
        au.muted = false;
        au.volume = 1;
        au.play().catch(function () {});
        if (!tapped) { tapped = true; track("sound", "launch-gate"); }
      }
      paint();
    });
    paint();
  }

  function countUnits() {
    var defs = [["d", "DAYS"], ["h", "HOURS"], ["m", "MINUTES"], ["s", "SECONDS"]];
    var out = "";
    defs.forEach(function (u, i) {
      if (i) out += '<span class="lg-sep" aria-hidden="true">:</span>';
      out += '<span class="lg-unit"><span class="lg-num" id="lg-' + u[0] + '">00</span>' +
        '<span class="lg-lab">' + u[1] + '</span></span>';
    });
    return out;
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function runCountdown(gate, target) {
    var els = {
      d: document.getElementById("lg-d"), h: document.getElementById("lg-h"),
      m: document.getElementById("lg-m"), s: document.getElementById("lg-s")
    };
    var done = false, iv = null;
    function tick() {
      var diff = target.getTime() - Date.now();
      if (diff <= 0) {
        if (!done) { done = true; clearInterval(iv); launchMoment(gate); }
        return;
      }
      var sec = Math.floor(diff / 1000);
      els.d.textContent = pad(Math.floor(sec / 86400));
      els.h.textContent = pad(Math.floor((sec % 86400) / 3600));
      els.m.textContent = pad(Math.floor((sec % 3600) / 60));
      els.s.textContent = pad(sec % 60);
    }
    tick();
    iv = setInterval(tick, 1000);
  }

  /* ---------- the zero-crossing moment ---------- */
  function launchMoment(gate) {
    gate.classList.add("lg-zero");            /* countdown + button fade, logo lifts */
    setTimeout(function () { gate.classList.add("lg-welcome-in"); }, 1600);
    setTimeout(function () {
      document.documentElement.classList.remove("launch-on");
      gate.classList.add("lg-out");           /* gate fades, homepage revealed */
      bgStop();
    }, 3600);
    setTimeout(function () { gate.remove(); }, 4800);
  }

  /* ---------- cinematic background: photos + muted looping videos ---------- */
  function startBackground() {
    var media = C.pub(C.get("media")) || [];
    var hero = media.filter(function (x) { return (x.category || "") === "hero"; });
    var source = hero.length ? hero : media;
    var photos = source.filter(function (x) { return x.type === "photo" && x.url; });
    /* direct video files only — YouTube links cannot play as raw background */
    var videos = source.filter(function (x) {
      return x.type === "video" && x.url && !/youtube\.com|youtu\.be/i.test(x.url);
    });
    var ordered = [];
    photos.forEach(function (p, i) {
      ordered.push({ kind: "photo", url: p.url });
      if (videos.length && (i + 1) % 3 === 0) ordered.push({ kind: "video", url: videos[((i / 3) | 0) % videos.length] });
    });
    if (!ordered.length) videos.forEach(function (v) { ordered.push({ kind: "video", url: v.url }); });
    if (!ordered.length) return; /* no media -> dark cinematic background only */
    bgSlides = ordered;
    bgNext();
  }

  function bgNext() {
    if (bgKilled || !bgMount || !bgSlides.length) return;
    bgIdx = (bgIdx + 1) % bgSlides.length;
    var sl = bgSlides[bgIdx];
    var el = document.createElement("div");
    el.className = "lg-slide lg-kb" + (bgIdx % 2 ? "b" : "a");
    if (sl.kind === "photo") {
      el.style.backgroundImage = "url('" + sl.url + "')";
      bgMount.appendChild(el);
      window.requestAnimationFrame(function () { el.classList.add("lg-on"); });
      bgRetire();
      bgTimer = setTimeout(bgNext, 7000);
    } else {
      var v = document.createElement("video");
      v.muted = true; v.loop = false; v.playsInline = true;
      v.setAttribute("playsinline", ""); v.setAttribute("muted", "");
      v.preload = "auto"; v.src = sl.url;
      el.appendChild(v);
      bgMount.appendChild(el);
      var shown = false, advanced = false;
      function next() { if (advanced) return; advanced = true; clearTimeout(failT); clearTimeout(capT); bgRetire(); bgNext(); }
      var failT = setTimeout(function () { if (!shown) next(); }, 4000); /* autoplay refused -> fall back to photos */
      var capT = setTimeout(next, 25000);                                  /* safety cap */
      v.addEventListener("canplay", function () {
        var p = v.play();
        if (p && p.catch) p.catch(function () { next(); });
      });
      v.addEventListener("playing", function () {
        if (shown) return; shown = true;
        el.classList.add("lg-on"); bgRetire();
      });
      v.addEventListener("ended", next);
      v.addEventListener("error", next);
      v.load();
    }
  }

  /* fade out + remove the previous slide so at most two exist */
  function bgRetire() {
    if (!bgMount) return;
    var all = bgMount.querySelectorAll(".lg-slide");
    for (var i = 0; i < all.length - 1; i++) all[i].classList.remove("lg-on");
    setTimeout(function () {
      var keep = bgMount.querySelectorAll(".lg-slide.lg-on");
      var rest = bgMount.querySelectorAll(".lg-slide:not(.lg-on)");
      for (var j = 0; j < rest.length; j++) {
        var keepIt = false;
        for (var k = 0; k < keep.length; k++) if (rest[j] === keep[k]) keepIt = true;
        if (!keepIt) {
          var vid = rest[j].querySelector("video");
          if (vid) { try { vid.pause(); } catch (e) {} }
          rest[j].remove();
        }
      }
    }, 1600);
  }

  function bgStop() {
    bgKilled = true;
    clearTimeout(bgTimer);
    if (!bgMount) return;
    bgMount.querySelectorAll("video").forEach(function (v) { try { v.pause(); } catch (e) {} });
  }
})();
