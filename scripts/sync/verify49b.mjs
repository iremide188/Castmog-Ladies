import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const img = document.querySelector("#home-achievements .hc-img");
  if (!img) return "no img";
  const cs = getComputedStyle(img);
  return JSON.stringify({ar: cs.aspectRatio, cardClass: img.closest(".card").className, parentTag: img.parentElement.tagName, parentClass: img.parentElement.className, cssHas: [...document.styleSheets].length});
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
