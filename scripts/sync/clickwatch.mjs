import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const send = (id, method, params={}) => ws.send(JSON.stringify({ id, method, params }));
let errors = [], consoleMsgs = [];
ws.on("open", async () => {
  send(1, "Runtime.enable", {});
  send(2, "Log.enable", {});
  send(3, "Runtime.evaluate", { expression: `(function(){ window.__errs = []; window.addEventListener('error', e => window.__errs.push(e.message)); window.addEventListener('unhandledrejection', e => window.__errs.push('REJ: ' + e.reason)); return 'armed'; })()` });
  /* real click via CDP input on the button coords */
  send(4, "Runtime.evaluate", { expression: `JSON.stringify({x: (r => r.x + r.width/2)(document.querySelector('.lg-music').getBoundingClientRect()), y: (r => r.y + r.height/2)(document.querySelector('.lg-music').getBoundingClientRect())})`, returnByValue: true });
});
ws.on("message", r => {
  const m = JSON.parse(r);
  if (m.method === "Runtime.exceptionThrown") errors.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300));
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") consoleMsgs.push(m.params.args.map(a => a.value).join(" ").slice(0, 200));
  if (m.method === "Log.entryAdded" && m.params.entry.level === "error") consoleMsgs.push(m.params.entry.text.slice(0, 200));
  if (m.id === 4) {
    const raw = m.result.result.value;
    const d = typeof raw === "string" ? JSON.parse(raw) : raw;
    send(5, "Input.dispatchMouseEvent", { type: "mousePressed", x: d.x, y: d.y, button: "left", clickCount: 1 });
    send(6, "Input.dispatchMouseEvent", { type: "mouseReleased", x: d.x, y: d.y, button: "left", clickCount: 1 });
    setTimeout(() => {
      send(7, "Runtime.evaluate", { expression: `JSON.stringify({ label: document.querySelector('.lg-music-lb').textContent, dance: document.getElementById('launch-gate').classList.contains('lg-dance'), errs: window.__errs })`, returnByValue: true });
    }, 2500);
  }
  if (m.id === 7) {
    console.log("STATE:", m.result.result.value);
    console.log("EXCEPTIONS:", errors.length); errors.forEach(e => console.log(" X:", e));
    console.log("CONSOLE ERRORS:", consoleMsgs.length); consoleMsgs.forEach(c => console.log(" C:", c));
    ws.close(); process.exit(0);
  }
});
setTimeout(() => { console.error("timeout"); process.exit(1); }, 20000);
