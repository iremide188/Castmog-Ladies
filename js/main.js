/* =====================================================
   CASTMOG LADIES FOOTBALL ACADEMY — shared layout script
   Injects the header and footer on every page so you only
   ever edit the navigation / footer in ONE place (here).
   ===================================================== */

(function () {
  "use strict";

  var LOGO_URL = "images/crest.png";

  var PAGE_HOME = "index.html";

  // Work out which nav link should be highlighted
  var path = window.location.pathname.split("/").pop() || PAGE_HOME;

  var links = [
    { href: "index.html", label: "Home" },
    { href: "about.html", label: "About" },
    { href: "training.html", label: "Training" },
    { href: "coaches.html", label: "Coaches" },
    { href: "gallery.html", label: "Gallery" },
    { href: "news.html", label: "News" },
    { href: "contact.html", label: "Contact" }
  ];

  var navItemsHtml = links
    .map(function (link) {
      var active = link.href === path ? ' class="active"' : "";
      return (
        '<li><a href="' + link.href + '"' + active + ">" + link.label + "</a></li>"
      );
    })
    .join("");

  var headerHtml =
    '<header class="site-header">' +
    '<div class="container nav">' +
    '<a href="index.html" class="brand">' +
    '<img src="' + LOGO_URL + '" alt="Castmog Ladies Football Academy crest" class="brand-logo">' +
    '<span class="brand-text">' +
    '<span class="brand-name">CASTMOG</span><br>' +
    '<span class="brand-sub">LADIES FOOTBALL ACADEMY</span>' +
    "</span>" +
    "</a>" +
    '<button class="nav-toggle" id="navToggle" aria-label="Toggle menu">&#9776;</button>' +
    '<ul class="nav-links" id="navLinks">' +
    navItemsHtml +
    '<li class="nav-cta"><a class="btn btn-yellow btn-sm" href="apply.html">APPLY TO JOIN</a></li>' +
    "</ul>" +
    "</div>" +
    "</header>";

  var footerHtml =
    '<footer class="site-footer">' +
    '<div class="container">' +
    '<div class="footer-grid">' +
    "<div>" +
    '<div class="footer-brand">' +
    '<img src="' + LOGO_URL + '" alt="Castmog crest" class="brand-logo">' +
    '<span class="brand-text">' +
    '<span class="brand-name">CASTMOG</span><br>' +
    '<span class="brand-sub">LADIES FOOTBALL ACADEMY</span>' +
    "</span>" +
    "</div>" +
    '<p class="footer-motto">BUILDING THE FUTURE HEROES</p>' +
    '<p style="font-size:0.88rem; max-width:340px;">A professional environment for female football players to develop, train and compete.</p>' +
    "</div>" +
    "<div>" +
    "<h4>PAGES</h4>" +
    "<ul>" +
    links
      .map(function (l) {
        return '<li><a href="' + l.href + '">' + l.label + "</a></li>";
      })
      .join("") +
    "</ul>" +
    "</div>" +
    "<div>" +
    "<h4>CONTACT</h4>" +
    "<ul>" +
    '<li><a href="tel:09130527339">Phone: 0913 052 7339</a></li>' +
    '<li><a href="https://wa.me/2349130527339" target="_blank" rel="noopener">WhatsApp: 0913 052 7339</a></li>' +
    '<li><a href="mailto:adeniyioluwanifemi728@gmail.com">adeniyioluwanifemi728@gmail.com</a></li>' +
    "</ul>" +
    '<p style="font-size:0.75rem; color:rgba(255,255,255,0.5); margin-top:0.8rem;">Social links coming soon.</p>' +
    "</div>" +
    "</div>" +
    '<div class="footer-bottom">' +
    "<span>&copy; 2026 Castmog Ladies Football Academy. All rights reserved.</span>" +
    "<span>Female Football Academy &middot; Nigeria</span>" +
    "</div>" +
    "</div>" +
    "</footer>";

  // Inject header at the top of the page
  var headerMount = document.getElementById("site-header-mount");
  if (headerMount) {
    headerMount.outerHTML = headerHtml;

    // Mobile menu toggle
    var toggle = document.getElementById("navToggle");
    var navLinks = document.getElementById("navLinks");
    if (toggle && navLinks) {
      toggle.addEventListener("click", function () {
        navLinks.classList.toggle("open");
      });
    }
  }

  // Inject footer at the bottom
  var footerMount = document.getElementById("site-footer-mount");
  if (footerMount) {
    footerMount.outerHTML = footerHtml;
  }

  /* =====================================================
     PRELOADER — shows the academy crest for 15 seconds
     when any internal page link is clicked, before the
     target page opens. Change PRELOAD_SECONDS to adjust.
     ===================================================== */

  var PRELOAD_SECONDS = 15;

  function buildPreloader() {
    var el = document.createElement("div");
    el.className = "preloader";
    el.setAttribute("aria-hidden", "true");

    // Random irregular grid so shards look broken, not tiled
    function fracs(n) {
      var cuts = [];
      for (var i = 1; i < n; i++) cuts.push(Math.random());
      cuts.sort(function (a, b) { return a - b; });
      return [0].concat(cuts, [1]);
    }

    var COLS = 5;
    var ROWS = 5;
    var xs = fracs(COLS);
    var ys = fracs(ROWS);

    // jitter a polygon corner around 0% or 100% of the shard box
    function jj(base) {
      return (base + (Math.random() * 8 - 4)).toFixed(1);
    }

    var shards = "";
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var lf = xs[c];
        var tf = ys[r];
        var fw = xs[c + 1] - xs[c];
        var fh = ys[r + 1] - ys[r];

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
      '<div class="preloader-puzzle" role="img" aria-label="Castmog Ladies Football Academy crest">' +
      shards +
      "</div>" +
      '<div class="preloader-motto">Building the Future Heroes</div>' +
      "</div>";

    document.body.appendChild(el);
    return el;
  }

  function showPreloaderThenGo(url) {
    var preloader = buildPreloader();
    void preloader.offsetWidth; // reflow so the fade-in transition runs
    preloader.classList.add("is-visible");
    document.body.style.overflow = "hidden";

    window.setTimeout(function () {
      window.location.href = url;
    }, PRELOAD_SECONDS * 1000);
  }

  function initPreloader() {
    document.addEventListener("click", function (event) {
      // Let modified clicks (new tab etc.) behave natively
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      var link = event.target.closest ? event.target.closest("a[href]") : null;
      if (!link) return;

      var href = link.getAttribute("href");

      // Only intercept internal page links
      if (!href || !/\.html$/.test(href.split("#")[0])) return;
      if (/^(https?:|mailto:|tel:)/i.test(href)) return;

      event.preventDefault();
      showPreloaderThenGo(link.href);
    });
  }

  document.addEventListener("DOMContentLoaded", initPreloader);

})();
