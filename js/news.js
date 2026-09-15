/* Newsroom — list + article view from data/news.json
   + public "POST A STORY" form (submissions await admin approval) */
(function () {
  "use strict";
  var C = window.CLUB;
  var id = new URLSearchParams(window.location.search).get("id");
  var SUBMIT_API = "https://superagent-e3f5b6f2.base44.app/functions/castmogNewsSubmit";

  var CATS = ["Match report", "Club news", "Player news", "Community story", "Other"];

  function nf(id, label, inner, req) {
    return '<div class="field"><label for="' + id + '">' + label + (req ? ' <span class="req">*</span>' : "") + "</label>" + inner + "</div>";
  }

  function renderSubmitForm() {
    var m = document.getElementById("news-form-mount");
    if (!m) return;
    m.innerHTML =
      '<div class="form-error" id="ns-error"></div>' +
      '<div class="form-grid">' +
      '<div class="grid grid-2" style="gap:1.2rem;">' +
      nf("ns-name", "YOUR NAME", '<input type="text" id="ns-name" maxlength="120" placeholder="Your full name">', true) +
      nf("ns-contact", "PHONE / WHATSAPP", '<input type="text" id="ns-contact" maxlength="60" placeholder="So the club can reach you">', true) +
      "</div>" +
      nf("ns-title", "STORY HEADLINE", '<input type="text" id="ns-title" maxlength="200" placeholder="What is the story about?">', true) +
      '<div class="grid grid-2" style="gap:1.2rem;">' +
      nf("ns-cat", "CATEGORY", '<div class="select-wrap"><select id="ns-cat">' +
        CATS.map(function (c) { return '<option value="' + c + '">' + c + "</option>"; }).join("") +
        "</select></div>", false) +
      nf("ns-image", "IMAGE LINK (OPTIONAL)", '<input type="url" id="ns-image" maxlength="500" placeholder="https://… link to a photo for the story">', false) +
      "</div>" +
      nf("ns-body", "YOUR STORY", '<textarea id="ns-body" rows="6" maxlength="8000" placeholder="Write the story here — what happened, where, when, who was involved…"></textarea>', true) +
      '<div style="display:flex;flex-direction:column;gap:0.7rem;">' +
      '<button class="btn btn-yellow btn-block" id="ns-submit" type="button">SUBMIT STORY FOR REVIEW &rarr;</button>' +
      '<p class="field-hint" style="text-align:center;">Your story goes to the club&rsquo;s admin team for confirmation. It appears on the website once approved.</p>' +
      "</div></div>";

    document.getElementById("ns-submit").addEventListener("click", function () {
      var btn = this;
      var err = document.getElementById("ns-error");
      var val = function (x) { return document.getElementById(x).value.trim(); };
      var name = val("ns-name"), contact = val("ns-contact"), title = val("ns-title"), body = val("ns-body");
      err.classList.remove("show");
      if (!name) return nsFail(err, "Please enter your name.");
      if (!contact) return nsFail(err, "Please enter a phone number or WhatsApp so the club can reach you.");
      if (!title) return nsFail(err, "Please give your story a headline.");
      if (body.length < 20) return nsFail(err, "Please write the full story (at least a couple of sentences).");

      btn.disabled = true;
      btn.textContent = "SENDING…";
      fetch(SUBMIT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, contact: contact, title: title, body: body, category: val("ns-cat"), imageUrl: val("ns-image") })
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (res && res.ok) {
          m.innerHTML =
            '<div class="empty-state" style="border:1px solid rgba(47,191,113,.4);background:rgba(47,191,113,.06);">' +
            '<span class="es-title" style="color:var(--green);">THANK YOU — YOUR STORY HAS BEEN SENT</span>' +
            "The Castmog Ladies admin team will review it now. Once confirmed, it will be published on the website newsroom." +
            "</div>";
        } else {
          throw new Error("failed");
        }
      }).catch(function () {
        btn.disabled = false;
        btn.textContent = "SUBMIT STORY FOR REVIEW →";
        nsFail(err, "Could not send right now — please check your connection and try again.");
      });
    });
  }

  function nsFail(err, msg) {
    err.textContent = msg;
    err.classList.add("show");
    err.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  window.CLUB.onReady(function () {
    var mount = document.getElementById("news-mount");
    if (!mount) return;
    var all = C.pub(C.get("news")).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var article = id && all.filter(function (n) { return n.id === id; })[0];

    if (article) {
      document.title = article.title + " — Castmog Ladies News";
      mount.innerHTML =
        '<div class="article-head"><div class="nc-meta" style="display:flex;gap:0.5rem;flex-wrap:wrap;">' +
        '<span class="chip chip-yellow">' + C.esc(article.category || "CLUB") + "</span>" +
        (article.date ? '<span class="chip">' + C.fmtDate(article.date) + "</span>" : "") + "</div>" +
        '<h1 style="font-family:var(--font-head);font-size:clamp(1.8rem,4.5vw,2.8rem);text-transform:uppercase;margin:0.9rem 0;">' + C.esc(article.title) + "</h1>" +
        (article.author ? '<p style="color:var(--muted);">By ' + C.esc(article.author) + "</p>" : "") + "</div>" +
        (article.image ? '<img src="' + C.esc(article.image) + '" alt="' + C.esc(article.title) + '" style="border-radius:14px;margin:1.4rem 0;aspect-ratio:16/9;object-fit:cover;width:100%;">' : "") +
        '<div class="article-body">' + String(article.body || "").split(/\n+/).map(function (p) {
          return "<p>" + C.esc(p) + "</p>";
        }).join("") + "</div>" +
        '<a class="btn btn-outline btn-sm" href="news.html">&larr; ALL NEWS</a>';
      return;
    }

    mount.innerHTML = all.length
      ? '<div class="grid grid-3">' + all.map(function (n) {
          return '<article class="card news-card">' +
            (n.image ? '<img class="nc-img" src="' + C.esc(n.image) + '" alt="' + C.esc(n.title) + '" loading="lazy">' : "") +
            '<div class="nc-body"><div class="nc-meta"><span class="chip chip-yellow">' + C.esc(n.category || "CLUB") + "</span>" +
            (n.date ? '<span class="chip">' + C.fmtDate(n.date) + "</span>" : "") + "</div>" +
            "<h3>" + C.esc(n.title) + "</h3><p>" + C.esc((n.body || "").slice(0, 150)) + "&hellip;</p>" +
            '<a class="nc-more" href="news.html?id=' + encodeURIComponent(n.id) + '">Read more</a></div></article>';
        }).join("") + "</div>"
      : '<div class="empty-state"><span class="es-title">NEWSROOM COMING SOON</span>Match reports, club announcements and player news will appear here.</div>';

    renderSubmitForm();
  });
})();
