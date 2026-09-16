import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const tab = process.argv[3];
const checks = process.argv[4] || "";
const EXPR = `(async () => {
  const btn = [...document.querySelectorAll('#admin-nav button')].find(b=>b.textContent==="${tab}");
  if (!btn) return "no tab";
  btn.click();
  await new Promise(r=>setTimeout(r,600));
  const main = document.getElementById("admin-main");
  const out = {tab:"${tab}", head: main.textContent.slice(0,60)};
  ${checks}
  return JSON.stringify(out);
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
