import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  try {
    const dataVer = (document.querySelector('script[src*="data.js"]')||{getAttribute:()=>"?"}).getAttribute("src");
    const joinVer = (document.querySelector('script[src*="join.js"]')||{getAttribute:()=>"?"}).getAttribute("src");
    return JSON.stringify({
      dataVer, joinVer,
      hasClub: !!window.CLUB,
      formOk: !!document.getElementById("join-form"),
      steps: document.querySelectorAll(".jstep").length,
      step1Fields: [...document.querySelectorAll(".jstep input, .jstep select")].slice(0,5).map(i => i.name || i.id),
      bodySnippet: document.body.innerText.slice(0, 180).replace(/\\n/g, " | ")
    });
  } catch (e) { return "ERR " + e.message; }
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
