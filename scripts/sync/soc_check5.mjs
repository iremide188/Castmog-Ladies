import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const fs = [...document.querySelectorAll(".footer-social")].filter(f => f.closest("main") || f.closest("#coach-mount") || f.closest(".coach"));
  const btns = fs.flatMap(f => [...f.querySelectorAll("a")]);
  return JSON.stringify(btns.map(b => ({
    label: b.textContent.trim(),
    href: b.href,
    icon: !!b.querySelector("svg")
  })));
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
