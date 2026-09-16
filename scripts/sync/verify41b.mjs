import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const res = performance.getEntriesByType("resource")
    .filter(r => r.name.indexOf("matches.json") > -1)
    .map(r => r.name.split("?")[1] ? "cache-busted" : "PLAIN");
  const card = document.querySelector("#home-next-match .match-card");
  const live = card ? card.querySelector(".mc-live") : null;
  const dataVer = ((document.querySelector('script[src*="data.js"]')||{}).src || "?").split("?")[1];
  const names = card ? [...card.querySelectorAll(".mc-name")].map(n=>n.textContent) : [];
  return JSON.stringify({matchFetches: res, dataVer, cardPresent: !!card, order: names,
    liveStrip: live ? live.textContent.trim().slice(0,50) : "none"});
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 20000);
