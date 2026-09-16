import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const add = document.getElementById("add-btn");
  if (!add) return "no add button";
  add.click();
  await new Promise(r=>setTimeout(r,700));
  const modal = document.querySelector(".record-modal, .modal, [class*=modal]");
  const labels = modal ? modal.textContent : "no modal";
  const hlBtn = modal ? [...modal.querySelectorAll("button")].find(b => b.textContent.indexOf("UPLOAD FROM DEVICE")>-1) : null;
  const hlField = modal ? [...modal.querySelectorAll("input")].find(i => (i.id||"").indexOf("highlight")>-1 || (i.previousElementSibling||{}).textContent && false) : null;
  const hlLabel = modal ? (modal.innerHTML.indexOf("MATCH HIGHLIGHT") > -1) : false;
  return JSON.stringify({modalOpen: !!modal, hlLabel, uploadBtns: modal ? modal.querySelectorAll("[data-iu]").length : 0,
    hlBtnText: hlBtn ? "found" : "none",
    hlInputVal: (document.getElementById("mf-highlight")||{}).placeholder || ""});
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
