/* 案例標記工具 Service Worker
   策略：network-first（線上永遠拿最新版，離線才回退快取），確保部署即時生效。 */
var CACHE = "cm-v1_6";
var CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./vendor/heic2any.min.js",
  "./vendor/fflate.min.js",
  "./vendor/pptxgen.bundle.js"
];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(CORE).catch(function(){}); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  e.respondWith(
    fetch(req).then(function(res){
      if(res && res.ok && req.url.indexOf(self.location.origin) === 0){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
      }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(m){ return m || caches.match("./index.html"); });
    })
  );
});
