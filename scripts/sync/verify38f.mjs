import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const grid = document.getElementById("home-wire");
  const hero = document.getElementById("hero-slideshow");
  const slides = hero ? hero.querySelectorAll(".hero-slide").length : 0;
  const cards = grid ? grid.querySelectorAll(".wire-card").length : 0;
  return JSON.stringify({cards, slides, readyState: document.readyState});
})()`;
ws.on("open", () => {
  ws.send(JSON.stringify({ id: 1, method: "Runtime.enable" }));
  ws.send(JSON.stringify({ id: 9, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } }));
});
let done = false;
ws.on("message", r => {
  const m = JSON.parse(r);
  if (m.method === "Runtime.exceptionThrown") {
    const d = m.params.exceptionDetails;
    console.log("EXCEPTION:", JSON.stringify(d.exception ? (d.exception.description || d.exception.value) : d.text).slice(0, 500), "at", (d.url||"").split("/").pop(), d.lineNumber);
  }
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") {
    console.log("CONSOLE.ERROR:", JSON.stringify(m.params.args.map(a=>a.value||a.description)).slice(0,500));
  }
  if (m.id === 9 && !done) { done = true; console.log("STATE:", m.result.result.value); }
});
setTimeout(() => { ws.close(); process.exit(0); }, 8000);
