import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const btn = document.querySelector('[data-act="whatsapp"]');
  return JSON.stringify({btn: !!btn,
    phone: btn ? btn.getAttribute("data-phone") : null,
    msg: btn ? btn.getAttribute("data-msg") : null});
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 12000);
