import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const h2 = document.querySelector(".section-title");
  const cardNames = [...document.querySelectorAll(".match-card .mc-name")].map(n=>n.textContent);
  return JSON.stringify({detailHeading: h2 ? h2.textContent.trim() : "none", cardOrder: cardNames});
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
