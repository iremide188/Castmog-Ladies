import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const chip = [...document.querySelectorAll('#media-filters .filter-chip')].find(c=>c.textContent.trim()==='TIKTOK');
  if (!chip) return 'NO TIKTOK CHIP';
  chip.click();
  await new Promise(r=>setTimeout(r,800));
  const grid = document.querySelectorAll('#media-mount .media-item').length;
  const imgs = [...document.querySelectorAll('#media-mount .media-item img')].map(i=>i.naturalWidth>0);
  return JSON.stringify({tiktokItems: grid, loadedImgs: imgs.filter(Boolean).length + '/' + imgs.length});
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
