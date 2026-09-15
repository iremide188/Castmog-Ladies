import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const tabs = [...document.querySelectorAll("[data-tab]")].map(e=>e.getAttribute("data-tab"));
  const appTab = [...document.querySelectorAll("[data-tab]")].find(e => (e.getAttribute("data-tab")||"").indexOf("app") >= 0);
  if (appTab) appTab.click();
  await new Promise(r=>setTimeout(r,3000));
  const btn = document.querySelector('[data-act="whatsapp"]');
  return JSON.stringify({tabs, found: !!appTab, btn: !!btn,
    phone: btn ? btn.getAttribute("data-phone") : null,
    msg: btn ? btn.getAttribute("data-msg") : null,
    chip: (document.querySelector('.app-card .chip')||{}).textContent || null});
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 18000);
