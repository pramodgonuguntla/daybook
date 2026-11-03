/* Family Daybook service worker: lets the app open with no signal. */
const CACHE='daybook-v12';
const SHELL=['./','./index.html','./firebase-config.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const timeout=(p,ms)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('t')),ms))]);
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const u=new URL(req.url);
  const same=u.origin===self.location.origin;
  const lib=u.hostname==='www.gstatic.com'&&u.pathname.startsWith('/firebasejs/');
  const font=u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com';
  if(!(same||lib||font))return; /* data traffic goes straight to Firebase */
  if(same){ /* app files: fresh when online, cached when not */
    e.respondWith((async()=>{const c=await caches.open(CACHE);
      try{const r=await timeout(fetch(req),4000);if(r&&r.ok)c.put(req,r.clone());return r}
      catch(err){return (await c.match(req,{ignoreSearch:true}))||(await c.match('./index.html'))||Response.error()}})());
    return}
  /* libraries and fonts: cache first */
  e.respondWith((async()=>{const c=await caches.open(CACHE);const hit=await c.match(req);
    const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone());return r}).catch(()=>null);
    return hit||(await net)||Response.error()})());
});
