import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  try {
    const grid = document.getElementById("home-wire");
    const cards = grid ? grid.querySelectorAll(".wire-card").length : 0;
    const card = grid ? grid.querySelector(".wire-card") : null;
    const img = card ? card.querySelector(".wire-img") : null;
    const hero = document.getElementById("hero-slideshow");
    const slides = hero ? hero.querySelectorAll(".hero-slide").length : 0;
    const vid = hero ? hero.querySelector(".hero-slide video") : null;
    const vidStyle = vid ? getComputedStyle(vid).objectFit : "none";
    const playing = vid && vid.readyState > 0;
    return JSON.stringify({cards, cardW: card ? Math.round(card.getBoundingClientRect().width) : 0,
      imgH: img ? Math.round(img.getBoundingClientRect().height) : 0, slides, video: !!vid, vidStyle, ready: playing});
  } catch (e) { return "ERR " + e.message; }
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 20000);
