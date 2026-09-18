import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const send = (id, method, params={}) => ws.send(JSON.stringify({ id, method, params }));
let mediaReqs = [];
ws.on("open", () => {
  send(1, "Network.enable", {});
  send(2, "Runtime.enable", {});
  send(3, "Runtime.evaluate", { expression: `(async () => {
    const btn = document.querySelector(".lg-music");
    if (!btn) return "no button";
    btn.click();
    await new Promise(r => setTimeout(r, 6000));
    const fr = document.querySelector(".lg-yt iframe");
    return JSON.stringify({ label: btn.textContent.trim(), iframe: !!fr, src: fr && fr.src });
  })()`, awaitPromise: true, returnByValue: true });
});
ws.on("message", r => {
  const m = JSON.parse(r);
  if (m.method === "Network.requestWillBeSent") {
    const u = m.params.request.url || "";
    if (/audio|\.ts\b|stream|mp3|m4a|media|chunk/i.test(u)) mediaReqs.push(u.slice(0, 110));
  }
  if (m.id === 3) { console.log(m.result.result.value); console.log("MEDIA REQUESTS:", mediaReqs.length); mediaReqs.slice(0,8).forEach(x=>console.log(" ", x)); ws.close(); process.exit(0); }
});
setTimeout(() => { console.error("timeout"); process.exit(1); }, 25000);
