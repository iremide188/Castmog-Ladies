import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const fs = [...document.querySelectorAll(".footer-social")];
  const mount = document.getElementById("coach-mount") || document.getElementById("mount") || document.querySelector("main");
  return JSON.stringify({
    mountId: mount ? mount.id : "none",
    fsCount: fs.length,
    fsText: fs.map(f => f.innerText.replace(/\\n/g," | ")),
    hasSocialSec: !!document.body.innerHTML.includes("INSTAGRAM"),
    bodyHasSalako: !!document.body.innerText.includes("Salako")
  });
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
