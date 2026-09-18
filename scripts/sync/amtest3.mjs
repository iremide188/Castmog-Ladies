import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const send = (id, method, params={}) => ws.send(JSON.stringify({ id, method, params }));
let reqs = [];
ws.on("open", async () => {
  send(1, "Network.enable", {});
  send(2, "Runtime.evaluate", { expression: `(async () => {
    const btn = document.querySelector(".lg-music");
    const r = btn.getBoundingClientRect();
    return JSON.stringify({ x: r.x + r.width/2, y: r.y + r.height/2, label: btn.textContent.trim() });
  })()`, returnByValue: true });
});
let step = 0;
ws.on("message", r => {
  const m = JSON.parse(r);
  if (m.method === "Network.requestWillBeSent") reqs.push(m.params.request.url || "");
  if (m.id === 2) {
    const raw = m.result && m.result.result && (m.result.result.value !== undefined ? m.result.result.value : m.result.result);
    const d = typeof raw === "string" ? JSON.parse(raw) : raw;
    const x = d.x, y = d.y;
    console.log("click at", x, y);
    send(3, "Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
    send(4, "Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    setTimeout(() => {
      send(5, "Runtime.evaluate", { expression: `(async () => {
        await new Promise(r => setTimeout(r, 9000));
        return document.querySelector(".lg-music").textContent.trim();
      })()`, awaitPromise: true, returnByValue: true });
    }, 500);
  }
  if (m.id === 5) {
    const audio = reqs.filter(u => /\.(m3u8|mpd|m4a|aac|ts|mp3|opus|weba|webm)(\?|$)/i.test(u) || /(stream|segment|\/audio|playback)/i.test(u));
    console.log("label now:", m.result.result.value);
    console.log("AUDIO-LIKE REQUESTS:", audio.length);
    audio.slice(0, 12).forEach(x => console.log(" A:", x.slice(0, 140)));
    ws.close(); process.exit(0);
  }
});
setTimeout(() => { console.error("timeout"); process.exit(1); }, 30000);
