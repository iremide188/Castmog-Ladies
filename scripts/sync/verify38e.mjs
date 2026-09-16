import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  try {
    const C = window.CLUB;
    const db = C.db || {};
    return JSON.stringify({keys: Object.keys(db), tiktokVids: db.tiktok && db.tiktok.videos ? db.tiktok.videos.length : "none",
      ytVids: db.youtube && db.youtube.videos ? db.youtube.videos.length : "none",
      mediaLen: db.media ? db.media.length : "none", wireLen: C.wire().length,
      mediaUrls: db.media ? db.media.map(m=>m.type).join(",") : ""});
  } catch (e) { return "ERR " + e.message + " | club:" + !!window.CLUB; }
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 20000);
