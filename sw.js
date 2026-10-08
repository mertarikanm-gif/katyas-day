const V='katya-v6';
const FILES=['./','index.html','manifest.json','icon-180.png','icon-192.png','icon-512.png','firebase-config.js'];
// tek dosya eksik/erişilemez olsa bile kurulum başarısız olmasın (yoksa bildirim için sw hiç aktifleşmez)
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(FILES.map(f=>c.add(f).catch(()=>{})))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))));self.clients.claim()});
// network-first for the page (so updates arrive), cache fallback offline
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(V).then(x=>x.put(e.request,c));return r})
    .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))));
});
// push (FCM data message from Cloud Functions: baslik, govde, url, tag)
self.addEventListener('push',e=>{
  let p={};try{p=e.data?e.data.json():{}}catch(_){p={data:{govde:e.data&&e.data.text()}}}
  const d=p.data||p;
  e.waitUntil(self.registration.showNotification(d.baslik||"Katya's Day",{
    body:d.govde||'',tag:d.tag||'katya',renotify:true,icon:'./icon-192.png',badge:'./icon-192.png',data:{url:d.url||'./'}}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const url=new URL((e.notification.data&&e.notification.data.url)||'./',self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(L=>{
    for(const c of L){if(c.url.startsWith(self.registration.scope)&&'focus' in c){c.navigate(url).catch(()=>{});return c.focus()}}
    return self.clients.openWindow(url);
  }));
});
