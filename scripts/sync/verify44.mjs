import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
ws.on("open", () => {
  ws.send(JSON.stringify({ id: 1, method: "Emulation.setDeviceMetricsOverride", params: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true } }));
  const EXPR = `(async () => {
    await new Promise(r => setTimeout(r, 900));
    const card = document.querySelector("#home-next-match .match-card");
    if (!card) return JSON.stringify({err: "no card"});
    card.scrollIntoView();
    const pos = {};
    card.querySelectorAll(".mc-crest, .mc-name, .mc-num").forEach(el => {
      const r = el.getBoundingClientRect();
      pos[el.className.split(" ")[0]] = Math.round(r.top);
    });
    const rows = [...card.querySelectorAll(".mc-scorers-row .lv-goal")].map(g=>g.textContent.trim());
    return JSON.stringify({crestRowTops: pos, scorers: rows, undefined: card.innerHTML.indexOf("undefined")>-1});
  })()`;
  ws.send(JSON.stringify({ id: 2, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } }));
});
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 2) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 20000);
