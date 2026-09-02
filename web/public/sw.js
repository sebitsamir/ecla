const CACHE = 'ecla-static-v1'
const SHELL = ['/offline.html', '/favicon.svg', '/manifest.webmanifest']
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))))
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))))
self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.includes('sign-')) return
  if (url.pathname.startsWith('/_next/static/') || /\.(?:svg|png|webp|woff2?)$/.test(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(request)) || fetch(request).then(response => { if (response.ok) cache.put(request, response.clone()); return response })))
    return
  }
  if (request.mode === 'navigate') event.respondWith(fetch(request).catch(() => caches.match('/offline.html')))
})
