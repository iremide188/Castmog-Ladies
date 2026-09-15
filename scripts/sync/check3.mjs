import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const chips = [...document.querySelectorAll('#media-filters .filter-chip')].map(c=>c.textContent);
  const tt = chips.find(c=>c==='TIKTOK');
  if (tt) tt.click();
  await new Promise(r=>setTimeout(r,600));
  const items = [...document.querySelectorAll('#media-mount .media-item')];
  return JSON.stringify({chips, tiktokTab: !!tt, items: items.length, firstImg: (items[0]||{}).querySelector && items[0].querySelector('img') ? items[0].querySelector('img').naturalWidth > 0 : null});
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
