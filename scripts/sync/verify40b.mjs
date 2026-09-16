import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const rows = [...document.querySelectorAll(".mr-teams")].map(t=>t.textContent.trim().replace(/\\s+/g," "));
  const chips = [...document.querySelectorAll(".match-row .chip-yellow")].map(c=>c.textContent.trim());
  const detailH2 = (document.querySelector("#match-jagunmolu-ffj9 h2")||{}).textContent || "n/a";
  return JSON.stringify({rows, chips, detailH2: detailH2.trim()});
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 20000);
