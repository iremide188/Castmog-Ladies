import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const p = document.querySelector("#home-training");
  p.scrollIntoView({block:"start"});
  await new Promise(r => setTimeout(r, 600));
  const rows = [...document.querySelectorAll("#home-training .wk-tr")];
  const first = rows[0];
  const r = first.getBoundingClientRect();
  return JSON.stringify({rows: rows.length, rowHeight: Math.round(r.height), width: Math.round(r.width), typePillRight: rows.every(x => { const p = x.querySelector(".wk-type"); return !p || p.getBoundingClientRect().right <= x.getBoundingClientRect().right - 8; }), cssVer: ((document.querySelector('link[href*="styles.css"]')||{getAttribute:()=>""}).getAttribute("href")||"").split("?")[1]});
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
