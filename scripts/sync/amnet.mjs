import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const send = (id, method, params={}) => ws.send(JSON.stringify({ id, method, params }));
let reqs = [];
ws.on("open", () => send(1, "Network.enable", {}));
ws.on("message", r => {
  const m = JSON.parse(r);
  if (m.method === "Network.requestWillBeSent") reqs.push(m.params.request.url || "");
  if (m.id === 999) {
    const audio = reqs.filter(u => /\.(m3u8|mpd|m4a|aac|ts|mp3|opus|weba)(\?|$)/i.test(u) || /(stream|segment|\/audio\/|playback|cloudfront)/i.test(u));
    console.log("AUDIO-LIKE:", audio.length);
    audio.slice(0, 12).forEach(x => console.log(" A:", x.slice(0, 150)));
    ws.close(); process.exit(0);
  }
});
process.on("SIGTERM", () => { send(999); });
