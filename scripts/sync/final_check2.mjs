import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  try {
    const ver = (document.querySelector('script[src*="data.js"]')||{getAttribute:()=>"?"}).getAttribute("src");
    const hasClub = !!window.CLUB;
    const cards = document.querySelectorAll(".staff-card").length;
    const rows = [...document.querySelectorAll(".sc-soc-row")].map(r => ({
      coach: (r.closest(".staff-card").querySelector(".sc-name")||{}).textContent,
      btns: [...r.querySelectorAll("a")].map(a => a.getAttribute("title") + " -> " + a.href)
    }));
    const playerCards = document.querySelectorAll(".player-card").length;
    return JSON.stringify({ver, hasClub, cards, rows, playerCards});
  } catch (e) { return "ERR " + e.message; }
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 20000);
