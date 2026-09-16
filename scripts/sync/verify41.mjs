import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  // set a phone viewport then read the resource log
  const res = performance.getEntriesByType("resource")
    .filter(r => r.name.indexOf("matches.json") > -1)
    .map(r => r.name.split("/").pop());
  const card = document.querySelector("#home-next-match .match-card");
  const live = card ? card.querySelector(".mc-live") : null;
  const dataVer = (document.querySelector('script[src*="data.js"]')||{}).src || "?";
  return JSON.stringify({matchFetches: res, liveStrip: live ? live.textContent.trim().slice(0,60) : "no live strip", dataVer: dataVer.split("?")[1]});
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 20000);
