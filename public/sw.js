if (!self.define) {
  let a,
    e = {};
  const s = (s, i) => (
    (s = new URL(s + '.js', i).href),
    e[s] ||
      new Promise((e) => {
        if ('document' in self) {
          const a = document.createElement('script');
          ((a.src = s), (a.onload = e), document.head.appendChild(a));
        } else ((a = s), importScripts(s), e());
      }).then(() => {
        let a = e[s];
        if (!a) throw new Error(`Module ${s} didn’t register its module`);
        return a;
      })
  );
  self.define = (i, c) => {
    const t = a || ('document' in self ? document.currentScript.src : '') || location.href;
    if (e[t]) return;
    let n = {};
    const r = (a) => s(a, t),
      u = { module: { uri: t }, exports: n, require: r };
    e[t] = Promise.all(i.map((a) => u[a] || r(a))).then((a) => (c(...a), n));
  };
}
define(['./workbox-f52fd911'], function (a) {
  'use strict';
  (importScripts(),
    self.skipWaiting(),
    a.clientsClaim(),
    a.precacheAndRoute(
      [
        { url: '/_next/app-build-manifest.json', revision: 'eccac56bbb87f1526389d1cd3ef86746' },
        { url: '/_next/dynamic-css-manifest.json', revision: 'd751713988987e9331980363e24189ce' },
        {
          url: '/_next/static/HBXkDcZtC-qALeVr4je97/_buildManifest.js',
          revision: 'e11c20232243dae9b34ac2f66365e105',
        },
        {
          url: '/_next/static/HBXkDcZtC-qALeVr4je97/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        { url: '/_next/static/chunks/1322.ff7af74684a0c9a8.js', revision: 'ff7af74684a0c9a8' },
        { url: '/_next/static/chunks/152.3d8c5bbf53d3ba5b.js', revision: '3d8c5bbf53d3ba5b' },
        { url: '/_next/static/chunks/3277-4faabe69293da441.js', revision: '4faabe69293da441' },
        { url: '/_next/static/chunks/341-b2e31f848390c317.js', revision: 'b2e31f848390c317' },
        { url: '/_next/static/chunks/4268-d80ea185dd8e29c5.js', revision: 'd80ea185dd8e29c5' },
        { url: '/_next/static/chunks/6221-7f2cbe71052deeaf.js', revision: '7f2cbe71052deeaf' },
        { url: '/_next/static/chunks/7511.b5ef788967f94f59.js', revision: 'b5ef788967f94f59' },
        { url: '/_next/static/chunks/7912-4199e50face54c9b.js', revision: '4199e50face54c9b' },
        { url: '/_next/static/chunks/8488-8b1ce5aad54fe770.js', revision: '8b1ce5aad54fe770' },
        { url: '/_next/static/chunks/8509-2985a94f80daba3a.js', revision: '2985a94f80daba3a' },
        {
          url: '/_next/static/chunks/app/_not-found/page-abf43d7aadbd397c.js',
          revision: 'abf43d7aadbd397c',
        },
        {
          url: '/_next/static/chunks/app/admin/security/page-eb10cc7a1693e93c.js',
          revision: 'eb10cc7a1693e93c',
        },
        {
          url: '/_next/static/chunks/app/analytics/dashboard/page-47ec115a4ebf23eb.js',
          revision: '47ec115a4ebf23eb',
        },
        {
          url: '/_next/static/chunks/app/api/analytics/dashboard/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/auth/%5B...nextauth%5D/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/auth/rate-limit/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/auth/register/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/auth/reset-password/confirm/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/auth/reset-password/request/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/auth/verify-email/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/comments/%5Bid%5D/like/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/comments/%5Bid%5D/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/comments/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/debug/env/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/debug/ip/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/debug/mail/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/dev/reset-rate-limit/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/follow/%5BuserId%5D/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/follow/list/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/follow/requests/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/follow/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/follow/stats/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/hashtags/%5Btag%5D/posts/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/hashtags/%5Btag%5D/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/hashtags/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/hashtags/search/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/hashtags/trending/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/media/hash/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/media/upload/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/mentions/notify/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/monitoring/connection/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/monitoring/metrics/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/notifications/%5Bid%5D/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/notifications/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/posts/%5Bid%5D/like/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/posts/%5Bid%5D/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/posts/infinite/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/posts/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/posts/search/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/block/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/check/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/mute/check/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/mute/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/notification-settings/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/settings/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/profile/check-username/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/profile/password/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/profile/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/security/audit/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/security/csp-report/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/security/csrf/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/security/stats/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/security/unblock/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/test/email/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/timeline/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/timeline/updates/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5Busername%5D/posts/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/users/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/api/users/search-mentions/route-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/auth/error/page-446cfd13bf73d6f5.js',
          revision: '446cfd13bf73d6f5',
        },
        {
          url: '/_next/static/chunks/app/auth/forgot-password/page-4b93e343641521cf.js',
          revision: '4b93e343641521cf',
        },
        {
          url: '/_next/static/chunks/app/auth/reset-password/page-ba2d79e84405a6e1.js',
          revision: 'ba2d79e84405a6e1',
        },
        {
          url: '/_next/static/chunks/app/auth/verified/page-f9394d707878b5d8.js',
          revision: 'f9394d707878b5d8',
        },
        {
          url: '/_next/static/chunks/app/board/%5Bid%5D/edit/page-2f42280e09e369f4.js',
          revision: '2f42280e09e369f4',
        },
        {
          url: '/_next/static/chunks/app/board/%5Bid%5D/page-880306e94ecb9e75.js',
          revision: '880306e94ecb9e75',
        },
        {
          url: '/_next/static/chunks/app/board/create/page-d8afc5c3d0231726.js',
          revision: 'd8afc5c3d0231726',
        },
        {
          url: '/_next/static/chunks/app/board/loading-2f80746d48c76d18.js',
          revision: '2f80746d48c76d18',
        },
        {
          url: '/_next/static/chunks/app/board/page-b331648ff317d4f8.js',
          revision: 'b331648ff317d4f8',
        },
        {
          url: '/_next/static/chunks/app/dashboard/loading-85f17b4e2f541395.js',
          revision: '85f17b4e2f541395',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-c4ea26c8eeb3b2e0.js',
          revision: 'c4ea26c8eeb3b2e0',
        },
        {
          url: '/_next/static/chunks/app/hashtags/%5Btag%5D/page-ae68e83c2faa5ddd.js',
          revision: 'ae68e83c2faa5ddd',
        },
        {
          url: '/_next/static/chunks/app/hashtags/page-10151abe480f2b77.js',
          revision: '10151abe480f2b77',
        },
        {
          url: '/_next/static/chunks/app/layout-3a83327c2e2badc3.js',
          revision: '3a83327c2e2badc3',
        },
        {
          url: '/_next/static/chunks/app/loading-1752966bd01b3f14.js',
          revision: '1752966bd01b3f14',
        },
        {
          url: '/_next/static/chunks/app/login/page-f97e4668a8a96f8d.js',
          revision: 'f97e4668a8a96f8d',
        },
        {
          url: '/_next/static/chunks/app/members-only/page-b08c302ee0b9d1b5.js',
          revision: 'b08c302ee0b9d1b5',
        },
        {
          url: '/_next/static/chunks/app/members/page-845bc520451fa144.js',
          revision: '845bc520451fa144',
        },
        {
          url: '/_next/static/chunks/app/monitoring/dashboard/page-db96e429b953aaf9.js',
          revision: 'db96e429b953aaf9',
        },
        {
          url: '/_next/static/chunks/app/notifications/page-46a180db0ed4256e.js',
          revision: '46a180db0ed4256e',
        },
        { url: '/_next/static/chunks/app/page-c3cd526c5a8cbe87.js', revision: 'c3cd526c5a8cbe87' },
        {
          url: '/_next/static/chunks/app/profile/edit/page-f59e07370045675d.js',
          revision: 'f59e07370045675d',
        },
        {
          url: '/_next/static/chunks/app/profile/loading-7c307190af0bf9cb.js',
          revision: '7c307190af0bf9cb',
        },
        {
          url: '/_next/static/chunks/app/profile/page-c3613881cc902d33.js',
          revision: 'c3613881cc902d33',
        },
        {
          url: '/_next/static/chunks/app/profile/password/page-17c49f0277ba6d91.js',
          revision: '17c49f0277ba6d91',
        },
        {
          url: '/_next/static/chunks/app/profile/privacy/page-2c9aa51c29f35c21.js',
          revision: '2c9aa51c29f35c21',
        },
        {
          url: '/_next/static/chunks/app/register/page-10a7d0219ef982be.js',
          revision: '10a7d0219ef982be',
        },
        {
          url: '/_next/static/chunks/app/timeline/page-7787c7838925367b.js',
          revision: '7787c7838925367b',
        },
        {
          url: '/_next/static/chunks/app/unauthorized/page-695f0f0e1fc06a52.js',
          revision: '695f0f0e1fc06a52',
        },
        {
          url: '/_next/static/chunks/app/users/%5Busername%5D/posts/page-f9ed7edd9f5c661b.js',
          revision: 'f9ed7edd9f5c661b',
        },
        {
          url: '/_next/static/chunks/app/users/page-906f5c677a06cd6f.js',
          revision: '906f5c677a06cd6f',
        },
        {
          url: '/_next/static/chunks/app/users/search/page-77c887af493b681b.js',
          revision: '77c887af493b681b',
        },
        { url: '/_next/static/chunks/auth-0883b44ef58de139.js', revision: '0883b44ef58de139' },
        {
          url: '/_next/static/chunks/chartjs-37a9e32c.9dc6a4b4bdd89fd8.js',
          revision: '9dc6a4b4bdd89fd8',
        },
        {
          url: '/_next/static/chunks/chartjs-ad6a2f20.b84b5cb129565eba.js',
          revision: 'b84b5cb129565eba',
        },
        {
          url: '/_next/static/chunks/framework-27f02048-cba846b075980900.js',
          revision: 'cba846b075980900',
        },
        {
          url: '/_next/static/chunks/framework-89d5c698-4e34ef25cc35b80d.js',
          revision: '4e34ef25cc35b80d',
        },
        {
          url: '/_next/static/chunks/framework-98a6762f-339433a2a8b6707a.js',
          revision: '339433a2a8b6707a',
        },
        {
          url: '/_next/static/chunks/framework-cfb98476-8efcb6212d613799.js',
          revision: '8efcb6212d613799',
        },
        { url: '/_next/static/chunks/main-6a22c921604f9d0e.js', revision: '6a22c921604f9d0e' },
        { url: '/_next/static/chunks/main-app-2c4edb447a856d69.js', revision: '2c4edb447a856d69' },
        {
          url: '/_next/static/chunks/mui-2517f304-d52786fe57abb4e2.js',
          revision: 'd52786fe57abb4e2',
        },
        {
          url: '/_next/static/chunks/mui-35130889-e4501dd74d0fc792.js',
          revision: 'e4501dd74d0fc792',
        },
        {
          url: '/_next/static/chunks/mui-5311f7c3-2a75ad540a36e318.js',
          revision: '2a75ad540a36e318',
        },
        {
          url: '/_next/static/chunks/mui-837a64b6-b1461607b8572877.js',
          revision: 'b1461607b8572877',
        },
        {
          url: '/_next/static/chunks/mui-9342a3d7-38fb0524b714684a.js',
          revision: '38fb0524b714684a',
        },
        {
          url: '/_next/static/chunks/mui-b199ba2a-dd1882dfdcc71699.js',
          revision: 'dd1882dfdcc71699',
        },
        {
          url: '/_next/static/chunks/mui-cd1bebcf-a8343c1291500180.js',
          revision: 'a8343c1291500180',
        },
        {
          url: '/_next/static/chunks/mui-d07eb308-10dd9b4229386206.js',
          revision: '10dd9b4229386206',
        },
        {
          url: '/_next/static/chunks/mui-f934a527-109c00f0a1d44fa7.js',
          revision: '109c00f0a1d44fa7',
        },
        {
          url: '/_next/static/chunks/mui-fa51799d-7ccfeed5392a9126.js',
          revision: '7ccfeed5392a9126',
        },
        {
          url: '/_next/static/chunks/pages/_app-5fcdb32f604b0bc6.js',
          revision: '5fcdb32f604b0bc6',
        },
        {
          url: '/_next/static/chunks/pages/_error-f018a2148150cb85.js',
          revision: 'f018a2148150cb85',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/utils-0cf16438-de099e4b7622f60f.js',
          revision: 'de099e4b7622f60f',
        },
        {
          url: '/_next/static/chunks/utils-2c47738d-8f862aaf1b6f5175.js',
          revision: '8f862aaf1b6f5175',
        },
        {
          url: '/_next/static/chunks/utils-47916db1-87b01d2c41f61c59.js',
          revision: '87b01d2c41f61c59',
        },
        {
          url: '/_next/static/chunks/utils-493c5c7c-97d7bd2aa8506d53.js',
          revision: '97d7bd2aa8506d53',
        },
        {
          url: '/_next/static/chunks/utils-6105cdde-2b832f8f0103fda4.js',
          revision: '2b832f8f0103fda4',
        },
        {
          url: '/_next/static/chunks/utils-687d5bd9-090d13b84f6e2d4d.js',
          revision: '090d13b84f6e2d4d',
        },
        {
          url: '/_next/static/chunks/utils-be0c59e0-503a181a872f321d.js',
          revision: '503a181a872f321d',
        },
        {
          url: '/_next/static/chunks/vendors-89d5c698-dd245b4449705f5c.js',
          revision: 'dd245b4449705f5c',
        },
        {
          url: '/_next/static/chunks/vendors-8cbd2506-0edea4113b528898.js',
          revision: '0edea4113b528898',
        },
        {
          url: '/_next/static/chunks/vendors-ad6a2f20-007132a4e8325381.js',
          revision: '007132a4e8325381',
        },
        {
          url: '/_next/static/chunks/vendors-c0d76f48-008a2672663909c0.js',
          revision: '008a2672663909c0',
        },
        {
          url: '/_next/static/chunks/vendors-eb2fbf4c-8d2042ad87c17718.js',
          revision: '8d2042ad87c17718',
        },
        { url: '/_next/static/chunks/webpack-ede62a202fac4c36.js', revision: 'ede62a202fac4c36' },
        { url: '/file.svg', revision: 'd09f95206c3fa0bb9bd9fefabfd0ea71' },
        { url: '/globe.svg', revision: '2aaafa6a49b6563925fe440891e32717' },
        { url: '/icons/icon-192x192.png', revision: '63f5de6a958bbf7547232b8635ede47f' },
        { url: '/icons/icon-192x192.svg', revision: '2d524238dfab2c56c1e2c0d5f37c9f8c' },
        { url: '/icons/icon-512x512.png', revision: 'b4f9015b82d88d1522fe8fa9f293a8e9' },
        { url: '/icons/icon-512x512.svg', revision: '4dde411f9a1b26efc4d977c86af315ff' },
        { url: '/icons/icon.svg', revision: '3288bc2df35bb307598afffeb5e2a1fd' },
        { url: '/manifest.json', revision: 'a81a545c2550705e8ba12d90f201ab3a' },
        { url: '/next.svg', revision: '8e061864f388b47f33a1c3780831193e' },
        { url: '/vercel.svg', revision: 'c0af2f507b369b085b35ef4bbe3bcf1e' },
        { url: '/window.svg', revision: 'a2760511c65806022ad20adf74370ff3' },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    a.cleanupOutdatedCaches(),
    a.registerRoute(
      '/',
      new a.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({ request: a, response: e, event: s, state: i }) =>
              e && 'opaqueredirect' === e.type
                ? new Response(e.body, { status: 200, statusText: 'OK', headers: e.headers })
                : e,
          },
        ],
      }),
      'GET'
    ),
    a.registerRoute(
      /^.*\/api\/posts.*$/,
      new a.NetworkFirst({
        cacheName: 'api-posts',
        networkTimeoutSeconds: 3,
        plugins: [new a.ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 })],
      }),
      'GET'
    ),
    a.registerRoute(
      /\.(?:png|jpg|jpeg|webp|avif|gif|svg|ico)$/,
      new a.CacheFirst({
        cacheName: 'images',
        plugins: [new a.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 86400 })],
      }),
      'GET'
    ),
    a.registerRoute(
      /\/_next\/static\/.*/,
      new a.CacheFirst({
        cacheName: 'static-assets',
        plugins: [new a.ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 604800 })],
      }),
      'GET'
    ),
    a.registerRoute(
      /^https?.*/,
      new a.NetworkFirst({
        cacheName: 'offlineCache',
        networkTimeoutSeconds: 3,
        plugins: [new a.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 3600 })],
      }),
      'GET'
    ));
});
