import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  try {
    const r = await fetch("https://iremide188.github.io/Castmog-Ladies/js/data.js?v=35", {cache: "reload"});
    const t = await r.text();
    return JSON.stringify({hasHelper: t.includes("SOC_ICONS"), hasExport: t.includes("socialIconRow: socialIconRow"), len: t.length});
  } catch (e) { return "ERR " + e.message; }
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
