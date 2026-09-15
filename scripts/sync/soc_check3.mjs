import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const r = await fetch("https://iremide188.github.io/Castmog-Ladies/data/staff.json", {cache: "reload"});
  const j = await r.json();
  const sal = j.find(s => s.id === "salako-samuel") || {};
  return JSON.stringify({liveSocial: sal.social, liveSocialUrl: sal.socialUrl});
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
