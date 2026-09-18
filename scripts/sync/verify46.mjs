import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const panel = document.querySelector("#home-training .panel");
  const rows = panel ? [...panel.querySelectorAll(".wk-tr")].map(r => r.textContent.replace(/\\s+/g," ").trim()) : [];
  const dayCount = panel ? [...panel.querySelectorAll(".wk-day")].map(d=>d.textContent) : [];
  const slides = document.querySelectorAll("#hero-slideshow .hero-slide").length;
  const ver = ((document.querySelector('script[src*="home.js"]')||{}).src||"?").split("?")[1];
  return JSON.stringify({weeklyRows: rows, days: dayCount, heroSlides: slides, homeVer: ver});
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
