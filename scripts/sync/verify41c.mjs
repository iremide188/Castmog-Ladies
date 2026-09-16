import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const m = CLUB.pub(CLUB.get("matches"))[0];
  const ls = CLUB.liveState(m);
  const ko = CLUB.kickoff(m).toISOString();
  const card = document.querySelector("#home-next-match .match-card");
  return JSON.stringify({ls, kickoffUTC: ko, nowUTC: new Date().toISOString(),
    hasCountdown: card ? !!card.querySelector(".countdown") : null,
    liveScores: [m.liveScoreCastmog, m.liveScoreOpponent],
    nums: card ? [...card.querySelectorAll(".mc-num")].map(n=>n.textContent) : []});
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
