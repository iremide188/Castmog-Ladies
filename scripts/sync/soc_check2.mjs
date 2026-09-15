import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const secs = [...document.querySelectorAll("main .section")];
  const coachSec = secs.find(s => s.querySelector(".footer-social"));
  const btns = coachSec ? [...coachSec.querySelectorAll(".footer-social a")] : [];
  return JSON.stringify({
    jsVer: (document.querySelector('script[src*="coach.js"]')||{getAttribute:()=> "?"}).getAttribute("src"),
    count: btns.length,
    links: btns.map(b => b.textContent.trim() + " -> " + b.href),
    svg: btns.length ? btns.filter(b=>b.querySelector("svg")).length : 0
  });
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
