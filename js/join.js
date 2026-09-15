/* =====================================================
   JOIN CASTMOG — 4-step application workflow
   1 PLAYER APPLICATION  →  2 REVIEW  →  3 PAYMENT  →
   4 APPLICATION RECEIVED (unique CAST-2026-XXXX reference)
   Payment details are rendered ONLY in step 3.
   ===================================================== */

(function () {
  "use strict";
  var C = window.CLUB;

  var state = {
    step: 1,
    data: {},
    ref: ""
  };

  /* files picked this session (File objects cannot survive a page reload) */
  var picked = { photo: null, cv: null };

  var POSITIONS = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];

  function $(id) { return document.getElementById(id); }

  function loadDraft() {
    try { var d = JSON.parse(localStorage.getItem("castmog_join_draft") || "null"); if (d) state.data = d; } catch (e) {}
    /* attached files cannot be restored after a reload — the applicant re-picks them */
    delete state.data.photoName; delete state.data.cvName;
  }

  function saveDraft() {
    try { localStorage.setItem("castmog_join_draft", JSON.stringify(state.data)); } catch (e) {}
  }

  function collectForm() {
    var d = state.data;
    ["fullName", "dob", "phone", "email", "location", "position",
     "foot", "previousClub", "experience", "currentTeam", "highlightLink", "paymentRef"
    ].forEach(function (k) {
      var el = $(k);
      if (el) d[k] = el.value.trim();
    });
    d.terms = $("terms") ? $("terms").checked : false;
    if (picked.photo) d.photoName = picked.photo.name;
    if (picked.cv) d.cvName = picked.cv.name;
    saveDraft();
  }

  function showError(msg) {
    var e = $("join-error");
    e.textContent = msg;
    e.classList.add("show");
    e.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function clearError() {
    var e = $("join-error");
    e.classList.remove("show");
  }

  function ageFromDob(dob) {
    var d = new Date(dob);
    if (isNaN(d)) return -1;
    var now = new Date();
    var age = now.getFullYear() - d.getFullYear();
    var m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  }

  function validateStep1() {
    var d = state.data;
    if (!d.fullName || d.fullName.length < 3) return "Please enter your full name.";
    var age = ageFromDob(d.dob);
    if (!d.dob) return "Please enter your date of birth.";
    if (age < 17) return "Applications are open to players aged 17 and above. You cannot apply if you are under 17.";
    if (age > 120) return "Please check your date of birth.";
    if (!d.phone || d.phone.replace(/\D/g, "").length < 7) return "Please enter a valid phone / WhatsApp number.";
    if (!d.email || !/^\S+@\S+\.\S+$/.test(d.email)) return "Please enter a valid email address.";
    if (!d.location) return "Please enter where you are located (e.g. Abeokuta, Ogun State).";
    if (!d.position) return "Please select your position.";
    if (d.foot === "" ) return "Please select your preferred foot.";
    if (!d.previousClub) return "Please enter your most recent club — type 'None' if you have never played for a club.";
    if (!d.experience) return "Please select your experience level.";
    if (!d.currentTeam) return "Please enter your current team — type 'None' if you are not with a team right now.";
    if (!picked.photo) return "Please attach a clear player photo (tap the upload box to choose one).";
    if (!picked.cv) return "Please attach your football CV (PDF or Word — tap the upload box to choose one).";
    if (d.highlightLink && !/^https?:\/\/\S+$/i.test(d.highlightLink)) return "Your highlight video link must be a full URL starting with http:// or https://.";
    if (!$("terms") || !$("terms").checked) return "Please confirm the declaration before continuing.";
    return "";
  }

  /* ---------- renderers ---------- */

  function stepsBar(current) {
    var labels = ["1 &middot; APPLICATION", "2 &middot; REVIEW", "3 &middot; PAYMENT", "4 &middot; RECEIVED"];
    return '<div class="steps">' + labels.map(function (l, i) {
      var n = i + 1;
      var cls = n === current ? "active" : n < current ? "done" : "";
      return '<div class="step-pill ' + cls + '">' + l + "</div>";
    }).join("") + "</div>";
  }

  function niceLabel(id) {
    return id.replace(/([a-z])([A-Z])/g, "$1 $2").toUpperCase();
  }

  function fieldHtml(id, label, inner, req, hint) {
    return '<div class="field"><label for="' + id + '">' + label + (req ? ' <span class="req">*</span>' : "") + "</label>" + inner +
      (hint ? '<p class="field-hint">' + hint + "</p>" : "") + "</div>";
  }

  function input(id, type, placeholder, val, req, hint) {
    return fieldHtml(id, niceLabel(id),
      '<input type="' + type + '" id="' + id + '" placeholder="' + (placeholder || "") + '" value="' + C.esc(val || "") + '"' + (type === "date" || type === "file" ? "" : ' maxlength="120"') + ">",
      req, hint);
  }

  function select(id, options, val, req, hint) {
    var opts = ['<option value="">Select&hellip;</option>'].concat((options || []).map(function (o) {
      return '<option value="' + C.esc(o) + '"' + (val === o ? " selected" : "") + ">" + C.esc(o) + "</option>";
    }));
    return fieldHtml(id, niceLabel(id), '<div class="select-wrap"><select id="' + id + '">' + opts.join("") + "</select></div>", req, hint);
  }

  var UT_ICONS = {
    photo: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2l1-1.6h6.6l1 1.6h1.2A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-8Z"/><circle cx="12" cy="12.3" r="3.4"/></svg>',
    cv: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 2.8h8L19 8v11.5A2.7 2.7 0 0 1 16.3 22H6a2.7 2.7 0 0 1-2.7-2.7V5.5A2.7 2.7 0 0 1 6 2.8Z"/><path d="M14 3v5h5"/><path d="M8.5 13h7M8.5 16.5h7"/></svg>'
  };

  function uploadTile(id, label, accept, hint) {
    var isImage = id === "photo";
    return '<div class="field"><label>' + label + ' <span class="req">*</span></label>' +
      '<div class="upload-tile" id="ut-' + id + '">' +
      '<input type="file" id="' + id + '" accept="' + accept + '" hidden>' +
      '<div class="ut-empty" id="ut-' + id + '-empty">' +
      '<span class="ut-icon">' + UT_ICONS[id] + "</span>" +
      '<span class="ut-copy"><b>TAP TO UPLOAD</b><small>' + hint + "</small></span>" +
      '<span class="ut-cta">BROWSE</span>' +
      "</div>" +
      '<div class="ut-filled" id="ut-' + id + '-filled" style="display:none;">' +
      (isImage ? '<img class="ut-thumb" id="ut-' + id + '-thumb" alt="">' : '<span class="ut-icon ut-ok">' + UT_ICONS.cv + "</span>") +
      '<span class="ut-copy"><b id="ut-' + id + '-fname"></b><small id="ut-' + id + '-fsize"></small></span>' +
      '<span class="ut-cta ut-change">CHANGE</span>' +
      "</div></div>" +
      "</div>";
  }

  function wireUploadTile(id) {
    var tile = $("ut-" + id);
    var input = $(id);
    if (!tile || !input) return;
    tile.addEventListener("click", function (e) {
      if (e.target === input) return;
      input.click();
    });
    input.addEventListener("change", function () {
      var f = input.files && input.files[0];
      if (!f) return;
      picked[id] = f;
      state.data[id + "Name"] = f.name;
      saveDraft();
      $("ut-" + id + "-empty").style.display = "none";
      $("ut-" + id + "-filled").style.display = "flex";
      $("ut-" + id + "-fname").textContent = f.name;
      $("ut-" + id + "-fsize").textContent =
        (f.size > 1048576 ? (f.size / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(f.size / 1024)) + " KB") +
        " attached — tap to change";
      if (id === "photo") {
        var thumb = $("ut-photo-thumb");
        if (thumb) { thumb.src = URL.createObjectURL(f); }
      }
      clearError();
    });
  }

  function renderStep1() {
    var d = state.data;
    $("join-steps").innerHTML = stepsBar(1);
    $("join-body").innerHTML =
      '<h2 class="section-title" style="font-size:1.5rem;">PLAYER APPLICATION</h2>' +
      '<p class="section-sub">Complete the form below to apply to join Castmog Ladies. Fields marked <span style="color:var(--yellow);font-weight:800;">*</span> are required.</p>' +
      '<div class="form-card"><div class="form-grid">' +
      '<h3 style="color:var(--yellow);font-size:1.15rem;letter-spacing:0.08em;">PERSONAL INFORMATION</h3>' +
      '<div class="grid grid-2" style="gap:1.2rem;">' +
      input("fullName", "text", "Your full name", d.fullName, true) +
      input("dob", "date", "", d.dob, true, "Applicants must be aged 17 or above.") +
      input("phone", "tel", "e.g. 0913 052 7339", d.phone, true) +
      input("email", "email", "you@example.com", d.email, true) +
      input("location", "text", "e.g. Abeokuta, Ogun State", d.location, true) +
      "</div>" +
      '<h3 style="color:var(--yellow);font-size:1.15rem;letter-spacing:0.08em;margin-top:0.6rem;">FOOTBALL INFORMATION</h3>' +
      '<div class="grid grid-2" style="gap:1.2rem;">' +
      select("position", POSITIONS, d.position, true) +
      select("foot", ["Left", "Right", "Both"], d.foot, true) +
      input("previousClub", "text", "Most recent club — if none, type 'None'", d.previousClub, true) +
      select("experience", ["Beginner", "Amateur", "Semi-professional", "Professional"], d.experience, true) +
      input("currentTeam", "text", "Current team — if none, type 'None'", d.currentTeam, true) +
      "</div>" +
      '<h3 style="color:var(--yellow);font-size:1.15rem;letter-spacing:0.08em;margin-top:0.6rem;">UPLOADS &amp; LINKS</h3>' +
      '<div class="grid grid-2" style="gap:1.2rem;">' +
      uploadTile("photo", "PLAYER PHOTO", "image/*", "A clear recent photo of yourself (JPG or PNG). You will also send it to the club on WhatsApp after submitting.") +
      uploadTile("cv", "FOOTBALL CV", ".pdf,.doc,.docx", "Your football CV as a PDF or Word document.") +
      input("highlightLink", "url", "https://youtu.be/your-highlight-video", d.highlightLink, false, "Link to your highlight video (YouTube etc.) — optional.") +
      "</div>" +
      '<label class="checkbox-row" style="margin-top:0.6rem;"><input type="checkbox" id="terms"><span>I confirm the information provided is true and accurate, and I consent to Castmog Ladies contacting me about my application.</span></label>' +
      '<div><button class="btn btn-yellow btn-block" id="to-review">CONTINUE TO REVIEW &rarr;</button></div>' +
      "</div></div>";
    wireUploadTile("photo");
    wireUploadTile("cv");
    $("to-review").addEventListener("click", function () {
      clearError();
      collectForm();
      var err = validateStep1();
      if (err) { showError(err); return; }
      state.step = 2;
      renderStep2();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  var REVIEW_ROWS = [
    ["Full name", "fullName"],
    ["Date of birth", "dob"],
    ["Age", "_age"],
    ["Phone / WhatsApp", "phone"],
    ["Email", "email"],
    ["Location", "location"],
    ["Position", "position"],
    ["Preferred foot", "foot"],
    ["Previous club", "previousClub"],
    ["Experience level", "experience"],
    ["Current team", "currentTeam"],
    ["Player photo", "photoName"],
    ["Football CV", "cvName"],
    ["Highlight video", "highlightLink"]
  ];

  function renderStep2() {
    var d = state.data;
    $("join-steps").innerHTML = stepsBar(2);
    var rows = REVIEW_ROWS.filter(function (r) { return r[1] === "_age" || d[r[1]]; }).map(function (r) {
      var v = r[1] === "_age" ? ageFromDob(d.dob) : d[r[1]];
      return "<tr><th>" + r[0] + "</th><td>" + C.esc(v) + "</td></tr>";
    }).join("");
    $("join-body").innerHTML =
      '<h2 class="section-title" style="font-size:1.5rem;">REVIEW YOUR APPLICATION</h2>' +
      '<p class="section-sub">Please check your details carefully before continuing.</p>' +
      '<div class="form-card">' +
      '<table class="review-table"><tbody>' + rows + "</tbody></table>" +
      '<div style="display:flex;gap:1rem;flex-wrap:wrap;">' +
      '<button class="btn btn-outline" id="back-edit">&larr; EDIT APPLICATION</button>' +
      '<button class="btn btn-yellow" id="to-payment" style="flex:1;">CONTINUE TO PAYMENT &rarr;</button>' +
      "</div></div>";
    $("back-edit").addEventListener("click", function () { state.step = 1; renderStep1(); window.scrollTo({ top: 0 }); });
    $("to-payment").addEventListener("click", function () { state.step = 3; renderStep3(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  function renderStep3() {
    var S = C.get("settings") || {};
    var fee = S.applicationFee || 50000;
    var pp = S.palmpay || {};
    $("join-steps").innerHTML = stepsBar(3);
    $("join-body").innerHTML =
      '<h2 class="section-title" style="font-size:1.5rem;">APPLICATION PAYMENT</h2>' +
      '<p class="section-sub">Your application is complete. To submit it for review, pay the one-time application fee.</p>' +
      '<div class="form-card pay-box">' +
      '<span class="motto">APPLICATION FEE</span>' +
      '<div class="pay-amount">&#8358;' + Number(fee).toLocaleString() + "</div>" +
      '<div class="pay-details">' +
      '<div class="pd-row"><span>Pay from</span><b>ANY BANK</b></div>' +
      '<div class="pd-row"><span>Account number</span><b>' + C.esc(pp.number || "") + "</b></div>" +
      '<div class="pd-row"><span>Account name</span><b>' + C.esc(pp.name || "") + "</b></div>" +
      "</div>" +
      '<p style="color:var(--muted);font-size:0.85rem;max-width:560px;margin:0 auto 0.8rem;">Transfer the exact application fee to the account above from <b>any bank</b> &mdash; every Nigerian bank app, USSD transfer or ATM transfer works, and it also works from abroad. After payment, keep your receipt: you will enter its reference below and send the receipt itself to the club on WhatsApp.</p>' +
      '<p style="color:var(--muted);font-size:0.85rem;max-width:560px;margin:0 auto 1.4rem;">Paying from outside Nigeria and your bank cannot send to this account? <a href="' + C.waLink("Hello Castmog Ladies, I want to apply and I am paying the application fee from outside Nigeria. Please send me the right transfer details for my country.") + '" target="_blank" rel="noopener" style="color:var(--yellow);font-weight:700;">Message us on WhatsApp</a> and we will send you the correct transfer details for your country.</p>' +
      '<div style="max-width:460px;margin:0 auto;text-align:left;">' +
      fieldHtml("paymentRef", "PAYMENT RECEIPT / TRANSACTION REFERENCE", '<input type="text" id="paymentRef" placeholder="Transaction ID, session ID or receipt number" maxlength="60" value="' + C.esc(state.data.paymentRef || "") + '">', false, "From your bank's payment receipt or confirmation message. Also take a screenshot of the receipt &mdash; you will send it in the next step.") +
      "</div>" +
      '<div style="display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;margin-top:0.6rem;">' +
      '<button class="btn btn-outline" id="back-review">&larr; BACK</button>' +
      '<button class="btn btn-yellow" id="confirm-payment">I HAVE PAID &mdash; SUBMIT APPLICATION</button>' +
      "</div></div>";
    $("back-review").addEventListener("click", function () { state.step = 2; renderStep2(); window.scrollTo({ top: 0 }); });
    $("confirm-payment").addEventListener("click", async function () {
      clearError();
      collectForm();
      var pr = state.data.paymentRef || "";
      if (pr.replace(/\s/g, "").length < 6) { showError("Please enter the transaction reference from your payment receipt so the club can verify your payment."); return; }
      var btn = $("confirm-payment");
      btn.disabled = true; btn.textContent = "UPLOADING PHOTO & CV\u2026";
      var files = { photoUri: "", cvUri: "", photoName: state.data.photoName || "", cvName: state.data.cvName || "" };
      for (var k of [["photo", "photoUri"], ["cv", "cvUri"]]) {
        try { if (picked[k[0]]) files[k[1]] = await uploadAppFile(k[0], picked[k[0]]); } catch (e) { /* never block the application */ }
      }
      finalize(files);
    });
  }

  function makeRef() {
    var year = new Date().getFullYear();
    var seq = parseInt(localStorage.getItem("castmog_app_seq") || "0", 10) + 1;
    localStorage.setItem("castmog_app_seq", String(seq));
    return "CAST-" + year + "-" + String(seq).padStart(4, "0");
  }

  /* --- applicant photo + CV upload (private club storage) ------------------ */
  var UPLOAD_URL = "https://superagent-e3f5b6f2.base44.app/functions/castmogAppUpload";

  /* shrink big phone photos before upload: max 1200px JPEG */
  function compressPhoto(file) {
    return new Promise(function (resolve) {
      try {
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function () {
          try {
            var max = 1200, w = img.naturalWidth, h = img.naturalHeight;
            var k = Math.min(1, max / Math.max(w, h));
            var cv = document.createElement("canvas");
            cv.width = Math.max(1, Math.round(w * k)); cv.height = Math.max(1, Math.round(h * k));
            cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
            URL.revokeObjectURL(url);
            cv.toBlob(function (b) { resolve(b && b.size && b.size < file.size ? new File([b], (file.name || "photo.jpg").replace(/\.[^.]*$/, "") + ".jpg", { type: "image/jpeg" }) : file); }, "image/jpeg", 0.85);
          } catch (e) { resolve(file); }
        };
        img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
        img.src = url;
      } catch (e) { resolve(file); }
    });
  }

  function fileToB64(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(",")[1]); };
      r.onerror = function () { reject(new Error("Could not read the file.")); };
      r.readAsDataURL(file);
    });
  }

  async function uploadAppFile(kind, file) {
    var f = kind === "photo" ? await compressPhoto(file) : file;
    if (f.size > 8 * 1024 * 1024) throw new Error(kind === "photo" ? "Your photo is too large (max 8MB after processing)." : "Your CV is larger than 8MB — please attach a smaller file.");
    var data = await fileToB64(f);
    var r = await fetch(UPLOAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: kind, name: f.name || (kind + ".jpg"), data: data })
    });
    var j = null; try { j = await r.json(); } catch (e) {}
    if (!j || !j.ok || !j.uri) throw new Error((j && j.error) || "Upload failed");
    return j.uri;
  }

  /* every completed application lands in the club's admin dashboard automatically */
  function sendToDashboard(ref, d, files) {
    files = files || {};
    try {
      var S = C.get("settings") || {};
      fetch("https://superagent-e3f5b6f2.base44.app/functions/castmogAppSubmit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref: ref,
          name: d.fullName || "",
          phone: d.phone || "",
          email: d.email || "",
          position: d.position || "",
          dob: d.dob || "",
          location: d.location || "",
          paymentRef: d.paymentRef || "",
          fee: String(S.applicationFee || ""),
          source: "website",
          photoUri: files.photoUri || "",
          cvUri: files.cvUri || "",
          photoName: files.photoName || "",
          cvName: files.cvName || ""
        })
      }).catch(function () {});
    } catch (e) { /* never block the application on this */ }
  }

  function finalize(files) {
    files = files || {};
    state.ref = makeRef();
    sendToDashboard(state.ref, state.data, files);
    var apps = [];
    try { apps = JSON.parse(localStorage.getItem("castmog_applications") || "[]"); } catch (e) {}
    apps.push({
      ref: state.ref,
      submitted: new Date().toISOString(),
      name: state.data.fullName,
      position: state.data.position,
      phone: state.data.phone,
      email: state.data.email,
      paymentRef: state.data.paymentRef,
      status: "Paid / Pending Club Confirmation"
    });
    try { localStorage.setItem("castmog_applications", JSON.stringify(apps)); } catch (e) {}
    localStorage.removeItem("castmog_join_draft");
    state.step = 4;
    renderStep4();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderStep4() {
    var S = C.get("settings") || {};
    var d = state.data;
    $("join-steps").innerHTML = stepsBar(4);

    var msg =
      "CASTMOG LADIES — NEW APPLICATION\n\n" +
      "Reference: " + state.ref + "\n\n" +
      "FULL NAME: " + (d.fullName || "") + "\n" +
      "DATE OF BIRTH: " + (d.dob || "") + "\n" +
      "PHONE/WHATSAPP: " + (d.phone || "") + "\n" +
      "EMAIL: " + (d.email || "") + "\n" +
      "LOCATION: " + (d.location || "") + "\n\n" +
      "POSITION: " + (d.position || "") + "\n" +
      "PREFERRED FOOT: " + (d.foot || "") + "\n" +
      "PREVIOUS CLUB: " + (d.previousClub || "") + "\n" +
      "EXPERIENCE: " + (d.experience || "") + "\n" +
      "CURRENT TEAM: " + (d.currentTeam || "") + "\n" +
      "HIGHLIGHT VIDEO: " + (d.highlightLink || "") + "\n\n" +
      "APPLICATION FEE: PAID (BANK TRANSFER)\n" +
      "PAYMENT REFERENCE: " + (d.paymentRef || "") + "\n" +
      "PAYMENT RECEIPT: to be sent in this chat\n\n" +
      (d.photoName ? "PLAYER PHOTO: attached to this application (" + d.photoName + ")\n" : "") +
      (d.cvName ? "FOOTBALL CV: attached to this application (" + d.cvName + ")\n" : "") +
      "This application was submitted through the Castmog Ladies website.";

    $("join-body").innerHTML =
      '<div class="form-card pay-box">' +
      '<span class="motto" style="color:var(--green);">APPLICATION RECEIVED</span>' +
      '<h2 style="font-family:var(--font-head);font-size:2rem;text-transform:uppercase;margin:0.5rem 0;">YOUR APPLICATION HAS BEEN SUBMITTED</h2>' +
      '<div class="ref-banner"><span class="motto" style="color:var(--muted);">APPLICATION REFERENCE</span><div class="rb-ref">' + state.ref + "</div></div>" +
      '<p style="color:var(--muted);max-width:560px;margin:0 auto 1.6rem;">Your application has been successfully received. Our team will review it and contact you using the information provided. Keep your reference safe.</p>' +
      '<div style="display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;">' +
      '<a class="btn btn-green" href="' + C.waLink(msg) + '" target="_blank" rel="noopener">SEND APPLICATION TO THE CLUB ON WHATSAPP &rarr;</a>' +
      '<a class="btn btn-outline" href="index.html">BACK TO HOME</a>' +
      "</div>" +
      '<p style="color:var(--muted);font-size:0.78rem;margin-top:1.4rem;">' +
      (d.photoName || d.cvName ? "Your photo and CV (" + [d.photoName, d.cvName].filter(Boolean).join(", ") + ") have been attached to your application — the club can view them in its dashboard. " : "") +
      "Please also send your <b>payment receipt</b> (screenshot or photo of your bank confirmation) in the WhatsApp chat — the club verifies it before confirming your application status.</p>" +
      "</div>";
  }

  loadDraft();
  window.CLUB.onReady(function () { renderStep1(); });
})();
