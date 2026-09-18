import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const card = document.querySelector("#home-next-match .match-card");
  const tops = sel => [...card.querySelectorAll(sel)].map(el => Math.round(el.getBoundingClientRect().top));
  const lefts = sel => [...card.querySelectorAll(sel)].map(el => Math.round(el.getBoundingClientRect().left));
  return JSON.stringify({
    crestTops: tops(".mc-crest"), nameTops: tops(".mc-name"), numTops: tops(".mc-num"),
    numLefts: lefts(".mc-num"),
    scorerRowTop: Math.round(card.querySelector(".mc-scorers-row").getBoundingClientRect().top),
    numBottom: Math.round(card.querySelectorAll(".mc-num")[1].getBoundingClientRect().bottom),
    vw: window.innerWidth
  });
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
