/* =====================================================
   CASTMOG LADIES FOOTBALL ACADEMY — player application
   Pure JavaScript: validation, 17+ age enforcement,
   CM-2026-XXXX reference generation, WhatsApp submit.
   ===================================================== */

(function () {
  "use strict";

  var ACADEMY_WHATSAPP = "2349130527339"; // 0913 052 7339 in international format
  var MINIMUM_AGE = 17;

  var form = document.getElementById("applyForm");
  if (!form) return;

  var errorBox = document.getElementById("formError");
  var successBox = document.getElementById("formSuccess");

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.add("show");
    errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function hideError() {
    errorBox.classList.remove("show");
  }

  // ---------- Age validation ----------
  function calculateAge(dobString) {
    var dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    var today = new Date();
    var age = today.getFullYear() - dob.getFullYear();
    var monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  function validateAge(dobString) {
    var age = calculateAge(dobString);
    if (age === null) return "Please enter a valid date of birth.";
    if (age < MINIMUM_AGE) {
      return "You must be at least 17 years old to apply to Castmog Ladies Football Academy.";
    }
    return null; // no error
  }

  // ---------- Reference generation: CM-2026-XXXX ----------
  function generateReference() {
    var number = Math.floor(1000 + Math.random() * 9000); // 4 digits
    return "CM-2026-" + number;
  }

  // ---------- "not registered" / "no previous club" checkboxes ----------
  var currentClubInput = document.getElementById("currentClub");
  var noClubCheck = document.getElementById("noClub");
  if (currentClubInput && noClubCheck) {
    noClubCheck.addEventListener("change", function () {
      currentClubInput.disabled = noClubCheck.checked;
      if (noClubCheck.checked) currentClubInput.value = "";
    });
  }

  var prevClubInput = document.getElementById("previousClub");
  var noPrevClubCheck = document.getElementById("noPreviousClub");
  if (prevClubInput && noPrevClubCheck) {
    noPrevClubCheck.addEventListener("change", function () {
      prevClubInput.disabled = noPrevClubCheck.checked;
      if (noPrevClubCheck.checked) prevClubInput.value = "";
    });
  }

  // ---------- Submit ----------
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    hideError();

    var data = {
      fullName: document.getElementById("fullName").value.trim(),
      dob: document.getElementById("dob").value,
      phone: document.getElementById("phone").value.trim(),
      whatsapp: document.getElementById("whatsapp").value.trim(),
      email: document.getElementById("email").value.trim(),
      location: document.getElementById("location").value.trim(),
      level: document.getElementById("level").value,
      position: document.getElementById("position").value,
      secondaryPosition: document.getElementById("secondaryPosition").value,
      foot: document.getElementById("foot").value,
      currentClub: noClubCheck && noClubCheck.checked ? "Not currently registered with any club" : currentClubInput.value.trim(),
      previousClub: noPrevClubCheck && noPrevClubCheck.checked ? "No previous club / academy" : prevClubInput.value.trim(),
      experience: document.getElementById("experience").value.trim(),
      videoLink: document.getElementById("videoLink").value.trim(),
      reason: document.getElementById("reason").value.trim()
    };

    // Required-field checks
    if (!data.fullName) return showError("Please enter your full name.");
    if (!data.dob) return showError("Please enter your date of birth.");

    // STRICT age validation — under-17 applications are rejected
    var ageError = validateAge(data.dob);
    if (ageError) return showError(ageError);

    if (!data.phone) return showError("Please enter your phone number.");
    if (!data.whatsapp) return showError("Please enter your WhatsApp number.");
    if (!data.email || data.email.indexOf("@") === -1) return showError("Please enter a valid email address.");
    if (!data.location) return showError("Please enter your current location.");
    if (!data.level) return showError("Please select your player level.");
    if (!data.position) return showError("Please select your preferred position.");
    if (!data.foot) return showError("Please select your preferred foot.");
    if (!(currentClubInput && currentClubInput.disabled) && !data.currentClub) return showError("Please enter your current club, or tick 'Not currently registered with any club'.");
    if (!(prevClubInput && prevClubInput.disabled) && !data.previousClub) return showError("Please enter your previous club/academy, or tick 'No previous club / academy'.");
    if (!data.experience) return showError("Please describe your football experience.");
    if (!data.reason) return showError("Please tell us why you want to join Castmog.");

    var confirmCheck = document.getElementById("confirmAccurate");
    if (!confirmCheck || !confirmCheck.checked) {
      return showError("Please confirm that your information is accurate and that you agree to be contacted.");
    }

    // Generate application reference
    var reference = generateReference();

    // Build WhatsApp message with all application details
    var lines = [
      "CASTMOG LADIES FOOTBALL ACADEMY — NEW APPLICATION",
      "Reference: " + reference,
      "",
      "Full name: " + data.fullName,
      "Date of birth: " + data.dob + " (age " + calculateAge(data.dob) + ")",
      "Phone: " + data.phone,
      "WhatsApp: " + data.whatsapp,
      "Email: " + data.email,
      "Location: " + data.location,
      "Player level: " + data.level,
      "Preferred position: " + data.position,
      "Secondary position: " + (data.secondaryPosition || "None"),
      "Preferred foot: " + data.foot,
      "Current club: " + data.currentClub,
      "Previous club/academy: " + data.previousClub,
      "Experience: " + data.experience,
      "Video link: " + (data.videoLink || "None")
    ];

    var photoNote = document.getElementById("photoNote");
    if (photoNote && photoNote.files && photoNote.files.length > 0) {
      lines.push("Photo: will be sent in this WhatsApp chat (" + photoNote.files[0].name + ")");
    } else {
      lines.push("Photo: to be sent in this WhatsApp chat");
    }

    lines.push("", "Reason for joining: " + data.reason);

    var message = encodeURIComponent(lines.join("\n"));
    var whatsappUrl = "https://wa.me/" + ACADEMY_WHATSAPP + "?text=" + message;

    // Show success panel with the reference
    successBox.innerHTML =
      "<strong>Application ready!</strong><br>" +
      "Your reference number is <span class='success-ref'>" + reference + "</span>.<br>" +
      "WhatsApp is opening with your full application. Press <strong>Send</strong> in WhatsApp to deliver it to the academy.<br>" +
      "<span style='font-size:0.8rem;'>Tip: attach your player photo in the same WhatsApp chat.</span>";
    successBox.classList.add("show");
    successBox.scrollIntoView({ behavior: "smooth", block: "center" });

    // Open WhatsApp with the application
    window.open(whatsappUrl, "_blank");

    form.reset();
  });
})();
