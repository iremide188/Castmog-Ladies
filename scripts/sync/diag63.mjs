import WebSocket from "ws";
const ws = new WebSocket(process.argv[2]);
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: `(() => {
    var seenNav = null;
    try { seenNav = sessionStorage.getItem("castmog-preloaded"); } catch (e) { seenNav = "ERR:" + e.message; }
    return JSON.stringify({
      referrer: document.referrer || "(empty)",
      origin: location.origin,
      pathname: location.pathname,
      isHomepage: (function(){ var p = location.pathname.split("/").pop(); return p === "" || p === "index.html"; })(),
      seenNav: seenNav,
      preloaders: document.querySelectorAll(".preloader").length,
      active: window.CLUB_PRELOADER_ACTIVE,
      mainSrc: Array.from(document.scripts).map(s=>s.src).filter(s=>s.includes("main.js"))[0],
      hasEntryFn: typeof window.CLUB === "object" ? "CLUB ok" : "no CLUB"
    });
  })()`, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => { console.error("timeout"); process.exit(1); }, 10000);
