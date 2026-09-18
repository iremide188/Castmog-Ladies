import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: `JSON.stringify({
  gate: document.getElementById("launch-gate"),
  dance: document.getElementById("launch-gate").classList.contains("lg-dance"),
  cardOpen: document.querySelector(".lg-player").classList.contains("is-open"),
  btnLabel: document.querySelector(".lg-music-lb").textContent,
  iframeSrc: document.querySelector(".lg-player iframe").getAttribute("src")
})`, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 8000);
