import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  const clickTab = async (t) => {
    const b = [...document.querySelectorAll("#admin-nav [data-tab]")].find(x => x.getAttribute("data-tab") === t);
    if (b) b.click();
    await new Promise(r => setTimeout(r, 500));
  };
  await clickTab("settings");
  return JSON.stringify({
    heroPanel: !!document.getElementById("hero-list"),
    heroPhotoBtn: !!document.getElementById("hero-photo-btn"),
    heroVideoBtn: !!document.getElementById("hero-video-btn"),
    heroAddLink: !!document.getElementById("hero-add-record"),
    heroMulti: document.getElementById("hero-photo-file") ? document.getElementById("hero-photo-file").hasAttribute("multiple") : null,
    heroEmpty: (document.querySelector("#hero-list .empty-state")||{textContent:"(no empty-state)"}).textContent.slice(0,50)
  });
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, awaitPromise: true, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 20000);
