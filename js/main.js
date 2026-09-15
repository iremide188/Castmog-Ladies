/* =====================================================
   CASTMOG LADIES — shared layout script
   Injects header/footer on every public page and runs the
   crest shatter preloader on internal navigation.
   ===================================================== */

(function () {
  "use strict";

  var LOGO_URL = "images/crest.png";
  var PAGE_HOME = "index.html";

  var path = window.location.pathname.split("/").pop() || PAGE_HOME;

  var links = [
    { href: "index.html", label: "Home" },
    { href: "club.html", label: "Club" },
    { href: "squad.html", label: "Squad" },
    { href: "matches.html", label: "Matches" },
    { href: "media.html", label: "Media" },
    { href: "achievements.html", label: "Achievements" },
    { href: "contact.html", label: "Contact" }
  ];

  var navItemsHtml = links
    .map(function (link) {
      var active = link.href === path ? ' class="active"' : "";
      return '<li><a href="' + link.href + '"' + active + ">" + link.label + "</a></li>";
    })
    .join("");

  var headerHtml =
    '<header class="site-header">' +
    '<div class="container nav">' +
    '<a href="index.html" class="brand">' +
    '<img src="' + LOGO_URL + '" alt="Castmog Ladies crest" class="brand-logo">' +
    '<span class="brand-text">' +
    '<span class="brand-name">CASTMOG LADIES</span><br>' +
    '<span class="brand-sub">BUILDING THE FUTURE HEROES</span>' +
    "</span>" +
    "</a>" +
    '<button class="nav-toggle" id="navToggle" aria-label="Toggle menu">&#9776;</button>' +
    '<ul class="nav-links" id="navLinks">' +
    navItemsHtml +
    '<li class="nav-cta"><a class="btn btn-yellow btn-sm" href="join.html">JOIN CASTMOG</a></li>' +
    "</ul>" +
    "</div>" +
    "</header>";

  var footerHtml =
    '<footer class="site-footer">' +
    '<div class="container">' +
    '<div class="footer-grid">' +
    "<div>" +
    '<div class="footer-brand">' +
    '<img src="' + LOGO_URL + '" alt="Castmog Ladies crest" class="brand-logo">' +
    '<span class="brand-text">' +
    '<span class="brand-name">CASTMOG LADIES</span><br>' +
    '<span class="brand-sub">BUILDING THE FUTURE HEROES</span>' +
    "</span>" +
    "</div>" +
    '<p id="footer-about">The women\'s team of Castmog Football Academy. Developing, training and competing.</p>' +
    '<div class="footer-social" id="footer-social"></div>' +
    "</div>" +
    "<div>" +
    "<h4>CLUB</h4>" +
    '<ul>' +
    '<li><a href="index.html">Home</a></li>' +
    '<li><a href="club.html">Club</a></li>' +
    '<li><a href="squad.html">Squad</a></li>' +
    '<li><a href="matches.html">Matches</a></li>' +
    '<li><a href="news.html">News</a></li>' +
    '<li><a href="achievements.html">Achievements</a></li>' +
    "</ul>" +
    "</div>" +
    "<div>" +
    "<h4>CONTACT</h4>" +
    '<ul id="footer-contact">' +
    '<li><a href="mailto:castmogladies@gmail.com">castmogladies@gmail.com</a></li>' +
    '<li><a href="https://wa.me/2349130527339" target="_blank" rel="noopener">WhatsApp: 0913 052 7339</a></li>' +
    '<li><a href="media.html">Media Centre</a></li>' +
    '<li><a href="join.html">Join Castmog</a></li>' +
    "</ul>" +
    "</div>" +
    "</div>" +
    '<div class="footer-bottom">' +
    "<span>&copy; 2026 Castmog Ladies. All rights reserved.</span>" +
    "<span>Female Football Club &middot; Nigeria</span>" +
    "</div>" +
    "</div>" +
    "</footer>";

  function inject() {
    var headerMount = document.getElementById("site-header-mount");
    if (headerMount) {
      headerMount.outerHTML = headerHtml;
      var toggle = document.getElementById("navToggle");
      var navLinks = document.getElementById("navLinks");
      if (toggle && navLinks) {
        toggle.addEventListener("click", function () {
          navLinks.classList.toggle("open");
        });
      }
    }

    var footerMount = document.getElementById("site-footer-mount");
    if (footerMount) footerMount.outerHTML = footerHtml;

    /* every page hero gets the moving photo/video slideshow behind the title */
    document.querySelectorAll(".page-hero").forEach(function (ph) {
      if (ph.querySelector(".hero-slideshow")) return;
      var sl = document.createElement("div");
      sl.className = "hero-slideshow";
      sl.setAttribute("aria-hidden", "true");
      ph.insertBefore(sl, ph.firstChild);
    });

    // Fill footer contact + socials from the data layer when available
    if (window.CLUB && window.CLUB.ready()) {
      var s = window.CLUB.get("settings") || {};
      var fc = document.getElementById("footer-contact");
      if (fc && s.email) {
        fc.innerHTML =
          '<li><a href="mailto:' + s.email + '">' + s.email + "</a></li>" +
          '<li><a href="' + (s.whatsappLink || "#") + '" target="_blank" rel="noopener">WhatsApp: ' +
          (s.whatsappDisplay || "") + "</a></li>";
      }
      var fs = document.getElementById("footer-social");
      if (fs && s.social) {
        var html = "";
        var names = { youtube: "YouTube", instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", twitter: "X / Twitter" };
        Object.keys(names).forEach(function (k) {
          if (s.social[k]) {
            html += '<a href="' + s.social[k] + '" target="_blank" rel="noopener">' + names[k] + "</a>";
          }
        });
        fs.innerHTML = html;
      }
    }
  }

  /* ---------- Moving image/video slideshow — homepage hero + every page hero ---------- */
  function buildSlideshow(mount) {
    if (!mount || mount.querySelector(".hero-slide")) return;
    var C = window.CLUB;
    var media = C.pub(C.get("media")) || [];
    var slides = [];
    media.forEach(function (m) {
      if (m.type === "photo" && m.url) slides.push({ kind: "photo", url: m.url });
    });
    media.forEach(function (m) {
      if (m.type === "video" && m.url) slides.push({ kind: "video", url: m.url });
    });
    /* interleave: photo, photo, video, photo, photo, video ... max 6 */
    var ordered = [], photos = slides.filter(function (s) { return s.kind === "photo"; });
    var videos = slides.filter(function (s) { return s.kind === "video"; });
    photos.forEach(function (p, i) {
      ordered.push(p);
      if ((i + 1) % 2 === 0 && videos.length) ordered.push(videos.shift());
    });
    ordered = ordered.concat(videos).slice(0, 6);
    if (!ordered.length) return;

    ordered.forEach(function (sl, i) {
      var s = document.createElement("div");
      s.className = "hero-slide" + (i === 0 ? " is-active" : "");
      if (sl.kind === "photo") {
        s.style.backgroundImage = "url('" + sl.url + "')";
      } else {
        var v = document.createElement("video");
        v.src = sl.url; v.muted = true; v.loop = true;
        v.setAttribute("playsinline", ""); v.setAttribute("autoplay", ""); v.preload = "metadata";
        s.appendChild(v);
      }
      mount.appendChild(s);
    });

    var els = mount.querySelectorAll(".hero-slide");
    if (els.length < 2) return;
    var cur = 0;
    setInterval(function () {
      var next = (cur + 1) % els.length;
      els[cur].classList.remove("is-active");
      els[next].classList.add("is-active");
      var va = els[cur].querySelector("video"); if (va) va.pause();
      var vb = els[next].querySelector("video");
      if (vb) { try { vb.currentTime = 0; } catch (_e) {} vb.play().catch(function () {}); }
      cur = next;
    }, 6000);
  }

  function injectSlideshows() {
    if (!window.CLUB) return;
    var home = document.getElementById("hero-slideshow");
    if (home) buildSlideshow(home);
    document.querySelectorAll(".page-hero .hero-slideshow").forEach(buildSlideshow);
  }

  /* ---------- IMPORTANT ALERT — moving gold banner, set from the admin Settings tab ---------- */
  function injectAlert() {
    var s = (window.CLUB && window.CLUB.get("settings")) || {};
    var txt = String(s.alertText || "").trim();
    if (!txt || document.querySelector(".alert-ticker")) return;
    var span = '<span class="at-dot"></span> ' + txt + " &nbsp;&bull;&nbsp; ";
    var bar = document.createElement("div");
    bar.className = "alert-ticker";
    bar.setAttribute("role", "status");
    bar.innerHTML = '<div class="lt-track">' + span + span + "</div>";
    document.body.insertBefore(bar, document.body.firstChild);
    document.body.classList.add("has-alert-bar");
  }

  function injectTicker() {
    var yt = (window.CLUB && window.CLUB.get("youtube")) || {};
    if (!yt.live || !yt.liveVideoId) return;
    var url = "https://www.youtube.com/watch?v=" + encodeURIComponent(yt.liveVideoId);
    var msg = (yt.liveTitle ? yt.liveTitle : "CASTMOG LADIES ARE LIVE ON YOUTUBE") + " &nbsp;&bull;&nbsp; TAP TO WATCH THE LIVE STREAM";
    var span = '<span class="lt-dot"></span> ' + msg + " &nbsp;&bull;&nbsp; ";
    var bar = document.createElement("a");
    bar.className = "live-ticker";
    bar.href = url;
    bar.target = "_blank";
    bar.rel = "noopener";
    bar.setAttribute("aria-label", "Castmog Ladies are live on YouTube — tap to watch");
    bar.innerHTML = '<div class="lt-track">' + span + span + "</div>";
    document.body.insertBefore(bar, document.body.firstChild);
    document.body.classList.add("has-live-ticker");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }

  if (window.CLUB && window.CLUB.onReady) {
    window.CLUB.onReady(function () { inject(); injectSlideshows(); injectTicker(); injectAlert(); });
  }

  /* ---------- Crest shatter preloader ---------- */

  var PRELOAD_SECONDS = 5;

  function buildPreloader() {
    var el = document.createElement("div");
    el.className = "preloader";
    el.setAttribute("aria-hidden", "true");

    function fracs(n) {
      var cuts = [];
      for (var i = 1; i < n; i++) cuts.push(Math.random());
      cuts.sort(function (a, b) { return a - b; });
      return [0].concat(cuts, [1]);
    }

    var COLS = 5, ROWS = 5;
    var xs = fracs(COLS), ys = fracs(ROWS);

    function jj(base) {
      return (base + (Math.random() * 8 - 4)).toFixed(1);
    }

    var shards = "";
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var lf = xs[c], tf = ys[r];
        var fw = xs[c + 1] - xs[c], fh = ys[r + 1] - ys[r];
        var clip =
          "polygon(" +
          jj(0) + "% " + jj(0) + "%," +
          jj(100) + "% " + jj(0) + "%," +
          jj(100) + "% " + jj(100) + "%," +
          jj(0) + "% " + jj(100) + "%)";
        var tx = Math.round(Math.random() * 240 - 120) + "px";
        var ty = Math.round(Math.random() * 240 - 120) + "px";
        var rot = Math.round(Math.random() * 100 - 50) + "deg";
        var sc = (0.5 + Math.random() * 0.6).toFixed(2);
        var delay = (Math.random() * 0.35).toFixed(2);
        shards +=
          '<div class="preloader-tile" style="' +
          "background-image:url(" + LOGO_URL + ");" +
          "background-size:" + (100 / fw).toFixed(1) + "% " + (100 / fh).toFixed(1) + "%;" +
          "background-position:" +
          ((lf / (1 - fw)) * 100).toFixed(2) + "% " +
          ((tf / (1 - fh)) * 100).toFixed(2) + "%;" +
          "left:" + (lf * 100).toFixed(2) + "%;" +
          "top:" + (tf * 100).toFixed(2) + "%;" +
          "width:" + (fw * 100).toFixed(2) + "%;" +
          "height:" + (fh * 100).toFixed(2) + "%;" +
          "clip-path:" + clip + ";" +
          "--tx:" + tx + ";--ty:" + ty + ";--rot:" + rot + ";--sc:" + sc + ";" +
          "animation-delay:" + delay + 's;"></div>';
      }
    }

    el.innerHTML =
      '<div class="preloader-inner">' +
      '<div class="preloader-puzzle" role="img" aria-label="Castmog Ladies crest">' +
      shards +
      "</div>" +
      '<div class="preloader-motto">Building the Future Heroes</div>' +
      "</div>";

    document.body.appendChild(el);
    return el;
  }

  function showPreloaderThenGo(url) {
    var preloader = buildPreloader();
    void preloader.offsetWidth;
    preloader.classList.add("is-visible");
    document.body.style.overflow = "hidden";
    window.setTimeout(function () {
      window.location.href = url;
    }, PRELOAD_SECONDS * 1000);
  }

  function initPreloader() {
    document.addEventListener("click", function (event) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      var link = event.target.closest ? event.target.closest("a[href]") : null;
      if (!link) return;
      if (link.hasAttribute("data-no-preloader")) return;

      var href = link.getAttribute("href") || "";

      // Never preload admin or external/anchor navigation
      if (href.indexOf("admin.html") !== -1) return;
      if (!/\.html$/.test(href.split("#")[0])) return;
      if (/^(https?:|mailto:|tel:)/i.test(href)) return;

      event.preventDefault();
      showPreloaderThenGo(link.href);
    });
  }

  /* ---------- Scroll reveal ---------- */

  function initReveal() {
    var els = document.querySelectorAll(
      ".section-title, .section-sub, .card, .panel, .player-card, .staff-card, " +
      ".match-card, .match-row, .media-item, .news-card, .honour-card, .stat-tile, " +
      ".form-card, .yt-facade, .empty-state, .section .btn"
    );

    var items = [];
    for (var i = 0; i < els.length; i++) {
      if (!els[i].closest(".hero") && !els[i].closest(".page-hero")) items.push(els[i]);
    }

    if (!("IntersectionObserver" in window)) return;

    items.forEach(function (el) { el.classList.add("reveal"); });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    items.forEach(function (el) { io.observe(el); });
  }

  document.addEventListener("DOMContentLoaded", initPreloader);
  document.addEventListener("DOMContentLoaded", initReveal);

})();
