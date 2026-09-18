import WebSocket from "ws";
import fs from "fs";
const token = process.env.GITHUB_TOKEN_4;
const ws = new WebSocket(process.argv[2]);
const EXPR = `(async () => {
  localStorage.setItem("castmog_admin_token", ${JSON.stringify(token)});
  location.href = "admin.html?cb=" + Date.now();
  return "navigating";
})()`;
ws.on("open", () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: EXPR, returnByValue: true } })));
ws.on("message", r => { const m = JSON.parse(r); if (m.id === 1) { console.log(m.result.result.value); ws.close(); process.exit(0); } });
setTimeout(() => process.exit(1), 10000);
