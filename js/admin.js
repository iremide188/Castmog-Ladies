/* =====================================================
   CASTMOG LADIES — ADMIN DASHBOARD
   Secure token-gated management panel. All club data lives
   in data/*.json in the repo; the dashboard reads and
   writes them through the GitHub Contents API, so every
   change is committed to the database and the public
   website updates automatically.
   ===================================================== */

(function () {
  "use strict";

  var REPO = "iremide188/Castmog-Ladies";
  var BRANCH = "main";

  var token = localStorage.getItem("castmog_admin_token") || "";
  var files = {};   // { players: {sha, data, dirty}, ... }
  var activeTab = "overview";

  /* ---------- GitHub API ---------- */

  function api(method, path, body) {
    return fetch("https://api.github.com/repos/" + REPO + "/contents/" + path + (method === "GET" ? "?ref=" + BRANCH : ""), {
      method: method,
      headers: {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (j) {
        throw new Error((j && j.message) || ("GitHub API error " + r.status));
      });
      return r.json();
    });
  }

  function b64(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function unb64(str) {
    var bin = atob(str.replace(/\n/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  /* ---------- device file uploads (committed straight into the repo) ---------- */

  /* Shrinks photos in the browser BEFORE uploading: big camera images are
     downscaled to max 1600px and re-encoded (JPEG q0.85), typically 90%+
     smaller with no visible difference — uploads get far faster,
     especially on mobile data. Falls back to the original on any problem. */
  function compressImage(file, onStatus) {
    return new Promise(function (resolve) {
      if (!/^image\//.test(file.type) || file.size < 350 * 1024) return resolve(file);
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var done = false;
        function finish(f) { if (!done) { done = true; URL.revokeObjectURL(url); resolve(f); } }
        try {
          var MAX = 1600;
          var scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
          var c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(img.naturalWidth * scale));
          c.height = Math.max(1, Math.round(img.naturalHeight * scale));
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          var keepPng = file.type === "image/png";
          c.toBlob(function (blob) {
            if (!blob || blob.size >= file.size) return finish(file);
            onStatus("busy", "Optimising photo… " + Math.round(blob.size / 1024) + "KB (was " + Math.round(file.size / 1024) + "KB)");
            var newName = file.name.replace(/\.[^.]+$/, "") + (keepPng ? ".png" : ".jpg");
            finish(new File([blob], newName, { type: keepPng ? "image/png" : "image/jpeg" }));
          }, keepPng ? "image/png" : "image/jpeg", 0.85);
        } catch (e) { finish(file); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  function uploadAsset(rawFile, folder, onStatus) {
    compressImage(rawFile, onStatus).then(function (file) {
      var ext = (/\.[a-z0-9]+$/i.exec(file.name) || [""])[0].toLowerCase();
      if (!ext && file.type && file.type.split("/")[1]) ext = "." + file.type.split("/")[1];
      var isVideo = /^video\//.test(file.type) || /\.(mp4|webm|mov|m4v|ogg)$/i.test(file.name);
      var limit = isVideo ? 40 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > limit) {
        onStatus("err", isVideo
          ? "That video is over 40MB — upload it to YouTube instead, then paste the video ID or link."
          : "That image is over 10MB even after optimising — please use a smaller file.");
        return;
      }
      var mb = file.size > 1024 * 1024;
      onStatus("busy", "Uploading " + (mb ? (file.size / 1024 / 1024).toFixed(1) + "MB" : Math.round(file.size / 1024) + "KB") +
        (mb ? " — this can take a few minutes on a slow connection…" : "…"));
      var reader = new FileReader();
      reader.onerror = function () { onStatus("err", "Could not read the file."); };
      reader.onload = function () {
        var content = String(reader.result).split(",")[1];
        var path = "assets/uploads/" + folder + "/" + Date.now() + "-" + slug(file.name.replace(/\.[^.]+$/, "")) + ext;
        api("PUT", path, { message: "Upload " + folder + " file via Castmog admin", content: content, branch: BRANCH })
          .then(function () { onStatus("ok", path); })
          .catch(function (e) { onStatus("err", "Upload failed: " + (e.message || e)); });
      };
      reader.readAsDataURL(file);
    });
  }

  function loadFile(name) {
    return api("GET", "data/" + name + ".json").then(function (res) {
      var parsed = JSON.parse(unb64(res.content));
      /* club.json stores {sections:[...]} — the tab works on the array itself */
      if (name === "club" && parsed && parsed.sections && !parsed.length) parsed = parsed.sections;
      files[name] = { sha: res.sha, data: parsed, dirty: false };
    });
  }

  function saveFile(name, message) {
    var f = files[name];
    return api("PUT", "data/" + name + ".json", {
      message: message || ("Update " + name + ".json via Castmog admin"),
      content: b64(JSON.stringify(name === "club" ? { sections: f.data } : f.data, null, 2) + "\n"),
      sha: f.sha,
      branch: BRANCH
    }).then(function (res) {
      f.sha = res.content.sha;
      f.dirty = false;
    });
  }

  /* ---------- schemas ---------- */

  function F(key, label, type, opts) {
    return { key: key, label: label, type: type || "text", opts: opts || [] };
  }

  var STATUS = ["scheduled", "finished", "postponed", "cancelled"];

  var COLLECTIONS = {
    players: {
      title: "Players", titleKey: "name", sub: function (r) { return "#" + r.number + " · " + (r.positionLabel || ""); },
      fields: [
        F("name", "Full name"), F("nickname", "Nickname"),
        F("number", "Jersey number", "number"), F("position", "Position", "select", ["GK", "DEF", "MID", "ATT"]),
        F("positionLabel", "Position label", "select", ["Goalkeeper", "Defender", "Midfielder", "Attacker"]),
        F("secondaryPosition", "Secondary position"), F("dob", "Date of birth", "date"),
        F("nationality", "Nationality"), F("foot", "Preferred foot", "select", ["", "Left", "Right", "Both"]),
        F("height", "Height"), F("previousClubs", "Previous clubs", "list"),
        F("biography", "Biography", "textarea"),
        F("appearances", "Appearances", "number"), F("goals", "Goals", "number"), F("assists", "Assists", "number"),
        F("photo", "Player profile photo", "image", ["players"]),
        F("gallery", "Photo gallery", "filelist", ["player-photos"]),
        F("videos", "Videos (upload files or paste YouTube links)", "filelist", ["player-videos"]),
        F("highlight", "Highlight video ID"),
        F("socialUrl", "Personal social media URL (Instagram / X / TikTok)")
      ]
    },
    staff: {
      title: "Coaching Staff", titleKey: "name", sub: function (r) { return r.role || ""; },
      fields: [
        F("name", "Full name"), F("role", "Role"),
        F("photo", "Staff photo", "image", ["staff"]),
        F("socialUrl", "Personal social media URL (Instagram / X / TikTok)"),
        F("bio", "Biography", "textarea"), F("qualifications", "Qualifications", "textarea"),
        F("experience", "Experience", "textarea")
      ]
    },
    matches: {
      title: "Matches", titleKey: "opponent",
      sub: function (r) { return r.date + " · " + (r.competition || "") + " · " + (r.status || ""); },
      fields: [
        F("opponent", "Opponent"), F("opponentLogo", "Opponent logo", "image", ["opponents"]),
        F("date", "Date", "date"), F("time", "Kick-off time (e.g. 8am, 4:00 PM or 15:30)"),
        F("competition", "Competition"), F("venue", "Venue"),
        F("homeAway", "Home / Away", "select", ["Home", "Away"]),
        F("status", "Match status", "select", STATUS),
        F("liveScoreCastmog", "LIVE score — Castmog (update during the match)", "number"),
        F("liveScoreOpponent", "LIVE score — Opponent (update during the match)", "number"),
        F("scorers", "Goalscorers — who scored for Castmog", "scorers"),
        F("scoreCastmog", "Final score — Castmog (after the match)", "number"),
        F("scoreOpponent", "Final score — Opponent (after the match)", "number"),
        F("report", "Match report", "textarea"), F("lineup", "Starting lineup", "list"),
        F("subs", "Substitutes", "list"), F("events", "Match events", "list"),
        F("photos", "Match photo URLs", "list"), F("videos", "Match video IDs/URLs", "list"),
        F("notes", "Notes", "textarea")
      ]
    },
    news: {
      title: "News", titleKey: "title", sub: function (r) { return (r.category || "") + " · " + (r.date || ""); },
      fields: [
        F("title", "Title"), F("image", "Featured image URL"),
        F("body", "Body", "textarea"), F("category", "Category"),
        F("author", "Author"), F("date", "Date", "date"), F("seoDescription", "SEO description", "textarea")
      ]
    },
    achievements: {
      title: "Achievements", titleKey: "trophy", sub: function (r) { return r.year || ""; },
      fields: [
        F("trophy", "Trophy / competition name"), F("year", "Year"), F("description", "Description", "textarea"),
        F("image", "Image URL"), F("category", "Category"), F("source", "Source")
      ]
    },
    media: {
      title: "Media", titleKey: "caption", sub: function (r) { return r.type + " · " + (r.category || ""); },
      fields: [
        F("caption", "Caption"), F("type", "Type", "select", ["photo", "video", "youtube"]),
        F("category", "Category", "select", ["photos", "videos", "training", "match-highlights", "interviews", "news", "youtube"]),
        F("url", "URL"), F("youtubeId", "YouTube video ID"), F("thumb", "Thumbnail URL"),
        F("date", "Date", "date"), F("featured", "Featured", "check")
      ]
    },
    youtube: {
      title: "YouTube Videos", titleKey: "title", sub: function (r) { return r.youtubeId || ""; },
      fields: [F("title", "Title"), F("youtubeId", "YouTube video ID"), F("date", "Date", "date"), F("featured", "Featured", "check")]
    },
    club: {
      title: "Club Sections", titleKey: "title", sub: function (r) { return r.published ? "PUBLISHED" : "DRAFT — needs approval"; },
      fields: [
        F("title", "Section title"), F("body", "Body (blank = Coming Soon)", "textarea"),
        F("source", "Source (for reviewed external information)")
      ]
    }
  };

  var OBJECTS = {
    training: {
      title: "Training",
      fields: [
        F("days", "Training days"), F("time", "Training time"), F("location", "Location"),
        F("type", "Training type"), F("notes", "Notes", "textarea"),
        F("status", "Is training on?", "select", ["On", "Off"]),
        F("offNotice", "Notice to players when training is OFF (e.g. 'No training this week — we resume on Monday')")
      ]
    },
    settings: {
      title: "Site Settings",
      fields: [
        F("clubName", "Club name"), F("parent", "Parent organisation"), F("motto", "Motto"),
        F("email", "Official email"), F("phone", "Phone"), F("whatsappDisplay", "WhatsApp (display)"),
        F("whatsappLink", "WhatsApp (wa.me link)"), F("applicationFee", "Application fee (₦)", "number"),
        F("palmpay.number", "Payment account number (receives transfers from ALL banks)"), F("palmpay.name", "Payment account name"),
        F("bannerImage", "Page banner photo — displayed at the top of every page (one wide photo, e.g. the team or stadium)", "image", ["settings"]),
        F("social.youtube", "YouTube URL"), F("social.instagram", "Instagram URL"),
        F("social.facebook", "Facebook URL"), F("social.tiktok", "TikTok URL"), F("social.twitter", "X/Twitter URL")
      ]
    }
  };

  /* YouTube config sits in the youtube.json object too */
  var YT_CONFIG = [
    F("channel", "YouTube channel URL"), F("live", "Channel is LIVE now", "check"),
    F("liveVideoId", "Live stream video ID"), F("liveTitle", "Live stream title")
  ];

  /* ---------- utilities ---------- */

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function slug(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";
  }

  function getVal(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }

  function setVal(obj, path, val) {
    var parts = path.split(".");
    var o = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      if (typeof o[parts[i]] !== "object" || o[parts[i]] === null) o[parts[i]] = {};
      o = o[parts[i]];
    }
    o[parts[parts.length - 1]] = val;
  }

  /* ---------- auth & boot ---------- */

  var FILE_LIST = ["settings", "club", "players", "staff", "matches", "news", "achievements", "media", "training", "youtube"];

  function boot() {
    document.getElementById("login-view").style.display = "none";
    document.getElementById("admin-view").style.display = "grid";
    renderSide();
    renderTab("overview");
  }

  function tryToken(t, cb) {
    token = t;
    api("GET", "data/settings.json")
      .then(function () {
        localStorage.setItem("castmog_admin_token", t);
        /* load all files at once — much faster than one-by-one */
        return Promise.all(FILE_LIST.map(function (n) { return loadFile(n); }));
      })
      .then(function () { cb(null); })
      .catch(function (err) { cb(err.message || "Could not access the repository with this token."); });
  }

  function init() {
    var form = document.getElementById("login-form");
    var err = document.getElementById("login-error");

    if (token) {
      tryToken(token, function (e) {
        if (!e) { boot(); return; }
        err.textContent = "Saved token no longer works: " + e;
        err.classList.add("show");
      });
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      err.classList.remove("show");
      var t = document.getElementById("token-input").value.trim();
      if (!t) { err.textContent = "Paste your GitHub token first."; err.classList.add("show"); return; }
      var btn = document.getElementById("login-btn");
      btn.disabled = true;
      btn.textContent = "CONNECTING…";
      tryToken(t, function (e) {
        btn.disabled = false;
        btn.textContent = "CONNECT TO THE DATABASE";
        if (e) { err.textContent = e; err.classList.add("show"); return; }
        boot();
      });
    });
  }

  /* ---------- UI ---------- */

  var TABS = [
    ["overview", "Dashboard"], ["players", "Players"], ["staff", "Staff"],
    ["matches", "Matches"], ["news", "News"], ["media", "Media"],
    ["youtube", "YouTube"], ["achievements", "Achievements"],
    ["club", "Club / Content Approval"], ["training", "Training"], ["settings", "Settings"],
    ["applications", "Applications"]
  ];

  function dirtyCount() {
    return Object.keys(files).filter(function (k) { return files[k].dirty; }).length;
  }

  function renderSide() {
    var nav = document.getElementById("admin-nav");
    nav.innerHTML = TABS.map(function (t) {
      return '<button data-tab="' + t[0] + '"' + (t[0] === activeTab ? ' class="active"' : "") + ">" + t[1] + "</button>";
    }).join("");
    nav.addEventListener("click", function (e) {
      var b = e.target.closest("[data-tab]");
      if (!b) return;
      activeTab = b.getAttribute("data-tab");
      renderSide();
      renderTab(activeTab);
    });
  }

  function updateSaveBar() {
    var n = dirtyCount();
    var btn = document.getElementById("save-btn");
    var badge = document.getElementById("save-badge");
    btn.disabled = n === 0;
    btn.textContent = n === 0 ? "ALL CHANGES SAVED" : "SAVE " + n + " FILE" + (n > 1 ? "S" : "") + " TO GITHUB →";
    badge.textContent = n === 0 ? "Live" : n + " unsaved";
  }

  function head(title, extra) {
    return '<div class="admin-head"><h1>' + title + "</h1>" +
      '<div class="admin-toolbar">' + (extra || "") +
      '<button class="btn btn-yellow btn-sm" id="save-btn" disabled>ALL CHANGES SAVED</button>' +
      '<span class="chip" id="save-badge">Live</span></div></div>';
  }

  function recordList(cfg, list, tabKey) {
    return '<div class="record-list">' + list.map(function (r, i) {
      return '<div class="record-item">' +
        '<div class="ri-main"><div class="ri-title">' + esc(r[cfg.titleKey] || "(untitled)") + "</div>" +
        '<div class="ri-sub">' + esc(cfg.sub ? cfg.sub(r) : "") + "</div></div>" +
        '<div class="ri-actions">' +
        '<button class="toggle-pub ' + (r.published !== false ? "on" : "off") + '" data-i="' + i + '" data-act="pub">' + (r.published !== false ? "PUBLISHED" : "UNPUBLISHED") + "</button>" +
        (tabKey === "matches" && r.status === "scheduled"
          ? '<button class="btn btn-green btn-sm" data-i="' + i + '" data-act="livescore">LIVE SCORE</button>' +
            '<button class="btn btn-outline btn-sm" data-i="' + i + '" data-act="result">ENTER RESULT</button>' : "") +
        '<button class="btn btn-outline btn-sm" data-i="' + i + '" data-act="edit">EDIT</button>' +
        '<button class="btn btn-red btn-sm" data-i="' + i + '" data-act="del">DELETE</button>' +
        "</div></div>";
    }).join("") + "</div>";
  }

  /* ---------- goalscorer rows (select from the squad) ---------- */

  function scorerRowHtml(entry, oldMap) {
    entry = entry || {};
    var pid = entry.id || "";
    var players = (files.players && files.players.data) || [];
    var opts = '<option value="">— select player —</option>';
    players.forEach(function (p) {
      var v = p.id || "";
      opts += '<option value="' + esc(v) + '"' + (v && v === pid ? " selected" : "") + ">#" + esc(p.number || "-") + " — " + esc(p.name || "(unnamed)") + "</option>";
    });
    if (pid && !players.some(function (p) { return (p.id || "") === pid; })) {
      var nm = (oldMap[pid] && oldMap[pid].name) || pid;
      opts += '<option value="' + esc(pid) + '" selected>' + esc(nm) + " (not in current squad)</option>";
    }
    return '<div class="scorer-row">' +
      '<select class="sr-player">' + opts + "</select>" +
      '<input type="text" inputmode="numeric" class="sr-minute" placeholder="Min e.g. 34" value="' + esc(entry.minute || "") + '">' +
      '<button type="button" class="btn btn-red btn-sm sr-del">REMOVE</button>' +
      "</div>";
  }

  function openRecordModal(cfg, record, onSave, modalOpts) {
    modalOpts = modalOpts || {};
    var backdrop = document.getElementById("modal-back");
    var modal = document.getElementById("modal");
    modal.innerHTML = "<h2>" + (record.__new ? "Add " + cfg.title : "Edit " + cfg.title) + "</h2>" +
      '<div class="form-grid">' + cfg.fields.map(function (f) {
        var val = getVal(record, f.key);
        val = val == null ? "" : val;
        var inner;
        var divider = "";
        if (f.key === "liveScoreCastmog") divider = '<div class="modal-divider live">LIVE MATCH &mdash; update the score and add goalscorers DURING the match. Saving here never ends the match.</div>';
        if (f.key === "scoreCastmog") divider = '<div class="modal-divider">FULL-TIME RESULT &mdash; only fill this in AFTER the match is played. When both scores are entered, the match is automatically marked FINISHED.</div>';
        if (f.type === "scorers") {
          inner = '<div class="scorer-box" id="mf-' + f.key + '"></div>' +
            '<button type="button" class="btn btn-outline btn-sm" id="mf-' + f.key + '-add">+ ADD GOALSCORER</button>' +
            '<div class="iu-status">Pick players from your squad and add the goal minute if you know it.</div>';
          return divider + '<div class="field field-wide"><label>' + esc(f.label) + "</label>" + inner + "</div>";
        }
        if (f.type === "image") {
          inner = '<div class="iu-wrap">' +
            '<img class="iu-preview" id="mf-' + f.key + '-prev" src="' + esc(val) + '" alt=""' + (val ? "" : ' style="display:none"') + ">" +
            '<input type="text" id="mf-' + f.key + '" value="' + esc(val) + '" placeholder="Paste a URL or upload from your device">' +
            '<button type="button" class="btn btn-outline btn-sm iu-btn" data-iu="' + f.key + '" data-folder="' + (f.opts[0] || "misc") + '" data-kind="image">UPLOAD FROM DEVICE</button>' +
            '<input type="file" accept="image/*" style="display:none" id="mf-' + f.key + '-file" data-kind="image">' +
            '<div class="iu-status" id="mf-' + f.key + '-status"></div></div>';
          return divider + '<div class="field field-wide"><label>' + esc(f.label) + "</label>" + inner + "</div>";
        }
        if (f.type === "filelist") {
          inner = '<textarea id="mf-' + f.key + '" rows="3" placeholder="One entry per line — paste links or upload from your device">' + esc((val || []).join("\n")) + "</textarea>" +
            '<button type="button" class="btn btn-outline btn-sm iu-btn" data-iu="' + f.key + '" data-folder="' + (f.opts[0] || "misc") + '" data-kind="list">UPLOAD FROM DEVICE</button>' +
            '<input type="file" accept="video/*,image/*" style="display:none" id="mf-' + f.key + '-file" data-kind="list">' +
            '<div class="iu-status" id="mf-' + f.key + '-status"></div>';
          return divider + '<div class="field field-wide"><label>' + esc(f.label) + "</label>" + inner + "</div>";
        }
        if (f.type === "textarea") {
          inner = '<textarea id="mf-' + f.key + '" rows="4">' + esc(Array.isArray(val) ? val.join("\n") : val) + "</textarea>";
        } else if (f.type === "list") {
          inner = '<textarea id="mf-' + f.key + '" rows="3" placeholder="One entry per line">' + esc((val || []).join("\n")) + "</textarea>";
        } else if (f.type === "select") {
          inner = '<select id="mf-' + f.key + '">' + f.opts.map(function (o) {
            return '<option value="' + esc(o) + '"' + (String(val) === String(o) ? " selected" : "") + ">" + esc(o || "—") + "</option>";
          }).join("") + "</select>";
        } else if (f.type === "check") {
          inner = '<label class="checkbox-row"><input type="checkbox" id="mf-' + f.key + '"' + (val ? " checked" : "") + "><span>" + esc(f.label) + "</span></label>";
          return '<div class="field">' + inner + "</div>";
        } else {
          inner = '<input type="' + f.type + '" id="mf-' + f.key + '" value="' + esc(val) + '">';
        }
        return divider + '<div class="field"><label>' + esc(f.label) + "</label>" + inner + "</div>";
      }).join("") + "</div>" +
      '<div class="modal-actions">' +
      '<button class="btn btn-outline btn-sm" id="modal-cancel">CANCEL</button>' +
      '<button class="btn btn-yellow btn-sm" id="modal-save">SAVE RECORD</button></div>';

    backdrop.classList.add("open");

    /* wire device uploads */
    modal.querySelectorAll("[data-iu]").forEach(function (btn) {
      var key = btn.getAttribute("data-iu");
      var fileInput = document.getElementById("mf-" + key + "-file");
      var kind = btn.getAttribute("data-kind");
      btn.addEventListener("click", function () { fileInput.click(); });
      fileInput.addEventListener("change", function () {
        var file = fileInput.files[0];
        if (!file) return;
        uploadAsset(file, btn.getAttribute("data-folder"), function (st, msg) {
          var el = document.getElementById("mf-" + key + "-status");
          if (st === "ok") {
            el.textContent = "Uploaded \u2713 — it will go live after you press SAVE RECORD, then SAVE TO GITHUB.";
            el.className = "iu-status iu-ok";
            var target = document.getElementById("mf-" + key);
            if (kind === "image") {
              target.value = msg;
              var prev = document.getElementById("mf-" + key + "-prev");
              prev.src = msg;
              prev.style.display = "";
            } else {
              var lines = target.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
              lines.push(msg);
              target.value = lines.join("\n");
            }
          } else if (st === "busy") {
            el.textContent = msg;
            el.className = "iu-status";
          } else {
            el.textContent = msg;
            el.className = "iu-status iu-err";
          }
        });
        fileInput.value = "";
      });
    });

    /* goalscorer rows */
    var scorerBox = modal.querySelector(".scorer-box");
    var addGoalBtn = modal.querySelector("[id$='-add']");
    if (scorerBox && addGoalBtn) {
      var oldScorerMap = {};
      (Array.isArray(getVal(record, "scorers")) ? getVal(record, "scorers") : []).forEach(function (s) {
        if (s && s.id) oldScorerMap[s.id] = s;
      });
      var bindRow = function (row) {
        var del = row.querySelector(".sr-del");
        del.addEventListener("click", function () { row.remove(); });
      };
      var addScorerRow = function (entry) {
        var w = document.createElement("div");
        w.innerHTML = scorerRowHtml(entry, oldScorerMap);
        var row = w.firstChild;
        bindRow(row);
        scorerBox.appendChild(row);
      };
      (Array.isArray(getVal(record, "scorers")) ? getVal(record, "scorers") : []).forEach(addScorerRow);
      addGoalBtn.addEventListener("click", function () { addScorerRow(null); });
    }

    /* live mode: jump straight to the LIVE score fields */
    if (modalOpts.liveMode) {
      ["mf-liveScoreCastmog", "mf-liveScoreOpponent"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) { el.style.borderColor = "var(--green)"; el.style.boxShadow = "0 0 0 3px rgba(47,191,113,.25)"; }
      });
      var lsc = document.getElementById("mf-liveScoreCastmog");
      if (lsc) { lsc.focus(); lsc.scrollIntoView({ behavior: "smooth", block: "center" }); }
    }

    /* result mode: jump straight to the score fields */
    if (modalOpts.resultMode) {
      var stSel = document.getElementById("mf-status");
      if (stSel) stSel.value = "finished";
      ["mf-scoreCastmog", "mf-scoreOpponent"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) { el.style.borderColor = "var(--yellow)"; el.style.boxShadow = "0 0 0 3px rgba(251,192,45,.25)"; }
      });
      var sc = document.getElementById("mf-scoreCastmog");
      if (sc) { sc.focus(); sc.scrollIntoView({ behavior: "smooth", block: "center" }); }
    }

    document.getElementById("modal-cancel").addEventListener("click", function () {
      backdrop.classList.remove("open");
    });

    document.getElementById("modal-save").addEventListener("click", function () {
      cfg.fields.forEach(function (f) {
        if (f.type === "scorers") {
          var oldSc = {};
          (Array.isArray(getVal(record, f.key)) ? getVal(record, f.key) : []).forEach(function (s) { if (s && s.id) oldSc[s.id] = s; });
          var pById = {};
          ((files.players && files.players.data) || []).forEach(function (p) { if (p.id) pById[p.id] = p; });
          var rows = Array.prototype.slice.call(modal.querySelectorAll("#mf-" + f.key + " .scorer-row"));
          setVal(record, f.key, rows.map(function (row) {
            var sel = row.querySelector(".sr-player");
            var minEl = row.querySelector(".sr-minute");
            var pid = sel ? sel.value : "";
            if (!pid) return null;
            var p = pById[pid];
            return { id: pid, name: p ? p.name : ((oldSc[pid] && oldSc[pid].name) || pid), minute: minEl ? minEl.value.trim() : "" };
          }).filter(Boolean));
          return;
        }
        var el = document.getElementById("mf-" + f.key);
        if (!el) return;
        var v;
        if (f.type === "check") v = el.checked;
        else if (f.type === "list" || f.type === "filelist") v = el.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
        else if (f.type === "number") v = el.value === "" ? null : Number(el.value);
        else v = el.value.trim();
        setVal(record, f.key, v);
      });

      /* match result guard: no mistaken statuses */
      if (cfg.titleKey === "opponent") {
        var hasScore = record.scoreCastmog != null && record.scoreOpponent != null;
        if (record.status === "finished" && !hasScore) {
          alert("This match is marked FINISHED but the score is missing.\n\nEnter both scores, or set the status back to SCHEDULED.");
          return;
        }
        if (hasScore && record.status === "scheduled") {
          record.status = "finished";
          alert("Both scores were entered, so the match has automatically been marked FINISHED.\nIt will now move from Fixtures to Results and Match History.");
        }
      }

      onSave(record);
      backdrop.classList.remove("open");
    });
  }

  function renderCollectionTab(name) {
    var cfg = COLLECTIONS[name];
    var fileKey = name === "youtube" ? "youtube" : name;
    var list = name === "youtube" ? (files.youtube.data.videos || []) : files[name].data;
    var main = document.getElementById("admin-main");

    var note = "";
    if (name === "club") note = '<div class="admin-note">External information must stay UNPUBLISHED until you review and approve it. Drafts are hidden from the public site.</div>';
    if (name === "matches") note = '<div class="admin-note">Head-to-head records, the homepage next-match card and countdowns update automatically from the fixtures and results you enter here.</div>';
    if (name === "club") note = '<div class="admin-note">These are club facts waiting for your approval. PUBLISHED sections appear on the website immediately; DRAFT sections stay hidden (the site shows COMING SOON). Flip the PUBLISHED toggle to approve a section.</div>';
    if (name === "youtube") note = '<div class="admin-note">Turn on LIVE only while a stream is actually running — the site then shows the livestream instantly. The channel and live controls are saved together with the video list.</div>';

    main.innerHTML = head(cfg.title, '<button class="btn btn-green btn-sm" id="add-btn">+ ADD ' + (name === "youtube" ? "VIDEO" : cfg.title.toUpperCase()) + "</button>") +
      note +
      (name === "youtube" ? ytConfigPanel() : "") +
      recordList(cfg, list, name);

    document.getElementById("add-btn").addEventListener("click", function () {
      var rec = { id: "", published: true };
      if (name === "club") rec.published = false; /* new club info starts as a DRAFT */
      if (name === "youtube") rec = { title: "", youtubeId: "", date: "", featured: false };
      rec.__new = true;
      openRecordModal(cfg, rec, function (r) {
        delete r.__new;
        if (!r.id) r.id = slug(r[cfg.titleKey]) + "-" + Math.random().toString(36).slice(2, 6);
        if (name === "youtube") {
          files.youtube.data.videos = files.youtube.data.videos || [];
          files.youtube.data.videos.push(r);
          files.youtube.dirty = true;
        } else {
          files[name].data.push(r);
          files[name].dirty = true;
        }
        renderCollectionTab(name);
        updateSaveBar();
      });
    });

    var ytc = document.getElementById("yt-config-save");
    if (ytc) {
      ytc.addEventListener("click", function () {
        YT_CONFIG.forEach(function (f) {
          var el = document.getElementById("yt-" + f.key);
          setVal(files.youtube.data, f.key, f.type === "check" ? el.checked : el.value.trim());
        });
        files.youtube.dirty = true;
        updateSaveBar();
        alert("Channel / live settings saved locally — click SAVE TO GITHUB in the top bar to publish.");
      });
    }

    main.querySelectorAll("[data-act]").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = Number(b.getAttribute("data-i"));
        var act = b.getAttribute("data-act");
        var arr = name === "youtube" ? files.youtube.data.videos : files[name].data;
        if (act === "pub") {
          arr[i].published = arr[i].published === false ? true : false;
          if (name === "youtube") files.youtube.dirty = true; else files[name].dirty = true;
          renderCollectionTab(name);
          updateSaveBar();
        } else if (act === "livescore") {
          openRecordModal(cfg, JSON.parse(JSON.stringify(arr[i])), function (r) {
            arr[i] = r;
            if (name === "youtube") files.youtube.dirty = true; else files[name].dirty = true;
            renderCollectionTab(name);
            updateSaveBar();
          }, { liveMode: true });
        } else if (act === "result") {
          openRecordModal(cfg, JSON.parse(JSON.stringify(arr[i])), function (r) {
            arr[i] = r;
            if (name === "youtube") files.youtube.dirty = true; else files[name].dirty = true;
            renderCollectionTab(name);
            updateSaveBar();
          }, { resultMode: true });
        } else if (act === "edit") {
          openRecordModal(cfg, JSON.parse(JSON.stringify(arr[i])), function (r) {
            arr[i] = r;
            if (name === "youtube") files.youtube.dirty = true; else files[name].dirty = true;
            renderCollectionTab(name);
            updateSaveBar();
          });
        } else if (act === "del") {
          if (confirm("Delete this record permanently?")) {
            arr.splice(i, 1);
            if (name === "youtube") files.youtube.dirty = true; else files[name].dirty = true;
            renderCollectionTab(name);
            updateSaveBar();
          }
        }
      });
    });
    updateSaveBar();
  }

  function ytConfigPanel() {
    var data = files.youtube.data;
    var html = '<div class="form-card" style="margin-bottom:1.6rem;"><span class="motto" style="color:var(--green);">CHANNEL &amp; LIVE CONTROL</span>' +
      '<div class="form-grid" style="margin-top:1rem;">';
    YT_CONFIG.forEach(function (f) {
      var val = getVal(data, f.key);
      val = val == null ? "" : val;
      if (f.type === "check") {
        html += '<div class="field"><label>' + esc(f.label) + '</label><label class="checkbox-row"><input type="checkbox" id="yt-' + f.key + '"' + (val ? " checked" : "") + "><span>Enabled</span></label></div>";
      } else {
        html += '<div class="field"><label>' + esc(f.label) + '</label><input type="text" id="yt-' + f.key + '" value="' + esc(val) + '"></div>';
      }
    });
    html += '</div><button class="btn btn-green btn-sm" id="yt-config-save" style="margin-top:1rem;">SAVE CHANNEL / LIVE SETTINGS</button></div>';
    return html;
  }

  function renderObjectTab(name) {
    var cfg = OBJECTS[name];
    var main = document.getElementById("admin-main");
    var data = files[name].data;
    main.innerHTML = head(cfg.title) + '<div class="form-card"><div class="form-grid">' +
      cfg.fields.map(function (f) {
        var val = getVal(data, f.key);
        val = val == null ? "" : val;
        var inner;
        if (f.type === "textarea" || f.type === "list") {
          inner = '<textarea id="of-' + f.key + '" rows="3">' + esc(Array.isArray(val) ? val.join("\n") : val) + "</textarea>";
        } else if (f.type === "check") {
          return '<div class="field"><label>' + esc(f.label) + '</label><label class="checkbox-row"><input type="checkbox" id="of-' + f.key + '"' + (val ? " checked" : "") + "><span>Enabled</span></label></div>";
        } else {
          inner = '<input type="' + f.type + '" id="of-' + f.key + '" value="' + esc(val) + '">';
        }
        return '<div class="field"><label>' + esc(f.label) + "</label>" + inner + "</div>";
      }).join("") + "</div>" +
      '<button class="btn btn-yellow" id="obj-save" style="margin-top:1.4rem;">SAVE CHANGES</button></div>';

    document.getElementById("obj-save").addEventListener("click", function () {
      cfg.fields.forEach(function (f) {
        var el = document.getElementById("of-" + f.key);
        var v;
        if (f.type === "check") v = el.checked;
        else if (f.type === "list") v = el.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
        else if (f.type === "number") v = el.value === "" ? null : Number(el.value);
        else v = el.value.trim();
        setVal(files[name].data, f.key, v);
      });
      files[name].dirty = true;
      updateSaveBar();
      alert("Changes saved locally — click SAVE TO GITHUB in the top bar to publish them to the website.");
    });
    updateSaveBar();
  }

  function renderOverview() {
    var main = document.getElementById("admin-main");
    var p = files.players.data.length;
    var st = files.staff.data.length;
    var m = files.matches.data;
    var upcomingM = m.filter(function (x) { return x.status === "scheduled"; }).length;
    var results = m.filter(function (x) { return x.status === "finished"; }).length;
    var unpublished = m.concat(files.players.data, files.staff.data, files.news.data, files.achievements.data, files.media.data)
      .filter(function (x) { return x.published === false; }).length;
    var drafts = (files.club.data || []).filter(function (s) { return !s.published; }).length;

    var apps = [];
    try { apps = JSON.parse(localStorage.getItem("castmog_applications") || "[]"); } catch (e) {}

    main.innerHTML = head("Dashboard") +
      '<div class="admin-note">Welcome to the Castmog Ladies management dashboard. Everything you save here is committed to the club database and appears on the public website within a minute or two.</div>' +
      '<div class="stat-cards">' +
      stat(p, "Players") + stat(st, "Staff") + stat(upcomingM, "Upcoming matches") +
      stat(results, "Results") + stat(files.news.data.length, "News articles") +
      stat(files.media.data.length, "Media items") + stat(files.achievements.data.length, "Achievements") +
      stat(unpublished, "Unpublished records") + stat(drafts, "Drafts awaiting approval") +
      stat(apps.length, "Applications (this browser)") +
      "</div>" +
      '<div class="admin-note">Drafts awaiting approval include externally researched club information. Review it in <b>Club / Content Approval</b> and publish only what you have verified.</div>';
    updateSaveBar();
  }

  function stat(n, label) {
    return '<div class="stat-tile" style="text-align:left;padding:1.2rem 1.4rem;"><b>' + Number(n || 0) + "</b><span>" + label + "</span></div>";
  }

  function renderApplications() {
    var main = document.getElementById("admin-main");
    var apps = [];
    try { apps = JSON.parse(localStorage.getItem("castmog_applications") || "[]"); } catch (e) {}
    main.innerHTML = head("Applications") +
      '<div class="admin-note">Applications are submitted through the website and delivered to the club on WhatsApp. Payment is by bank transfer (any bank in the world can send to the account) and verified with the payment receipt the applicant sends in the WhatsApp chat. This tab lists applications submitted from <b>this browser only</b> — the authoritative record is the WhatsApp chat with the club number.</div>' +
      (apps.length ? recordList({ titleKey: "name", sub: function (r) { return r.ref + " · " + (r.position || "") + " · " + (r.status || ""); } }, apps) : '<div class="empty-state">No applications from this browser yet.</div>');
    updateSaveBar();
  }

  function renderTab(tab) {
    if (tab === "overview") return renderOverview();
    if (tab === "applications") return renderApplications();
    if (tab === "training" || tab === "settings") return renderObjectTab(tab);
    return renderCollectionTab(tab);
  }

  document.addEventListener("DOMContentLoaded", function () {
    init();
    // delegated handlers — the toolbar buttons are re-created on every tab render
    document.addEventListener("click", function (e) {
      var sb = e.target.closest("#save-btn");
      if (sb) {
        var btn = document.getElementById("save-btn");
        var dirty = Object.keys(files).filter(function (k) { return files[k].dirty; });
        if (!dirty.length) return;
        btn.disabled = true;
        btn.textContent = "SAVING…";
        var chain = Promise.resolve();
        dirty.forEach(function (name) {
          chain = chain.then(function () { return saveFile(name); });
        });
        chain.then(function () { updateSaveBar(); alert("Saved! The public website will reflect the changes within a minute or two."); })
          .catch(function (err) {
            var m = String((err && err.message) || err);
            var friendly;
            if (/401|Bad credentials/i.test(m)) {
              friendly = "Your GitHub token has expired or been revoked. Click LOG OUT, then sign in again with a fresh fine-grained token (Contents: Read and Write on the Castmog-Ladies repository).";
            } else if (/403|not accessible/i.test(m)) {
              friendly = "Your token can view the database but does not have WRITE permission. Create a fine-grained token with Contents: Read and Write for the Castmog-Ladies repository, log out, and sign in with it.";
            } else if (/409|sha|does not match/i.test(m)) {
              friendly = "The database changed since you opened the dashboard (someone saved elsewhere, or it was updated). Refresh the page, re-enter your change, and save again.";
            } else {
              friendly = m + " — if this keeps happening, refresh the page and try again.";
            }
            alert("SAVE FAILED: " + friendly);
            updateSaveBar();
          });
        return;
      }
      if (e.target.closest("#logout-btn")) {
        localStorage.removeItem("castmog_admin_token");
        location.reload();
      }
    });
  });
})();
