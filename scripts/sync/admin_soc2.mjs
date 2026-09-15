import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const ver = (document.querySelector('script[src*="admin.js"]')||{getAttribute:()=> "?"}).getAttribute("src");
  const tab = [...document.querySelectorAll("[data-tab]")].find(e => e.getAttribute("data-tab") === "staff");
  if (tab) tab.click();
  await new Promise(r=>setTimeout(r,2500));
  const editBtn = document.querySelector('[data-act="edit"], #staff-list [data-act="edit"]');
  const labels = [];
  if (editBtn) {
    editBtn.click();
    await new Promise(r=>setTimeout(r,1200));
    const modal = document.getElementById("modal-root") || document.body;
    labels.push(...[...modal.querySelectorAll("label,input[placeholder]")].slice(0,40).map(e => e.textContent || e.placeholder).filter(Boolean));
  }
  return JSON.stringify({ver, editBtn: !!editBtn, labels: labels.slice(0,30)});
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 20000);
