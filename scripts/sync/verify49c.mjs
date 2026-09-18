import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const img = document.querySelector("#home-achievements .hc-img");
  const cs = img ? getComputedStyle(img) : null;
  const section = document.getElementById("home-achievements");
  return JSON.stringify({
    found: !!img,
    ar: cs ? cs.aspectRatio : null,
    inlineStyle: img ? (img.getAttribute("style") || "") : null,
    parentClass: img ? img.parentElement.className : null,
    parentTag: img ? img.parentElement.tagName : null,
    rulesInDoc: [...document.styleSheets].map(s => { try { return (s.href||"inline"); } catch(e) { return "err"; } }),
    vh: window.innerWidth
  });
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
