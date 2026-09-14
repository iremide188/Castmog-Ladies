/* =====================================================
   CASTMOG LADIES FOOTBALL ACADEMY — shared layout script
   Injects the header and footer on every page so you only
   ever edit the navigation / footer in ONE place (here).
   ===================================================== */

(function () {
  "use strict";

  var LOGO_URL =
    "https://media.base44.com/images/public/6aa7fa4b232a4afee3f5b6f2/214b86dae_3282d99e0_IMG-20251109-WA00031.jpg";

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

    // Build the crest as a 4x4 grid of tiles that scatter,
    // then fly back together piece by piece.
    var GRID = 4;
    var tiles = "";
    for (var r = 0; r < GRID; r++) {
      for (var c = 0; c < GRID; c++) {
        var tx = Math.round(Math.random() * 160 - 80) + "px";
        var ty = Math.round(Math.random() * 160 - 80) + "px";
        var rot = Math.round(Math.random() * 90 - 45) + "deg";
        var sc = (0.6 + Math.random() * 0.5).toFixed(2);
        // Assemble in a diagonal wave from top-left to bottom-right
        var delay = (0.15 + (r + c) * 0.09).toFixed(2);
        var posX = Math.round((c / (GRID - 1)) * 100);
        var posY = Math.round((r / (GRID - 1)) * 100);
        tiles +=
          '<div class="preloader-tile" style="' +
          "background-image:url(" + LOGO_URL + ");" +
          "background-position:" + posX + "% " + posY + "%;" +
          "left:" + (c * 25) + "%;top:" + (r * 25) + "%;" +
          "--tx:" + tx + ";--ty:" + ty + ";--rot:" + rot + ";--sc:" + sc + ";" +
          "animation-delay:" + delay + 's;"></div>';
      }
    }

    // Wordmark with letter-by-letter stagger animation (after assembly)
    var word = "CASTMOG LADIES";
    var letters = "";
    for (var i = 0; i < word.length; i++) {
      var ch = word.charAt(i);
      if (ch === " ") {
        letters += '<span class="preloader-space"></span>';
      } else {
        letters +=
          '<span style="animation-delay:' + (1.3 + i * 0.05).toFixed(2) + 's">' + ch + "</span>";
      }
    }

    el.innerHTML =
      '<div class="preloader-inner">' +
      '<div class="preloader-puzzle" role="img" aria-label="Castmog Ladies Football Academy crest">' +
      tiles +
      "</div>" +
      '<div class="preloader-wordmark">' + letters + "</div>" +
      '<div class="preloader-motto">Building the Future Heroes</div>' +
      '<div class="preloader-bar"><div class="preloader-fill"></div></div>' +
      '<div class="preloader-pct">0%</div>' +
      "</div>";

    document.body.appendChild(el);
    return el;
  }

  function showPreloaderThenGo(url) {
    var preloader = buildPreloader();
    var fill = preloader.querySelector(".preloader-fill");
    var pct = preloader.querySelector(".preloader-pct");

    void preloader.offsetWidth; // reflow so the fade-in transition runs
    preloader.classList.add("is-visible");
    document.body.style.overflow = "hidden";

    var durationMs = PRELOAD_SECONDS * 1000;

    // Progress bar fills smoothly across the full wait
    fill.style.transition = "width " + PRELOAD_SECONDS + "s linear";
    window.requestAnimationFrame(function () {
      fill.style.width = "100%";
    });

    // Live percentage counter
    var startedAt = Date.now();
    var counter = window.setInterval(function () {
      var ratio = Math.min((Date.now() - startedAt) / durationMs, 1);
      pct.textContent = Math.floor(ratio * 100) + "%";
      if (ratio >= 1) window.clearInterval(counter);
    }, 100);

    window.setTimeout(function () {
      window.location.href = url;
    }, durationMs);
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
