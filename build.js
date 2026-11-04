// Builds index.html (the website) from app-src.html (the same page that runs inside Claude).
const fs=require("fs");
const src=fs.readFileSync("app-src.html","utf8");
const FB="https://www.gstatic.com/firebasejs/10.14.1/";
const head=`<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="theme-color" content="#13203a">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://apis.google.com https://www.google.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://www.gstatic.com wss://*.firebaseio.com; frame-src https://shift-schedule-340e2.firebaseapp.com https://accounts.google.com https://apis.google.com https://www.google.com; img-src 'self' data: blob: https://*.googleusercontent.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; object-src 'none'; base-uri 'self'; form-action 'self'">
<meta name="referrer" content="strict-origin-when-cross-origin">
<link rel="apple-touch-icon" href="icon-180.png"><link rel="icon" href="icon-180.png"><link rel="manifest" href="manifest.webmanifest">
<style>
body{margin:0}
#gate{position:fixed;inset:0;z-index:1000;background:linear-gradient(160deg,#13203a,#1d3557);display:flex;align-items:center;justify-content:center;padding:16px;font-family:"Public Sans",system-ui,sans-serif}
#gate[hidden]{display:none}
.gcard{background:#fff;color:#13203a;border-radius:20px;padding:24px;width:100%;max-width:380px;display:flex;flex-direction:column;gap:10px;box-shadow:0 20px 50px rgba(0,0,0,.3)}
.gcard h2{margin:0;font-family:"Saira Semi Condensed",system-ui,sans-serif;font-size:1.6rem}.gcard p{margin:0 0 4px;color:#5d6a80}
.gcard input{font:inherit;font-size:16px;padding:12px 14px;border:1px solid #dde2ea;border-radius:12px}
.gcard button{font:inherit;font-weight:700;padding:13px;border-radius:12px;border:0;background:#13203a;color:#fff;font-size:1rem}
.gcard .ggl{background:#fff;color:#13203a;border:1px solid #dde2ea;display:flex;align-items:center;justify-content:center;gap:10px}
.gor{text-align:center;font-size:.85rem;margin:2px 0!important}
.gcard .gsec{background:none;color:#3d5a99;padding:6px;font-weight:600}.gerr{color:#c0392b!important}
</style>
<script src="firebase-config.js"></script>
<script src="${FB}firebase-app-compat.js"></script>
<script src="${FB}firebase-auth-compat.js"></script>
<script src="${FB}firebase-firestore-compat.js"></script>
<script src="web.js"></script>
</head><body>
`;
const V=(src.match(/const APP_V="([^"]+)"/)||[])[1]||"0";
fs.writeFileSync("version.json",JSON.stringify({v:V})+"\n");
fs.writeFileSync("index.html",head.replace("<script src=\"firebase-config.js\">","<script>window.APP_BUILD="+JSON.stringify(V)+"</script>\n<script src=\"firebase-config.js\">")+src+"\n</body></html>\n");
console.log("index.html built");
