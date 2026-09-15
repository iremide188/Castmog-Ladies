import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `JSON.stringify({url: location.href, bar: !!document.querySelector('#media-filters'), chips: document.querySelectorAll('#media-filters .filter-chip').length, mount: document.querySelectorAll('#media-mount > *').length, body: document.body.innerText.slice(0,150)})`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result && m.result.result && m.result.result.value); console.log(JSON.stringify(m).slice(0,200)); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
