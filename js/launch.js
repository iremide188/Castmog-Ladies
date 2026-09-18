/* ============================================================
   CASTMOG LADIES FC — OFFICIAL WEBSITE LAUNCH EXPERIENCE
   Full-screen cinematic coming-soon gate on the homepage until
   settings.launch.date, then an automatic premium transition
   into the website. Config lives in settings.json (admin
   Settings tab): launch = { enabled, date (ISO), headline, sub,
   btnComing, welcome, logo }. Background media = the media.json
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
    if (String(L.enabled) !== "true") return;
    var target = L.date ? new Date(L.date) : null;
    if (!target || isNaN(target.getTime())) return;
    /* dev preview: ?launchTest=1 -> gate counting down to 1 minute from now */
    var m = /launchTest=(\d+)/.exec(window.location.search);
    if (m) target = new Date(Date.now() + Number(m[1]) * 60000);
    if (Date.now() >= target.getTime()) return; /* launch has passed -> normal site */
    build(L, target);
  }
  C.onReady(begin);

  function build(L, target) {
    var gate = document.getElementById("launch-gate");
    if (!gate) return;
    document.documentElement.classList.add("launch-on");
    gate.hidden = false;

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
    runCountdown(gate, target);
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
      /* two layers: blurred copy fills the screen behind, fitted copy shows the whole photo */
      var blur = document.createElement("div");
      blur.className = "lg-photo-blur";
      blur.style.backgroundImage = "url('" + sl.url + "')";
      var fit = document.createElement("div");
      fit.className = "lg-photo-fit";
      fit.style.backgroundImage = "url('" + sl.url + "')";
      el.appendChild(blur);
      el.appendChild(fit);
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
