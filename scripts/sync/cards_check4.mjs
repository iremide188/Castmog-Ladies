import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  try {
    var dataVer = (document.querySelector('script[src*="data.js"]')||{getAttribute:()=>"?"}).getAttribute("src");
    var hasFn = window.CLUB ? typeof window.CLUB.socialIconRow : "no CLUB";
    var mount = document.getElementById("club-staff");
    return JSON.stringify({dataVer, hasFn, mount: !!mount, html: mount ? mount.innerHTML.slice(0,120) : null});
  } catch (e) { return "ERR: " + e.message; }
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(JSON.stringify(m.result)); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
