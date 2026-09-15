import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `JSON.stringify({
  cards: document.querySelectorAll('.wire-card').length,
  imgsLoaded: [...document.querySelectorAll('.wire-card img.wire-img')].filter(i=>i.naturalWidth>0).length,
  badges: [...document.querySelectorAll('.wire-badge')].map(b=>b.textContent),
  title: (document.querySelector('#home-wire-section .section-title')||{}).textContent,
  syncBadge: (document.querySelector('.wire-sync-badge')||{}).textContent
})`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
