import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const imgs = [...document.querySelectorAll("#home-achievements .hc-img")];
  const r = imgs[0] ? imgs[0].getBoundingClientRect() : null;
  return JSON.stringify({
    count: imgs.length,
    desktop: { w: r ? Math.round(r.width) : null, h: r ? Math.round(r.height) : null, ratio: r ? (r.width/r.height).toFixed(2) : null },
    cssVer: ((document.querySelector('link[href*="styles.css"]')||{getAttribute:()=>""}).getAttribute("href")||"").split("?")[1]
  });
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
