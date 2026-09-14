/* =====================================================
   CASTMOG LADIES FOOTBALL ACADEMY — contact form
   Sends the message via WhatsApp (works on any static host).
   ===================================================== */

(function () {
  "use strict";

  var ACADEMY_WHATSAPP = "2349130527339";

  var form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var name = document.getElementById("cName").value.trim();
    var phone = document.getElementById("cPhone").value.trim();
    var email = document.getElementById("cEmail").value.trim();
    var message = document.getElementById("cMessage").value.trim();

    if (!name || !message) return;

    var lines = [
      "CASTMOG LADIES FOOTBALL ACADEMY — WEBSITE MESSAGE",
      "",
      "Name: " + name,
      phone ? "Phone/WhatsApp: " + phone : null,
      email ? "Email: " + email : null,
      "",
      "Message:",
      message
    ].filter(Boolean);

    window.open(
      "https://wa.me/" + ACADEMY_WHATSAPP + "?text=" + encodeURIComponent(lines.join("\n")),
      "_blank"
    );

    form.reset();
  });
})();
