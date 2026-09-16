import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  try {
    const card = document.querySelector("#home-next-match .match-card");
    if (!card) return "no card";
    const names = [...card.querySelectorAll(".mc-name")].map(n=>n.textContent);
    const comp = card.querySelector(".mc-comp").textContent;
    const dataVer = (document.querySelector('script[src*="data.js"]')||{}).src || "?";
    return JSON.stringify({order: names, comp, dataVer});
  } catch (e) { return "ERR " + e.message; }
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 20000);
