import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  await new Promise(r => setTimeout(r, 1200));
  const wire = document.querySelector("#home-wire-section .section-title");
  const ach = document.querySelector("#home-achievements .hc-img");
  return JSON.stringify({
    spotlight: wire ? wire.textContent : "missing",
    achBig: ach ? Math.round(ach.getBoundingClientRect().width) + "px" : "no image (maybe no data)",
    heading: (document.querySelector("#home-next-match-title")||{}).textContent || "n/a"
  });
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
