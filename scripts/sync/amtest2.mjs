import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const send = (id, method, params={}) => ws.send(JSON.stringify({ id, method, params }));
let reqs = [];
ws.on("open", () => {
  send(1, "Network.enable", {});
  send(2, "Runtime.evaluate", { expression: `(async () => {
    /* swap the embed for one with autoplay=1, inside a real click */
    const holder = document.querySelector(".lg-yt");
    document.querySelector(".lg-music").click();  /* SOUND OFF -> removes iframe */
    await new Promise(r => setTimeout(r, 200));
    document.querySelector(".lg-music").click();  /* SOUND ON -> fresh iframe (no autoplay yet) */
    await new Promise(r => setTimeout(r, 300));
    /* now inject autoplay variants directly */
    const fr = document.querySelector(".lg-yt iframe");
    fr.src = "https://audiomack.com/embed/davido/song/b4-b4?background=1&color=e5c31a&autoplay=1";
    await new Promise(r => setTimeout(r, 8000));
    return "done";
  })()`, awaitPromise: true, returnByValue: true });
});
ws.on("message", r => {
  const m = JSON.parse(r);
  if (m.method === "Network.requestWillBeSent") reqs.push(m.params.request.url || "");
  if (m.id === 2) {
    const audio = reqs.filter(u => /\.(m3u8|mpd|m4a|aac|ts|mp3|opus|webm)(\?|$)/i.test(u) || /stream|segment|audio\/|\/music\//i.test(u));
    const others = reqs.filter(u => /audiomack|cloudfront|akamai/i.test(u) && !/_next\/static/.test(u));
    console.log("AUDIO-LIKE:", audio.length); audio.slice(0,10).forEach(x=>console.log(" A:", x.slice(0,130)));
    console.log("OTHER NON-STATIC:", others.length); others.slice(0,10).forEach(x=>console.log(" O:", x.slice(0,130)));
    ws.close(); process.exit(0);
  }
});
setTimeout(() => { console.error("timeout"); process.exit(1); }, 30000);
