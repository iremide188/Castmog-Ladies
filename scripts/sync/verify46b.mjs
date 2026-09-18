import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  await new Promise(r => setTimeout(r, 800));
  const out = {};
  // go to Training tab
  const btns = [...document.querySelectorAll("#admin-nav [data-tab]")];
  const train = btns.find(b => b.getAttribute("data-tab") === "training");
  if (train) train.click();
  await new Promise(r => setTimeout(r, 400));
  out.weeklyEditor = !!document.getElementById("wk-list");
  out.weeklyRowCount = document.querySelectorAll("#wk-list .wk-row").length;
  out.daySelects = [...document.querySelectorAll("#wk-list .wk-day")].map(s => s.value);
  out.timeSample = (document.querySelector("#wk-list .wk-time")||{}).value;
  out.locSample = (document.querySelector("#wk-list .wk-loc")||{}).value;
  out.typeSample = (document.querySelector("#wk-list .wk-type")||{}).value;
  out.tgMulti = (document.getElementById("tg-photo-file")||{getAttribute:()=>""}).getAttribute ? document.getElementById("tg-photo-file").hasAttribute("multiple") : null;
  // go to Settings tab
  const set = btns.find(b => b.getAttribute("data-tab") === "settings");
  if (set) set.click();
  await new Promise(r => setTimeout(r, 400));
  out.heroPanel = !!document.getElementById("hero-list");
  out.heroPhotoBtn = !!document.getElementById("hero-photo-btn");
  out.heroMulti = document.getElementById("hero-photo-file") ? document.getElementById("hero-photo-file").hasAttribute("multiple") : null;
  out.heroEmpty = (document.querySelector("#hero-list .empty-state")||{textContent:""}).textContent.slice(0,60);
  out.adminVer = ((document.querySelector('script[src*="admin.js"]')||{getAttribute:()=>""}).getAttribute("src")||"").split("?")[1];
  return JSON.stringify(out);
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 20000);
