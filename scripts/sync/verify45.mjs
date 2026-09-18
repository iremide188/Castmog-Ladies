import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  await new Promise(r => setTimeout(r, 1200));
  const img = document.querySelector("#achievements-mount .hc-img");
  if (!img) return JSON.stringify({img: "none found"});
  const r = img.getBoundingClientRect();
  const cs = getComputedStyle(img);
  const card = img.closest(".card");
  return JSON.stringify({rendered: img.naturalWidth > 0, width: Math.round(r.width), height: Math.round(r.height),
    fillsCard: Math.round(r.width) === Math.round(card.getBoundingClientRect().width),
    objectFit: cs.objectFit, ver: ((document.querySelector('script[src*="achievements.js"]')||{}).src||"?").split("?")[1]});
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
