import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const dataVer = (document.querySelector('script[src*="data.js"]')||{getAttribute:()=>"?"}).getAttribute("src");
  return JSON.stringify({
    dataVer,
    hasFn: typeof window.CLUB.socialIconRow,
    staffMount: !!document.getElementById("club-staff"),
    mountInner: (document.getElementById("club-staff")||{}).innerHTML ? document.getElementById("club-staff").innerHTML.slice(0,150) : null
  });
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
