// Website adapter: gives the app the same "db" and "downloads" it gets inside Claude,
// backed by Firebase (email sign-in + Firestore). Each person's data lives under users/<uid>/.
(function(){
  let resolveDb;
  const dbReady=new Promise(r=>resolveDb=r);
  const isIOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
  const downloads={async save({filename,data}){
    const ext=filename.split(".").pop().toLowerCase();
    const type={png:"image/png",ics:"text/calendar",json:"application/json",zip:"application/zip"}[ext]||"application/octet-stream";
    const blob=data instanceof Blob?new Blob([data],{type}):new Blob([data],{type});
    if(ext==="png"&&navigator.canShare){const f=new File([blob],filename,{type});
      if(navigator.canShare({files:[f]})){try{await navigator.share({files:[f]});return {status:"saved"};}catch(e){if(e&&e.name==="AbortError")throw {code:"declined"};}}}
    const url=URL.createObjectURL(blob);
    if(ext==="ics"&&isIOS){location.href=url;}
    else{const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();}
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    return {status:"saved"};
  }};
  window.WEB={db:dbReady,downloads};
  // Get the newest version: iPhone home-screen apps hold on to old copies
  function checkVersion(){fetch("version.json?"+Date.now(),{cache:"no-store"}).then(r=>r.json()).then(j=>{
    if(j&&j.v&&window.APP_BUILD&&j.v!==window.APP_BUILD){let n=0;try{n=+sessionStorage.getItem("reloadFor"+j.v)||0;sessionStorage.setItem("reloadFor"+j.v,n+1);}catch(e){}
      if(n<3)location.replace(location.pathname+"?v="+encodeURIComponent(j.v));}}).catch(()=>{});}
  checkVersion();document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")checkVersion();});
  document.addEventListener("DOMContentLoaded",start);
  function start(){

  const cfg=window.FIREBASE_CONFIG;
  function gate(html){
    let g=document.getElementById("gate");
    if(!g){g=document.createElement("div");g.id="gate";document.body.appendChild(g);}
    g.innerHTML=html;g.hidden=false;return g;
  }
  if(!cfg||!window.firebase){gate(`<div class="gcard"><h2>★ Shift Schedule</h2><p>Sync isn't set up yet. Your rotation, paydays and holidays still show.</p><button id="gOk">Continue</button></div>`);
    document.getElementById("gOk").onclick=()=>{document.getElementById("gate").hidden=true;};resolveDb(null);return;}
  firebase.initializeApp(cfg);
  const auth=firebase.auth(), fs=firebase.firestore();
  try{fs.enablePersistence({synchronizeTabs:true}).catch(()=>{});}catch(e){}
  function showSignIn(err){
    const g=gate(`<form class="gcard" id="gForm"><h2>★ Shift Schedule</h2><p>Sign in to sync your schedule on every device.</p>
      <button type="button" class="ggl" id="gGoogle"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.6 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>Continue with Google</button>
      <p class="gor">or use email</p>
      <input id="gEmail" type="email" autocomplete="username" placeholder="Email" required>
      <input id="gPass" type="password" autocomplete="current-password" placeholder="Password (6+ characters)" required minlength="6">
      <p class="gerr" id="gErr" ${err?"":"hidden"}>${err||""}</p>
      <button type="submit" id="gIn">Sign in</button>
      <button type="button" class="gsec" id="gNew">First time here? Create account</button>
      <button type="button" class="gsec" id="gReset">Forgot password</button></form>`);
    const E=()=>document.getElementById("gEmail").value.trim(),P=()=>document.getElementById("gPass").value;
    const fail=e=>{const m={"auth/invalid-credential":"Wrong email or password.","auth/wrong-password":"Wrong email or password.","auth/user-not-found":"No account with that email. Tap Create account.","auth/email-already-in-use":"That email already has an account. Tap Sign in.","auth/weak-password":"Use at least 6 characters.","auth/invalid-email":"Check the email address.","auth/admin-restricted-operation":"New accounts are turned off for this app.","auth/operation-not-allowed":"That sign-in method isn't turned on yet.","auth/unauthorized-domain":"This website isn't on the allowed list in Firebase yet.","auth/popup-blocked":"The Google window was blocked. Allow pop-ups and try again.","auth/account-exists-with-different-credential":"That email already signs in with a password. Use email below."}[e.code]||e.message;
      const x=document.getElementById("gErr");x.textContent=m;x.hidden=false;};
    document.getElementById("gGoogle").onclick=()=>{auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(e=>{if(e.code==="auth/popup-closed-by-user"||e.code==="auth/cancelled-popup-request")return;fail(e);});};
    document.getElementById("gForm").onsubmit=ev=>{ev.preventDefault();auth.signInWithEmailAndPassword(E(),P()).catch(fail);};
    document.getElementById("gNew").onclick=()=>{if(!E()||P().length<6)return fail({message:"Type your email and a password first."});auth.createUserWithEmailAndPassword(E(),P()).catch(fail);};
    document.getElementById("gReset").onclick=()=>{if(!E())return fail({message:"Type your email first."});auth.sendPasswordResetEmail(E()).then(()=>fail({message:"Check your email for a reset link."})).catch(fail);};
  }
  auth.onAuthStateChanged(u=>{
    if(!u){showSignIn();return;}
    const g=document.getElementById("gate");if(g)g.hidden=true;
    if(document.activeElement)document.activeElement.blur();window.scrollTo(0,0);setTimeout(()=>window.scrollTo(0,0),300);
    const base="users/"+u.uid+"/";
    resolveDb({doc:p=>fs.doc(base+p),collection:p=>fs.collection(base+p)});
    const pill=document.getElementById("syncPill");
    if(pill&&!pill.dataset.web){pill.dataset.web=1;pill.style.cursor="pointer";pill.title="Signed in as "+u.email+". Tap to sign out.";
      pill.addEventListener("click",()=>{if(confirm("Signed in as "+(auth.currentUser&&auth.currentUser.email)+".\n\nSign out on this device?"))auth.signOut().then(()=>location.reload());});}
  });
  }
})();
