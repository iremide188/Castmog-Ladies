import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const send = (id, method, params={}) => ws.send(JSON.stringify({ id, method, params }));
ws.on("open", () => {
  send(1, "Network.setExtraHTTPHeaders", { headers: {} });
  send(2, "Runtime.evaluate", { expression: `(async () => {
    /* snapshot 1: right after load */
    const snap = () => JSON.stringify({
      preloader: !!document.querySelector(".preloader.is-visible"),
      preloaderTiles: document.querySelectorAll(".preloader-tile").length,
      gateBuilt: !document.getElementById("launch-gate").hidden,
      active: window.CLUB_PRELOADER_ACTIVE === true
    });
    const early = snap();
    await new Promise(r => setTimeout(r, 6200));  /* preloader is 5s */
    return early + "\\nAFTER 6.2s: " + snap();
  })()`, awaitPromise: true, returnByValue: true });
});
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 2) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 25000);
