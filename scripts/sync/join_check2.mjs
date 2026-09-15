import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  try {
    const steps = document.getElementById("join-steps");
    const body = document.getElementById("join-body");
    const err = document.getElementById("join-error");
    return JSON.stringify({
      stepsHtml: steps ? steps.innerHTML.slice(0,150) : "MISSING",
      bodyHtml: body ? body.innerHTML.slice(0,250) : "MISSING",
      errText: err ? err.textContent : "MISSING",
      inputs: document.querySelectorAll("#join-body input, #join-body select, #join-body label, #join-body .upload-tile").length,
      buttons: [...document.querySelectorAll("#join-body button, .form-nav button")].map(b => b.textContent.trim()).slice(0,6)
    });
  } catch (e) { return "ERR " + e.message; }
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
