import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `document.getElementById("home-wire-section").scrollIntoView(); window.scrollBy(0,-80); "scrolled"`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 10000);
