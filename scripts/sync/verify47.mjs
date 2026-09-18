import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const t = document.querySelector("#home-training .wk-time");
  return JSON.stringify({ time: t ? t.textContent : null, color: t ? getComputedStyle(t).color : null, css: ((document.querySelector('link[href*="styles.css"]')||{getAttribute:()=>""}).getAttribute("href")||"").split("?")[1] });
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
