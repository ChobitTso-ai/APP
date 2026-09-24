/* 牙外傷處置指南 Service Worker
   策略：network-first（線上永遠拿最新版，離線才回退快取），確保部署即時生效。
   插圖是逐張補上的，所以 CORE 只放一定存在的檔案；assets/ 底下的圖
   由 fetch 事件在第一次成功載入時順手快取，缺圖不會讓 install 整個失敗。 */
var CACHE = "dtg-v1_1";
var CORE = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./data/common.js",
  "./data/permanent.js",
  "./data/primary.js",
  "./manifest.webmanifest"
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
