import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: `(async () => {
    const log = [];
    const t0 = Date.now();
    for (let i = 0; i < 20; i++) {
      log.push(Math.round((Date.now()-t0)/1000) + "s pre:" + (document.querySelector(".preloader.is-visible") ? "ON" : "-") + " gate:" + (document.getElementById("launch-gate").hidden ? "-" : "UP"));
      await new Promise(r => setTimeout(r, 600));
    }
    return log.join(" | ");
  })()`, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 20000);
