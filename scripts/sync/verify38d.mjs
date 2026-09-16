import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  try {
    const err = window.__errs || [];
    return JSON.stringify({club: !!window.CLUB, wire: !!window.CLUB && typeof window.CLUB.wire, err,
      scripts: [...document.scripts].map(s=>s.src.split("/").pop()),
      wireHtml: (document.getElementById("home-wire")||{}).innerHTML ? String(document.getElementById("home-wire").innerHTML).slice(0,120) : "empty"});
  } catch (e) { return "ERR " + e.message; }
})()`;
const errs = [];
ws.on("open", () => {
  ws.send(JSON.stringify({ id: 1, method: "Runtime.enable" }));
  ws.send(JSON.stringify({ id: 2, method: "Runtime.evaluate", params: { expression: "window.__errs=[]; window.addEventListener('error',e=>{window.__errs.push(String(e.message))}); 'hooked'", returnByValue: true } }));
  setTimeout(() => ws.send(JSON.stringify({ id: 3, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })), 3000);
});
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 3) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 20000);
