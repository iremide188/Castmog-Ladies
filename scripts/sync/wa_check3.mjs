import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const nav = [...document.querySelectorAll('button,a,li')].find(e => e.textContent.trim() === "APPLICATIONS");
  if (nav) nav.click();
  await new Promise(r=>setTimeout(r,2500));
  const btn = document.querySelector('[data-act="whatsapp"]');
  if (!btn) return JSON.stringify({btn:false, body: document.getElementById("admin-main").innerText.slice(0,300)});
  return JSON.stringify({btn:true, phone: btn.getAttribute("data-phone"), msg: btn.getAttribute("data-msg")});
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
