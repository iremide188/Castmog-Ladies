import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const title = document.querySelector("#home-next-match-title");
  const card = document.querySelector("#home-next-match .match-card");
  const meta = card ? [...card.querySelectorAll(".mc-meta span")].map(s=>s.textContent) : [];
  const lv = card ? [...card.querySelectorAll(".lv-goal")].map(g=>g.textContent.trim()) : [];
  const nums = card ? [...card.querySelectorAll(".mc-num")].map(n=>n.textContent) : [];
  const ver = ((document.querySelector('script[src*="home.js"]')||{}).src||"?").split("?")[1];
  return JSON.stringify({heading: title ? title.textContent : "none", liveTitle: title ? title.classList.contains("live-title") : null,
    meta, scorers: lv, nums, homeVer: ver, hasUndefined: card ? card.innerHTML.indexOf("undefined")>-1 : null});
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
