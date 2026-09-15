/* Castmog Ladies — TikTok sync, step 1.
   Run inside the sandbox while a Browserbase session has the club's
   TikTok profile open. Connects to the page over the DevTools websocket,
   scrolls the profile grid and prints every visible video URL as JSON.

   Usage:  node tiktok_sync.mjs "<debugger wss url>"
   (needs `npm i ws` in this folder first)                                 */
import WebSocket from "ws";

const wssUrl = process.argv[2];
if (!wssUrl) {
  console.error("usage: tiktok_sync.mjs <debugger-wss-url>");
  process.exit(1);
}

const EXPR = `(async () => {
  const found = new Set();
  const grab = () => document.querySelectorAll('a[href*="/video/"]').forEach(a => {
    const h = a.href.split("?")[0];
    if (/\\/video\\/\\d{6,}/.test(h)) found.add(h);
  });
  grab();
  for (let i = 0; i < 8; i++) {
    window.scrollBy(0, 2200);
    await new Promise(r => setTimeout(r, 800));
    grab();
  }
  return JSON.stringify([...found]);
})()`;

const ws = new WebSocket(wssUrl);
ws.on("error", (e) => { console.error("WS ERROR: " + e.message); process.exit(1); });
ws.on("open", () => {
  ws.send(JSON.stringify({
    id: 1,
    method: "Runtime.evaluate",
    params: { expression: EXPR, awaitPromise: true, returnByValue: true },
  }));
});
ws.on("message", (raw) => {
  const msg = JSON.parse(raw);
  if (msg.id === 1) {
    const v = msg.result && msg.result.result && msg.result.result.value;
    console.log(v || "[]");
    ws.close();
    process.exit(0);
  }
});
setTimeout(() => { console.error("timeout"); process.exit(1); }, 25000);
