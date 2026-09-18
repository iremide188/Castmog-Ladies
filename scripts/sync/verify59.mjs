import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  await new Promise(r => setTimeout(r, 2200));
  const slide = document.querySelector(".lg-slide.lg-on");
  if (!slide) return JSON.stringify({err: "no slide"});
  const cs = getComputedStyle(slide);
  return JSON.stringify({
    inlineBg: !!slide.style.backgroundImage,
    fitLayers: slide.querySelectorAll(".lg-photo-fit").length,
    blurLayers: slide.querySelectorAll(".lg-photo-blur").length,
    bgSize: cs.backgroundSize,
    script: Array.from(document.scripts).map(s=>s.src).filter(s=>s.includes("launch.js"))[0].split("?")[1],
    css: (document.querySelector('link[href*="styles.css"]')||{}).href.split("?")[1],
    countdown: ["d","h","m","s"].map(k => (document.getElementById("lg-"+k)||{}).textContent).join(":")
  });
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
