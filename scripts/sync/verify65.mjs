import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const send = (id, method, params={}) => ws.send(JSON.stringify({ id, method, params }));
ws.on("open", () => {
  send(1, "Runtime.evaluate", { expression: `(async () => {
    const btn = document.querySelector(".lg-music");
    const before = JSON.stringify({ btn: !!btn, label: btn && btn.textContent.trim(), iframe: !!document.querySelector(".lg-yt iframe") });
    /* tap the SOUND button */
    btn.click();
    await new Promise(r => setTimeout(r, 1200));
    const fr = document.querySelector(".lg-yt iframe");
    const afterTap = JSON.stringify({ label: btn.textContent.trim(), on: btn.classList.contains("lg-music-on"), iframe: !!fr, src: fr && fr.getAttribute("src") });
    /* tap again to stop */
    btn.click();
    await new Promise(r => setTimeout(r, 300));
    const afterOff = JSON.stringify({ label: btn.textContent.trim(), on: btn.classList.contains("lg-music-on"), iframe: !!document.querySelector(".lg-yt iframe") });
    return "BEFORE: " + before + "\\nAFTER TAP: " + afterTap + "\\nAFTER OFF: " + afterOff;
  })()`, awaitPromise: true, returnByValue: true });
});
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 15000);
