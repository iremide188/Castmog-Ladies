import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const imgs = [...document.querySelectorAll('.wire-card img.wire-img')];
  imgs.forEach(i => i.loading = 'eager');
  await new Promise(r => setTimeout(r, 3000));
  return JSON.stringify(imgs.map(i => ({src: i.getAttribute('src').slice(0,70), ok: i.naturalWidth > 0})));
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
