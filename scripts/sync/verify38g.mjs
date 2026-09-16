import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const grid = document.getElementById("home-wire");
  const card = grid.querySelector(".wire-card");
  const img = card.querySelector(".wire-img");
  const rect = img.getBoundingClientRect();
  const hero = document.getElementById("hero-slideshow");
  const vid = hero.querySelector(".hero-slide video");
  let vidOK = "no-video";
  if (vid) {
    const r = vid.getBoundingClientRect();
    vidOK = getComputedStyle(vid).objectFit + " el:" + Math.round(r.width) + "x" + Math.round(r.height) + " vid:" + vid.videoWidth + "x" + vid.videoHeight + " ready:" + vid.readyState;
  }
  return JSON.stringify({
    wireCols: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
    cardW: Math.round(card.getBoundingClientRect().width),
    imgBox: Math.round(rect.width) + "x" + Math.round(rect.height),
    heroH: Math.round(hero.getBoundingClientRect().height),
    vidOK});
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
