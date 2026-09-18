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
        F("social.instagram", "Instagram link or @handle"),
        F("social.x", "X (Twitter) link or @handle"),
        F("social.tiktok", "TikTok link or @handle"),
        F("social.facebook", "Facebook link or @handle"),
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
        F("highlight", "MATCH HIGHLIGHT \u2014 upload the video from your device, or paste a YouTube link", "media", ["matches"]),
        F("report", "Match report", "textarea"), F("lineup", "Starting lineup", "list"),
        F("subs", "Substitutes", "list"), F("events", "Match events", "list"),
        F("photos", "Match photo URLs", "list"), F("videos", "Match video IDs/URLs", "list"),
        F("notes", "Notes", "textarea")
      ]
    },
    news: {
      title: "News", titleKey: "title", sub: function (r) { return (r.category || "") + " · " + (r.date || ""); },
      fields: [
        F("title", "Title"), F("image", "Featured image", "image", ["news"]),
        F("body", "Body", "textarea"), F("category", "Category"),
        F("author", "Author"), F("date", "Date", "date"), F("seoDescription", "SEO description", "textarea")
      ]
    },
    achievements: {
      title: "Achievements", titleKey: "trophy", sub: function (r) { return r.year || ""; },
      fields: [
        F("trophy", "Trophy / competition name"), F("year", "Year"), F("description", "Description", "textarea"),
        F("image", "TROPHY IMAGE \u2014 upload the cup photo from your device, or paste a link", "image", ["achievements"]), F("category", "Category"), F("source", "Source")
      ]
    },
    media: {
      title: "Media", titleKey: "caption", sub: function (r) { return r.type + " · " + (r.category || ""); },
      fields: [
        F("caption", "Caption"), F("type", "Type", "select", ["photo", "video", "youtube"]),
        F("category", "Category", "select", ["photos", "videos", "training", "match-highlights", "interviews", "news", "youtube"]),
        F("url", "Photo / video URL — upload from your device or paste a link", "media", ["media"]), F("youtubeId", "YouTube video ID"), F("thumb", "Thumbnail URL"),
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
        F("notes", "Notes", "textarea"),
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
        F("social.facebook", "Facebook URL"), F("social.tiktok", "TikTok URL"), F("social.twitter", "X/Twitter URL"),
        F("alertText", "IMPORTANT ALERT — moving gold banner on every page (leave empty to hide)", "textarea"),
        F("launch.enabled", "LAUNCH EXPERIENCE ON/OFF — show the coming-soon launch screen on the homepage", "select", ["true", "false"]),
        F("launch.date", "LAUNCH DATE & TIME (tap the field to open the calendar) — the website goes live automatically at this moment, in your local time. Until then visitors see the launch screen with the live countdown.", "datetime-local"),
        F("launch.headline", "LAUNCH SCREEN — headline (e.g. THE NEXT CHAPTER STARTS HERE)"),
        F("launch.sub", "LAUNCH SCREEN — sub-line (e.g. OFFICIAL WEBSITE LAUNCH)"),
        F("launch.btnComing", "LAUNCH SCREEN — button text before launch"),
        F("launch.welcome", "LAUNCH MOMENT — welcome text shown when the countdown ends"),
        F("launch.logo", "LAUNCH SCREEN — logo image (default: the club crest)", "image", ["settings"])
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

  /* datetime-local helpers: store absolute ISO, edit in the admin's local time */
  function dtLocalVal(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes());
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
    ["matches", "Matches"], ["news", "News"], ["media", "Media"], ["interviews", "Interviews"],
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
        if (f.type === "media") {
          inner = '<div class="iu-wrap">' +
            '<input type="text" id="mf-' + f.key + '" value="' + esc(val) + '" placeholder="Paste a link (YouTube / image / video URL) or upload from your device">' +
            '<button type="button" class="btn btn-outline btn-sm iu-btn" data-iu="' + f.key + '" data-folder="' + (f.opts[0] || "misc") + '" data-kind="media">UPLOAD FROM DEVICE</button>' +
            '<input type="file" accept="video/*,image/*" style="display:none" id="mf-' + f.key + '-file" data-kind="media">' +
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
        } else if (f.type === "datetime-local") {
          inner = '<input type="datetime-local" id="mf-' + f.key + '" value="' + esc(dtLocalVal(val)) + '">';
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
            } else if (kind === "media") {
              target.value = msg;
              var typeSel = document.getElementById("mf-type");
              if (typeSel) {
                if (file.type.indexOf("video") === 0) typeSel.value = "video";
                else if (file.type.indexOf("image") === 0) typeSel.value = "photo";
              }
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
        else if (f.type === "datetime-local") v = el.value === "" ? null : new Date(el.value).toISOString();
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
      (name === "news" ? '<div id="news-subs-mount"></div>' : "") +
      (name === "youtube" ? ytConfigPanel() : "") +
      recordList(cfg, list, name);

    if (name === "news") renderNewsSubs();

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
        } else if (f.type === "select") {
          inner = '<select id="of-' + f.key + '">' + f.opts.map(function (o) {
            return '<option value="' + esc(o) + '"' + (String(val) === String(o) ? " selected" : "") + ">" + esc(o) + "</option>";
          }).join("") + "</select>";
        } else if (f.type === "datetime-local") {
          inner = '<input type="datetime-local" id="of-' + f.key + '" value="' + esc(dtLocalVal(val)) + '">';
        } else if (f.type === "image") {
          inner = '<div class="iu-wrap">' +
            '<img class="iu-preview" id="of-' + f.key + '-prev" src="' + esc(val) + '" alt=""' + (val ? "" : ' style="display:none"') + ">" +
            '<input type="text" id="of-' + f.key + '" value="' + esc(val) + '" placeholder="Paste a URL or upload from your device">' +
            '<button type="button" class="btn btn-outline btn-sm iu-btn" data-iu="' + f.key + '" data-folder="' + (f.opts[0] || "misc") + '" data-kind="image">UPLOAD FROM DEVICE</button>' +
            '<input type="file" accept="image/*" style="display:none" id="of-' + f.key + '-file" data-kind="image">' +
            '<div class="iu-status" id="of-' + f.key + '-status"></div></div>';
        } else {
          inner = '<input type="' + f.type + '" id="of-' + f.key + '" value="' + esc(val) + '">';
        }
        return '<div class="field"><label>' + esc(f.label) + "</label>" + inner + "</div>";
      }).join("") + "</div>" +
      '<button class="btn btn-yellow" id="obj-save" style="margin-top:1.4rem;">SAVE CHANGES</button>' +
      (name === "training"
        ? weeklyScheduleSection() + "</div>" + trainingGallerySection()
        : name === "settings" ? heroSlideshowSection() : "</div>");

    document.getElementById("obj-save").addEventListener("click", function () {
      cfg.fields.forEach(function (f) {
        var el = document.getElementById("of-" + f.key);
        var v;
        if (f.type === "check") v = el.checked;
        else if (f.type === "list") v = el.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
        else if (f.type === "number") v = el.value === "" ? null : Number(el.value);
        else if (f.type === "datetime-local") v = el.value === "" ? null : new Date(el.value).toISOString();
        else v = el.value.trim();
        setVal(files[name].data, f.key, v);
      });
      if (name === "training" && document.getElementById("wk-list")) files.training.data.weekly = readWeekly();
      files[name].dirty = true;
      updateSaveBar();
      alert("Changes saved locally — click SAVE TO GITHUB in the top bar to publish them to the website.");
    });
    /* wire device uploads for the of- fields (e.g. launch logo, page banner) */
    main.querySelectorAll("[data-iu]").forEach(function (btn) {
      var key = btn.getAttribute("data-iu");
      var fileInput = document.getElementById("of-" + key + "-file");
      btn.addEventListener("click", function () { fileInput.click(); });
      fileInput.addEventListener("change", function () {
        var file = fileInput.files[0];
        if (!file) return;
        uploadAsset(file, btn.getAttribute("data-folder"), function (st, msg) {
          var el = document.getElementById("of-" + key + "-status");
          if (st === "ok") {
            el.textContent = "Uploaded \u2713 — it will go live after you press SAVE CHANGES, then SAVE TO GITHUB.";
            el.className = "iu-status iu-ok";
            var target = document.getElementById("of-" + key);
            target.value = msg;
            var prev = document.getElementById("of-" + key + "-prev");
            prev.src = msg;
            prev.style.display = "";
          } else if (st === "busy") {
            el.textContent = msg;
            el.className = "iu-status";
          } else {
            el.textContent = msg;
            el.className = "iu-status iu-err";
          }
        });
      });
    });
    wireTrainingGallery(name);
    if (name === "training") {
      var wkAdd = document.getElementById("wk-add");
      if (wkAdd) wkAdd.addEventListener("click", function () {
        files.training.data.weekly = readWeekly();
        files.training.data.weekly.push({ day: "MONDAY", time: "", location: "", type: "" });
        files.training.dirty = true;
        renderObjectTab("training");
      });
      document.querySelectorAll("#wk-list .wk-del").forEach(function (b) {
        b.addEventListener("click", function () {
          var rows = readWeekly();
          rows.splice(Number(b.closest(".wk-row").getAttribute("data-wk")), 1);
          files.training.data.weekly = rows;
          files.training.dirty = true;
          renderObjectTab("training");
          updateSaveBar();
        });
      });
    }
    if (name === "settings") wireHeroGallery();
    updateSaveBar();
  }

  function wireHeroGallery() {
    var status = document.getElementById("hero-status");
    if (!status) return;
    function pushHeroItem(file, url) {
      files.media.data.push({
        id: "hero-" + Math.random().toString(36).slice(2, 8),
        type: file.type.indexOf("video") === 0 ? "video" : "photo",
        category: "hero",
        url: url,
        thumb: url,
        caption: "",
        date: new Date().toISOString().slice(0, 10),
        featured: false,
        published: true
      });
      files.media.dirty = true;
    }
    /* sequential upload of EVERY picked file */
    function uploadMany(list, i, done) {
      if (i >= list.length) { done(); return; }
      status.className = "iu-status";
      status.textContent = "Uploading " + (i + 1) + " of " + list.length + "…";
      uploadAsset(list[i], "hero", function (st, msg) {
        if (st === "ok") pushHeroItem(list[i], msg);
        else if (st === "err") { status.className = "iu-status iu-err"; status.textContent = msg; }
        uploadMany(list, i + 1, done);
      });
    }
    function hook(fileBtnId, fileInputId) {
      var btn = document.getElementById(fileBtnId);
      var inp = document.getElementById(fileInputId);
      if (!btn || !inp) return;
      btn.addEventListener("click", function () { inp.click(); });
      inp.addEventListener("change", function () {
        var picked = Array.prototype.slice.call(inp.files);
        if (!picked.length) return;
        uploadMany(picked, 0, function () {
          status.className = "iu-status iu-ok";
          status.textContent = "Uploaded ✓ — click SAVE TO GITHUB in the top bar to publish.";
          renderObjectTab("settings");
          updateSaveBar();
        });
        inp.value = "";
      });
    }
    hook("hero-photo-btn", "hero-photo-file");
    hook("hero-video-btn", "hero-video-file");
    var addRec = document.getElementById("hero-add-record");
    if (addRec) addRec.addEventListener("click", function () {
      var url = prompt("Paste the photo or video URL (or a YouTube link):");
      if (!url || !url.trim()) return;
      var ytMatch = url.match(/v=([\w-]{6,})/) || url.match(/youtu\.be\/([\w-]{6,})/) || [];
      var isYt = !!ytMatch[1];
      var isVideo = isYt || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
      files.media.data.push({
        id: "hero-" + Math.random().toString(36).slice(2, 8),
        type: isVideo ? "video" : "photo",
        category: "hero",
        url: url.trim(),
        thumb: url.trim(),
        caption: "",
        youtubeId: isYt ? ytMatch[1] : "",
        date: new Date().toISOString().slice(0, 10),
        featured: false,
        published: true
      });
      files.media.dirty = true;
      renderObjectTab("settings");
      updateSaveBar();
    });
    document.querySelectorAll("[data-heroid]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-heroid");
        var act = b.getAttribute("data-act");
        var idx = -1;
        for (var i = 0; i < files.media.data.length; i++) { if (files.media.data[i].id === id) { idx = i; break; } }
        if (idx < 0) return;
        if (act === "herodelete") {
          if (!confirm("Remove this from the homepage slideshow?")) return;
          files.media.data.splice(idx, 1);
          files.media.dirty = true;
          renderObjectTab("settings");
          updateSaveBar();
        } else if (act === "heroedit") {
          var cap = prompt("Caption (optional):", files.media.data[idx].caption || "");
          if (cap === null) return;
          files.media.data[idx].caption = cap.trim();
          files.media.dirty = true;
          renderObjectTab("settings");
          updateSaveBar();
        }
      });
    });
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

    main.innerHTML = head("Dashboard") +
      '<div class="admin-note">Welcome to the Castmog Ladies management dashboard. Everything you save here is committed to the club database and appears on the public website within a minute or two.</div>' +
      '<div class="stat-cards">' +
      stat(p, "Players") + stat(st, "Staff") + stat(upcomingM, "Upcoming matches") +
      stat(results, "Results") + stat(files.news.data.length, "News articles") +
      stat(files.media.data.length, "Media items") + stat(files.achievements.data.length, "Achievements") +
      stat(unpublished, "Unpublished records") + stat(drafts, "Drafts awaiting approval") +
      '<div class="stat-tile" style="text-align:left;padding:1.2rem 1.4rem;"><b id="ov-apps">…</b><span>Applications</span></div>' +
      "</div>" +
      '<div class="admin-note">Drafts awaiting approval include externally researched club information. Review it in <b>Club / Content Approval</b> and publish only what you have verified.</div>';
    updateSaveBar();
    appApi("castmogAppList").then(function (res) {
      var el = document.getElementById("ov-apps");
      if (el) el.textContent = res && res.ok ? (res.apps || []).length : "?";
    }).catch(function () {
      var el = document.getElementById("ov-apps");
      if (el) el.textContent = "?";
    });
  }

  function stat(n, label) {
    return '<div class="stat-tile" style="text-align:left;padding:1.2rem 1.4rem;"><b>' + Number(n || 0) + "</b><span>" + label + "</span></div>";
  }

  /* ---------- Community news submissions (public posts awaiting approval) ---------- */

  function renderNewsSubs() {
    var mount = document.getElementById("news-subs-mount");
    if (!mount) return;
    mount.innerHTML = '<div class="admin-note">Loading community story submissions…</div>';
    appApi("castmogNewsList").then(function (res) {
      if (!mount.isConnected) return;
      if (!res || !res.ok) { mount.innerHTML = ""; return; }
      var subs = (res.subs || []).filter(function (s) { return (s.status || "pending") === "pending"; });
      if (!subs.length) { mount.innerHTML = ""; return; }
      mount.innerHTML =
        '<h3 style="font-family:var(--font-head);text-transform:uppercase;letter-spacing:0.12em;color:var(--yellow);margin:0.4rem 0 0.6rem;">COMMUNITY SUBMISSIONS &mdash; AWAITING YOUR APPROVAL (' + subs.length + ")</h3>" +
        '<div class="admin-note">These stories were posted by the public through the website&rsquo;s POST A STORY form. Nothing goes on the website until you approve it here.</div>' +
        subs.map(function (s, i) {
          return '<div class="app-card" style="border:1px solid var(--line);border-radius:12px;padding:1rem 1.2rem;margin-bottom:0.9rem;background:rgba(255,255,255,0.02);">' +
            '<div style="display:flex;flex-wrap:wrap;gap:0.4rem 1rem;align-items:center;">' +
            '<b style="font-family:var(--font-head);">' + esc(s.title || "Untitled story") + "</b>" +
            '<span class="chip chip-yellow">' + esc(s.category || "Community") + "</span>" +
            '<span style="color:var(--muted);font-size:0.82rem;">by ' + esc(s.name || "Anonymous") + (s.contact ? " · " + esc(s.contact) : "") + " · " + esc(String(s.created_date || "").slice(0, 10)) + "</span>" +
            "</div>" +
            (s.imageUrl ? '<img src="' + esc(s.imageUrl) + '" alt="" style="margin-top:0.7rem;max-width:280px;width:100%;border-radius:8px;border:1px solid var(--line);">' : "") +
            '<p style="margin:0.7rem 0 0;color:rgba(244,247,241,0.85);font-size:0.9rem;white-space:pre-wrap;">' + esc(String(s.body || "").slice(0, 600)) + (String(s.body || "").length > 600 ? "…" : "") + "</p>" +
            '<div style="display:flex;gap:0.7rem;margin-top:0.9rem;flex-wrap:wrap;">' +
            '<button class="btn btn-green btn-sm" data-ns-approve="' + esc(s.id) + '">APPROVE &amp; ADD TO NEWS</button>' +
            '<button class="btn btn-outline btn-sm" style="border-color:rgba(224,69,69,.5);color:#fca5a5;" data-ns-reject="' + esc(s.id) + '">REJECT</button>' +
            "</div></div>";
        }).join("") +
        '<div class="admin-note" style="margin-bottom:1.4rem;">Approving a story adds it to your News list below — then press <b>SAVE TO GITHUB</b> in the top bar to publish it to the website.</div>';

      mount.querySelectorAll("[data-ns-approve]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = this.getAttribute("data-ns-approve");
          var s = subs.filter(function (x) { return x.id === id; })[0];
          if (!s) return;
          files.news.data.push({
            id: slug(s.title || "story") + "-" + Math.random().toString(36).slice(2, 6),
            title: String(s.title || ""),
            image: String(s.imageUrl || ""),
            body: String(s.body || ""),
            category: String(s.category || "Community"),
            author: String(s.name || "Community correspondent"),
            date: new Date().toISOString().slice(0, 10),
            seoDescription: String(s.body || "").slice(0, 150)
          });
          files.news.dirty = true;
          updateSaveBar();
          appApi("castmogNewsUpdate", { id: id, status: "approved" }).then(function () {
            renderCollectionTab("news");
          });
        });
      });

      mount.querySelectorAll("[data-ns-reject]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = this.getAttribute("data-ns-reject");
          if (!confirm("Reject this story? It will not appear on the website.")) return;
          appApi("castmogNewsUpdate", { id: id, status: "rejected" }).then(function () { renderNewsSubs(); });
        });
      });
    }).catch(function () { mount.innerHTML = ""; });
  }

  /* ---------- Applications & Payments (live server register) ---------- */

  var APPS_API = "https://superagent-e3f5b6f2.base44.app/functions/";
  var APP_STATUSES = ["Payment pending", "Payment received", "Payment verified", "Under review", "Further assessment", "Accepted", "Not selected"];

  function appApi(fn, body) {
    var token = localStorage.getItem("castmog_admin_token") || "";
    return fetch(APPS_API + fn, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-castmog-admin": token },
      body: JSON.stringify(body || {})
    }).then(function (r) { return r.json(); });
  }

  /* Normalize a Nigerian/local phone to wa.me international format */
  function waPhone(ph) {
    var d = String(ph || "").replace(/[^0-9+]/g, "");
    if (d.indexOf("+") === 0) d = d.slice(1);
    if (/^0[1-9]\d{9}$/.test(d)) d = "234" + d.slice(1);
    return d;
  }

  function waMessage(x) {
    var name = (x.name || "").split(" ")[0] || "there";
    var ref = x.ref || "";
    if (x.status === "Accepted") {
      return "Hello " + name + ", congratulations! Your application to Castmog Ladies Football Academy has been ACCEPTED. "
        + "Your reference is " + ref + ". Our team will contact you shortly with your enrollment details. "
        + "Training holds Monday to Friday from 7:00 AM. Welcome to the Castmog family!";
    }
    if (x.paymentVerified) {
      return "Hello " + name + ", good news — your application payment to Castmog Ladies Football Academy has been confirmed. "
        + "Your reference is " + ref + ". Your application now moves into our review stage and our team will contact you about the next steps.";
    }
    return "Hello " + name + ", thank you for your application to Castmog Ladies Football Academy. Your reference is " + ref + ".";
  }

  /* applicant photo thumbnail + CV link (files live in private storage,
     signed URLs are generated fresh by castmogAppList on every load) */
  function appFilesHtml(x) {
    var h = "";
    if (x.photoUrl) {
      h += '<a href="' + esc(x.photoUrl) + '" target="_blank" rel="noopener" title="Open the full photo in a new tab" style="display:inline-flex;gap:0.6rem;align-items:center;text-decoration:none;">' +
        '<img src="' + esc(x.photoUrl) + '" alt="Player photo" style="width:62px;height:62px;object-fit:cover;border-radius:10px;border:1px solid var(--line);">' +
        '<span class="btn btn-outline btn-sm" style="pointer-events:none;">VIEW PHOTO</span></a>';
    }
    if (x.cvUrl) {
      h += '<a href="' + esc(x.cvUrl) + '" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="text-decoration:none;">OPEN CV' + (x.cvName ? " (" + esc(String(x.cvName).split(".").pop().toUpperCase()) + ")" : "") + "</a>";
    }
    if (!h) return "";
    return '<div style="display:flex;flex-wrap:wrap;gap:0.8rem;align-items:center;margin-top:0.6rem;">' + h + "</div>";
  }

  function appRowHtml(x) {
    var st = x.status || "Payment received";
    var stColor = st === "Accepted" ? "var(--green)" : st === "Not selected" ? "var(--red)" : st === "Payment verified" || st === "Under review" || st === "Further assessment" ? "var(--yellow)" : "var(--muted)";
    return '<div class="app-card" style="border:1px solid var(--line);border-radius:12px;padding:1rem 1.2rem;margin-bottom:0.9rem;background:rgba(255,255,255,0.02);">' +
      '<div style="display:flex;flex-wrap:wrap;gap:0.5rem 1rem;align-items:center;">' +
      '<b style="font-family:var(--font-head);">' + esc(x.ref || "") + "</b>" +
      '<span style="font-weight:700;">' + esc(x.name || "") + "</span>" +
      '<span style="color:var(--muted);font-size:0.85rem;">' + esc(x.position || "") + " · " + esc(String(x.created_date || "").slice(0, 10)) + "</span>" +
      (x.source === "manual" ? '<span class="chip">MANUAL</span>' : "") +
      (x.whatsappSent ? '<span class="chip" style="background:rgba(74,222,128,0.15);color:var(--green);border-color:rgba(74,222,128,0.4);">\u2713 MSG SENT</span>' : "") +
      '<span style="margin-left:auto;font-weight:800;color:' + stColor + ';">' + esc(st) + "</span></div>" +
      '<div style="color:var(--muted);font-size:0.85rem;margin-top:0.35rem;">' +
      "PHONE: " + esc(x.phone || "—") +
      (x.email ? " · EMAIL: " + esc(x.email) : "") +
      " · PAYMENT REF: " + esc(x.paymentRef || "—") +
      (x.fee ? " · FEE: \u20A6" + esc(x.fee) : "") + "</div>" +
      appFilesHtml(x) +
      '<div style="display:flex;flex-wrap:wrap;gap:0.8rem;align-items:center;margin-top:0.7rem;">' +
      '<label style="display:flex;gap:0.35rem;align-items:center;font-size:0.85rem;cursor:pointer;"><input type="checkbox" data-id="' + esc(x.id) + '" data-k="receiptReceived"' + (x.receiptReceived ? " checked" : "") + '> Receipt received</label>' +
      '<label style="display:flex;gap:0.35rem;align-items:center;font-size:0.85rem;cursor:pointer;"><input type="checkbox" data-id="' + esc(x.id) + '" data-k="paymentVerified"' + (x.paymentVerified ? " checked" : "") + '> Payment verified</label>' +
      '<select data-id="' + esc(x.id) + '" data-k="status" style="padding:0.4rem 0.6rem;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--fg);font-size:0.85rem;">' +
      APP_STATUSES.map(function (s) { return '<option' + (s === st ? " selected" : "") + ">" + s + "</option>"; }).join("") + "</select>" +
      '<button class="btn btn-outline btn-sm" data-id="' + esc(x.id) + '" data-act="notes"' + (x.notes ? ' style="border-color:var(--yellow);"' : "") + "'>" + (x.notes ? "NOTES \u2713" : "NOTES") + "</button>" +
      '<button class="btn btn-green btn-sm" data-id="' + esc(x.id) + '" data-act="whatsapp" data-phone="' + esc(waPhone(x.phone)) + '" data-msg="' + esc(waMessage(x)) + '">WHATSAPP THE APPLICANT</button>' +
      '<button class="btn btn-outline btn-sm" data-id="' + esc(x.id) + '" data-name="' + esc(x.name || "") + '" data-act="delete">DELETE</button>' +
      "</div>" +
      '<div class="app-notes-box" data-id="' + esc(x.id) + '" style="display:none;margin-top:0.7rem;">' +
      '<textarea data-id="' + esc(x.id) + '" data-k="notes" rows="2" placeholder="Notes (e.g. receipt checked against bank statement, assessment notes)\u2026" style="width:100%;padding:0.5rem;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--fg);">' + esc(x.notes || "") + "</textarea>" +
      '<button class="btn btn-yellow btn-sm" data-id="' + esc(x.id) + '" data-act="savenotes" style="margin-top:0.4rem;">SAVE NOTES</button></div>' +
      "</div>";
  }

  function renderAppsList(apps) {
    var box = document.getElementById("apps-status");
    var counts = {
      total: apps.length,
      received: apps.filter(function (x) { return ["Payment received", "Payment verified"].indexOf(x.status) >= 0 || x.paymentVerified; }).length,
      verified: apps.filter(function (x) { return x.paymentVerified; }).length,
      accepted: apps.filter(function (x) { return x.status === "Accepted"; }).length
    };
    box.innerHTML =
      '<div style="display:flex;gap:0.8rem;flex-wrap:wrap;margin-bottom:1.2rem;">' +
      stat(counts.total, "Applications") + stat(counts.received, "Payments received") +
      stat(counts.verified, "Verified") + stat(counts.accepted, "Accepted") + "</div>" +
      '<div style="margin-bottom:0.8rem;"><button class="btn btn-outline btn-sm" id="apps-add">+ ADD APPLICATION (MANUAL)</button> ' +
      '<button class="btn btn-outline btn-sm" id="apps-refresh">REFRESH</button></div>' +
      '<div id="apps-addform" style="display:none;border:1px dashed var(--line);border-radius:12px;padding:1rem;margin-bottom:1.2rem;">' +
      '<b style="font-family:var(--font-head);">LOG A PAYMENT MANUALLY</b>' +
      '<p style="color:var(--muted);font-size:0.85rem;">For applicants who paid directly to the account without using the website.</p>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0.7rem;">' +
      '<input id="af-name" placeholder="Full name *" style="padding:0.55rem;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--fg);">' +
      '<input id="af-phone" placeholder="Phone / WhatsApp" style="padding:0.55rem;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--fg);">' +
      '<input id="af-email" placeholder="Email (optional)" style="padding:0.55rem;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--fg);">' +
      '<input id="af-ref" placeholder="Application ref" style="padding:0.55rem;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--fg);">' +
      '<input id="af-paymentref" placeholder="Payment receipt / transaction ref" style="padding:0.55rem;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--fg);">' +
      '<input id="af-position" placeholder="Position" style="padding:0.55rem;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--fg);">' +
      '<input id="af-fee" placeholder="Fee paid (\u20A6)" style="padding:0.55rem;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--fg);"></div>' +
      '<button class="btn btn-green btn-sm" id="af-save" style="margin-top:0.8rem;">SAVE APPLICATION</button></div>' +
      (apps.length ? apps.map(appRowHtml).join("") : '<div class="empty-state">No applications yet. When someone completes the website application flow after payment, they will appear here automatically.</div>');

    document.getElementById("apps-add").addEventListener("click", function () {
      var f = document.getElementById("apps-addform");
      f.style.display = f.style.display === "none" ? "block" : "none";
    });
    document.getElementById("apps-refresh").addEventListener("click", function () { renderApplications(); });
    document.getElementById("af-save").addEventListener("click", function () {
      var name = document.getElementById("af-name").value.trim();
      if (!name) { alert("Enter the applicant\u2019s name."); return; }
      appApi("castmogAppUpdate", {
        action: "create",
        record: {
          name: name,
          phone: document.getElementById("af-phone").value.trim(),
          email: document.getElementById("af-email").value.trim(),
          ref: document.getElementById("af-ref").value.trim(),
          paymentRef: document.getElementById("af-paymentref").value.trim(),
          position: document.getElementById("af-position").value.trim(),
          fee: document.getElementById("af-fee").value.trim(),
          status: "Payment received",
          receiptReceived: false,
          paymentVerified: false,
          notes: ""
        }
      }).then(function (r) {
        if (r.ok) { if (r.info && r.info.length) alert(r.info.join(". ") + "."); renderApplications(); }
        else alert(r.error || "Could not save.");
      });
    });

    box.addEventListener("change", function (e) {
      var t = e.target;
      var id = t.getAttribute("data-id");
      if (!id) return;
      var patch = {};
      patch[t.getAttribute("data-k")] = t.type === "checkbox" ? t.checked : t.value;
      appApi("castmogAppUpdate", Object.assign({ id: id }, patch)).then(function (r) {
        if (r.ok) { if (r.info && r.info.length) alert(r.info.join(". ") + "."); renderApplications(); }
        else { alert(r.error || "Could not update."); renderApplications(); }
      });
    });
    box.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      if (!btn) return;
      var id = btn.getAttribute("data-id");
      if (btn.getAttribute("data-act") === "delete") {
        if (!confirm("Delete the application for " + (btn.getAttribute("data-name") || "this applicant") + "?")) return;
        appApi("castmogAppUpdate", { action: "delete", id: id }).then(function () { renderApplications(); });
      } else if (btn.getAttribute("data-act") === "notes") {
        var nb = box.querySelector('.app-notes-box[data-id="' + id + '"]');
        if (nb) nb.style.display = nb.style.display === "none" ? "block" : "none";
      } else if (btn.getAttribute("data-act") === "savenotes") {
        var ta = box.querySelector('textarea[data-id="' + id + '"]');
        appApi("castmogAppUpdate", { id: id, notes: ta ? ta.value : "" }).then(function (r) {
          if (r.ok) renderApplications(); else alert(r.error || "Could not save.");
        });
      } else if (btn.getAttribute("data-act") === "whatsapp") {
        var ph = btn.getAttribute("data-phone");
        var msg = btn.getAttribute("data-msg");
        if (!ph) { alert("No phone number on file for this applicant — add it via ADD APPLICATION or the record notes."); return; }
        window.open("https://wa.me/" + ph + "?text=" + encodeURIComponent(msg), "_blank");
        appApi("castmogAppUpdate", { id: id, whatsappSent: true }).then(function (r) {
          if (r.ok) renderApplications(); else alert(r.error || "Could not mark as sent.");
        });
      }
    });
  }

  /* ---------- INTERVIEWS (media items with category "interviews") ---------- */
  function interviewThumbHtml(r) {
    if (r.type === "youtube" && r.youtubeId) return '<img src="https://i.ytimg.com/vi/' + esc(r.youtubeId) + '/hqdefault.jpg" alt="" style="width:120px;height:68px;object-fit:cover;border-radius:8px;border:1px solid var(--line);">';
    if (r.thumb || r.url) return '<img src="' + esc(r.thumb || r.url) + '" alt="" style="width:120px;height:68px;object-fit:cover;border-radius:8px;border:1px solid var(--line);">';
    return '<span class="chip">NO THUMB</span>';
  }

  function renderInterviews() {
    var main = document.getElementById("admin-main");
    var cfg = COLLECTIONS.media;
    var items = (files.media.data || []).filter(function (r) { return (r.category || "") === "interviews"; });
    main.innerHTML = head("Interviews", '<button class="btn btn-green btn-sm" id="iv-add">+ ADD INTERVIEW</button>') +
      '<div class="admin-note">Player and coach interviews added here appear on the Media page under <b>INTERVIEWS</b>. In the form you can tap <b>UPLOAD FROM DEVICE</b> for a video file, paste a video link, or enter a YouTube video ID. Remember: SAVE RECORD, then SAVE TO GITHUB.</div>' +
      (items.length ? '<div style="display:flex;flex-direction:column;gap:.7rem;margin-top:1rem;">' + items.map(function (r) {
        return '<div style="display:flex;flex-wrap:wrap;gap:.8rem;align-items:center;border:1px solid var(--line);border-radius:12px;padding:.7rem .9rem;background:rgba(255,255,255,0.02);">' +
          interviewThumbHtml(r) +
          '<div style="flex:1;min-width:180px;"><b>' + esc(r.caption || "Untitled interview") + "</b><br>" +
          '<span style="color:var(--muted);font-size:.8rem;">' + esc(r.type || "video") + (r.published === false ? " · DRAFT (hidden from the site)" : "") + "</span></div>" +
          '<button class="btn btn-outline btn-sm" data-act="edit" data-ivid="' + esc(r.id) + '">EDIT</button>' +
          '<button class="btn btn-outline btn-sm" data-act="delete" data-ivid="' + esc(r.id) + '">DELETE</button></div>';
      }).join("") + "</div>" : '<div class="empty-state" style="margin-top:1rem;">No interviews yet — tap <b>ADD INTERVIEW</b> to publish your first one.</div>');

    document.getElementById("iv-add").addEventListener("click", function () {
      var rec = { id: "interview-" + Math.random().toString(36).slice(2, 6), published: true, type: "video", category: "interviews" };
      rec.__new = true;
      openRecordModal(cfg, rec, function (r) {
        delete r.__new;
        files.media.data.push(r);
        files.media.dirty = true;
        renderInterviews();
        updateSaveBar();
      });
    });

    main.querySelectorAll("[data-ivid]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-ivid");
        var act = b.getAttribute("data-act");
        var idx = -1;
        for (var i = 0; i < files.media.data.length; i++) { if (files.media.data[i].id === id) { idx = i; break; } }
        if (idx < 0) return;
        if (act === "delete") {
          if (!confirm("Delete this interview?")) return;
          files.media.data.splice(idx, 1);
          files.media.dirty = true;
          renderInterviews();
          updateSaveBar();
        } else if (act === "edit") {
          openRecordModal(cfg, JSON.parse(JSON.stringify(files.media.data[idx])), function (r) {
            files.media.data[idx] = r;
            files.media.dirty = true;
            renderInterviews();
            updateSaveBar();
          });
        }
      });
    });
  }

  /* ---------- WEEKLY TRAINING SCHEDULE (day / time / location / type) ---------- */
  var WEEK_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

  function weeklyScheduleSection() {
    var wk = (files.training.data && Array.isArray(files.training.data.weekly)) ? files.training.data.weekly : [];
    if (!wk.length) wk = [{ day: "", time: "", location: "", type: "" }];
    var rows = wk.map(function (r, i) {
      return '<div class="wk-row" data-wk="' + i + '" style="display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;">' +
        '<select class="wk-day" style="flex:0 0 130px;">' +
        WEEK_DAYS.map(function (d) { return '<option value="' + d + '"' + (r.day === d ? " selected" : "") + ">" + d + "</option>"; }).join("") +
        "</select>" +
        '<input type="text" class="wk-time" placeholder="7:00 AM" value="' + esc(r.time || "") + '" style="flex:0 0 90px;">' +
        '<input type="text" class="wk-loc" placeholder="Location" value="' + esc(r.location || "") + '" style="flex:1 1 150px;">' +
        '<input type="text" class="wk-type" placeholder="Training type" value="' + esc(r.type || "") + '" style="flex:1 1 120px;">' +
        '<button type="button" class="btn btn-outline btn-sm wk-del">✕</button>' +
        "</div>";
    }).join("");
    return '<div class="form-card" style="margin-top:1.4rem;">' +
      '<h3 style="font-family:var(--font-head);letter-spacing:.05em;margin:0 0 .4rem;">WEEKLY SCHEDULE</h3>' +
      '<div class="admin-note" style="margin:0 0 .8rem;">Set the time, location and training type for each day. Rows you leave empty are hidden from the public schedule.</div>' +
      '<div style="display:flex;flex-direction:column;gap:.6rem;" id="wk-list">' + rows + "</div>" +
      '<button type="button" class="btn btn-outline btn-sm" id="wk-add" style="margin-top:.8rem;">+ ADD DAY</button>' +
      "</div>";
  }

  function readWeekly() {
    var out = [];
    document.querySelectorAll("#wk-list .wk-row").forEach(function (row) {
      var v = function (c) { return row.querySelector(c).value.trim(); };
      out.push({ day: v(".wk-day"), time: v(".wk-time"), location: v(".wk-loc"), type: v(".wk-type") });
    });
    return out;
  }

  /* ---------- HOMEPAGE SLIDESHOW (the big changing images & videos) ---------- */
  function heroSlideshowSection() {
    var items = (files.media.data || []).filter(function (r) { return (r.category || "") === "hero"; });
    var listHtml = items.length ? items.map(function (r) {
      var isPhoto = r.type === "photo";
      return '<div style="display:flex;flex-wrap:wrap;gap:.7rem;align-items:center;border:1px solid var(--line);border-radius:10px;padding:.55rem .7rem;background:rgba(255,255,255,0.02);">' +
        '<img src="' + esc(r.thumb || r.url) + '" alt="" style="width:74px;height:48px;object-fit:cover;border-radius:6px;border:1px solid var(--line);">' +
        '<div style="flex:1;min-width:140px;font-size:.85rem;"><b>' + esc(r.caption || (isPhoto ? "Hero photo" : "Hero video")) + "</b><br>" +
        '<span style="color:var(--muted);font-size:.75rem;">' + esc(isPhoto ? "photo" : "video") + " · shows in the big homepage slideshow" + "</span></div>" +
        '<button class="btn btn-outline btn-sm" data-act="heroedit" data-heroid="' + esc(r.id) + '">EDIT</button>' +
        '<button class="btn btn-outline btn-sm" data-act="herodelete" data-heroid="' + esc(r.id) + '">DELETE</button></div>';
    }).join("") : '<div class="empty-state" style="margin-top:.8rem;">No hero items yet — the homepage currently uses your MEDIA gallery photos and videos. Upload photos/videos here to take full control of the big changing slideshow.</div>';
    return '<div class="form-card" style="margin-top:1.4rem;">' +
      '<h3 style="font-family:var(--font-head);letter-spacing:.05em;margin:0 0 .4rem;">HOMEPAGE SLIDESHOW</h3>' +
      '<div class="admin-note" style="margin:0 0 .8rem;">These are the big changing images and videos at the top of the homepage (and every page hero). Hold-select to upload <b>several files at once</b>.</div>' +
      '<button type="button" class="btn btn-yellow btn-sm" id="hero-photo-btn">+ UPLOAD PHOTO(S)</button> ' +
      '<button type="button" class="btn btn-yellow btn-sm" id="hero-video-btn">+ UPLOAD VIDEO(S)</button> ' +
      '<button type="button" class="btn btn-outline btn-sm" id="hero-add-record">ADD BY LINK</button>' +
      '<input type="file" accept="image/*" id="hero-photo-file" multiple style="display:none">' +
      '<input type="file" accept="video/*" id="hero-video-file" multiple style="display:none">' +
      '<div class="iu-status" id="hero-status" style="margin-top:.6rem;"></div>' +
      '<div style="display:flex;flex-direction:column;gap:.6rem;margin-top:1rem;" id="hero-list">' + listHtml + "</div></div>";
  }

  /* ---------- TRAINING GALLERY (photos & videos uploaded from the Training tab) ---------- */
  function trainingGallerySection() {
    var items = (files.media.data || []).filter(function (r) { return (r.category || "") === "training"; });
    var listHtml = items.length ? items.map(function (r) {
      var isPhoto = r.type === "photo";
      return '<div style="display:flex;flex-wrap:wrap;gap:.7rem;align-items:center;border:1px solid var(--line);border-radius:10px;padding:.55rem .7rem;background:rgba(255,255,255,0.02);">' +
        '<img src="' + esc(r.thumb || r.url) + '" alt="" style="width:74px;height:48px;object-fit:cover;border-radius:6px;border:1px solid var(--line);">' +
        '<div style="flex:1;min-width:140px;font-size:.85rem;"><b>' + esc(r.caption || (isPhoto ? "Training photo" : "Training video")) + "</b><br>" +
        '<span style="color:var(--muted);font-size:.75rem;">' + esc(isPhoto ? "photo" : "video") + " · shows on the MEDIA page under TRAINING" + (r.type === "video" ? " · joins the homepage hero slideshow" : "") + "</span></div>" +
        '<button class="btn btn-outline btn-sm" data-act="tgedit" data-tgid="' + esc(r.id) + '">EDIT</button>' +
        '<button class="btn btn-outline btn-sm" data-act="tgdelete" data-tgid="' + esc(r.id) + '">DELETE</button></div>';
    }).join("") : '<div class="empty-state" style="margin-top:.8rem;">No training photos or videos yet.</div>';
    return '</div>' +
      '<div class="form-card" style="margin-top:1.4rem;">' +
      '<h3 style="font-family:var(--font-head);letter-spacing:.05em;margin:0 0 .4rem;">TRAINING GALLERY</h3>' +
      '<div class="admin-note" style="margin:0 0 .8rem;">Upload training photos and videos here — they appear on the Media page under <b>TRAINING</b>, and uploaded videos also join the homepage hero slideshow. Click SAVE TO GITHUB afterwards to publish.</div>' +
      '<button type="button" class="btn btn-yellow btn-sm" id="tg-photo-btn">+ UPLOAD TRAINING PHOTO</button> ' +
      '<button type="button" class="btn btn-yellow btn-sm" id="tg-video-btn">+ UPLOAD TRAINING VIDEO</button>' +
      '<input type="file" accept="image/*" id="tg-photo-file" multiple style="display:none">' +
      '<input type="file" accept="video/*" id="tg-video-file" multiple style="display:none">' +
      '<div class="iu-status" id="tg-status" style="margin-top:.6rem;"></div>' +
      '<div style="display:flex;flex-direction:column;gap:.6rem;margin-top:1rem;" id="tg-list">' + listHtml + "</div></div>";
  }

  /* returns the open div so renderObjectTab can close it correctly */
  function wireTrainingGallery(name) {
    if (name !== "training") return;
    var status = document.getElementById("tg-status");
    function pushMediaItem(file, url) {
      files.media.data.push({
        id: "training-" + Math.random().toString(36).slice(2, 6),
        type: file.type.indexOf("video") === 0 ? "video" : "photo",
        category: "training",
        url: url,
        thumb: url,
        caption: "",
        date: new Date().toISOString().slice(0, 10),
        featured: false,
        published: true
      });
      files.media.dirty = true;
    }
    function hook(fileBtnId, fileInputId) {
      var btn = document.getElementById(fileBtnId);
      var inp = document.getElementById(fileInputId);
      if (!btn || !inp) return;
      btn.addEventListener("click", function () { inp.click(); });
      inp.addEventListener("change", function () {
        var picked = Array.prototype.slice.call(inp.files);
        if (!picked.length) return;
        inp.setAttribute("multiple", "multiple");
        var okCount = 0;
        function uploadNext(i) {
          if (i >= picked.length) {
            status.textContent = "Uploaded \u2713 " + okCount + " file" + (okCount > 1 ? "s" : "") + " — click SAVE TO GITHUB in the top bar to publish.";
            status.className = "iu-status iu-ok";
            renderObjectTab(name);
            updateSaveBar();
            return;
          }
          status.className = "iu-status";
          status.textContent = "Uploading " + (i + 1) + " of " + picked.length + "\u2026";
          uploadAsset(picked[i], "training", function (st, msg) {
            if (st === "ok") { pushMediaItem(picked[i], msg); okCount++; }
            else if (st === "err") { status.className = "iu-status iu-err"; status.textContent = msg; }
            uploadNext(i + 1);
          });
        }
        uploadNext(0);
        inp.value = "";
      });
    }
    hook("tg-photo-btn", "tg-photo-file");
    hook("tg-video-btn", "tg-video-file");

    document.querySelectorAll("[data-tgid]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-tgid");
        var act = b.getAttribute("data-act");
        var idx = -1;
        for (var i = 0; i < files.media.data.length; i++) { if (files.media.data[i].id === id) { idx = i; break; } }
        if (idx < 0) return;
        if (act === "tgdelete") {
          if (!confirm("Delete this training photo/video?")) return;
          files.media.data.splice(idx, 1);
          files.media.dirty = true;
          renderObjectTab(name);
          updateSaveBar();
        } else if (act === "tgedit") {
          openRecordModal(COLLECTIONS.media, JSON.parse(JSON.stringify(files.media.data[idx])), function (r) {
            files.media.data[idx] = r;
            files.media.dirty = true;
            renderObjectTab(name);
            updateSaveBar();
          });
        }
      });
    });
  }

  function renderApplications() {
    var main = document.getElementById("admin-main");
    main.innerHTML = head("Applications & Payments") +
      '<div class="admin-note">When you tick <b>Payment verified</b> or set a status to <b>Accepted</b>, tap <b>WHATSAPP THE APPLICANT</b> on their card — the confirmation message is already typed for you and the card is marked with a <b>\u2713 MSG SENT</b> chip.<br>Every website application lands here automatically the moment the applicant pays and submits — including their payment reference, player photo and football CV (tap VIEW PHOTO / OPEN CV on the card). Verify the payment against your bank statement, tick <b>Payment verified</b> when the money lands, and move the status along as you review. Applicants also send their receipt to the club WhatsApp; use <b>ADD APPLICATION</b> to log payments that arrive without the website (direct bank transfers).</div>' +
      '<div id="apps-status" style="padding:0.5rem 0;">Loading applications\u2026</div>';
    updateSaveBar();
    appApi("castmogAppList").then(function (res) {
      if (!res || res.ok !== true) throw new Error((res && res.error) || "Could not load applications.");
      renderAppsList(res.apps || []);
    }).catch(function (err) {
      var el = document.getElementById("apps-status");
      el.innerHTML = '<div class="empty-state">Could not load the applications register: ' + esc(String(err.message || err)) +
        '<br><br>If this keeps failing, your login token may have expired — log out and sign in again.<br><br><button class="btn btn-outline btn-sm" id="apps-retry">RETRY</button></div>';
      document.getElementById("apps-retry").addEventListener("click", function () { renderApplications(); });
    });
  }

  function renderTab(tab) {
    if (tab === "overview") return renderOverview();
    if (tab === "interviews") return renderInterviews();
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
