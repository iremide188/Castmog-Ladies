import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const main = document.getElementById("admin-main");
  const tabs = [...document.querySelectorAll('#admin-nav button')].map(b=>b.textContent);
  return JSON.stringify({tabs, head: main ? main.textContent.slice(0,80) : "none",
    wireGallery: main ? main.innerHTML.indexOf("TRAINING GALLERY") : -1});
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
