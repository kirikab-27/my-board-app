if (!self.define) {
  let e,
    a = {};
  const s = (s, i) => (
    (s = new URL(s + '.js', i).href),
    a[s] ||
      new Promise((a) => {
        if ('document' in self) {
          const e = document.createElement('script');
          ((e.src = s), (e.onload = a), document.head.appendChild(e));
        } else ((e = s), importScripts(s), a());
      }).then(() => {
        let e = a[s];
        if (!e) throw new Error(`Module ${s} didn’t register its module`);
        return e;
      })
  );
  self.define = (i, c) => {
    const t = e || ('document' in self ? document.currentScript.src : '') || location.href;
    if (a[t]) return;
    let n = {};
    const r = (e) => s(e, t),
      f = { module: { uri: t }, exports: n, require: r };
    a[t] = Promise.all(i.map((e) => f[e] || r(e))).then((e) => (c(...e), n));
  };
}
define(['./workbox-f52fd911'], function (e) {
  'use strict';
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        { url: '/_next/app-build-manifest.json', revision: '4d45c552fb1e8175718733e8928a5c1b' },
        { url: '/_next/dynamic-css-manifest.json', revision: 'd751713988987e9331980363e24189ce' },
        { url: '/_next/static/chunks/1322.da56bcd244f97d30.js', revision: 'da56bcd244f97d30' },
        { url: '/_next/static/chunks/152.3d8c5bbf53d3ba5b.js', revision: '3d8c5bbf53d3ba5b' },
        { url: '/_next/static/chunks/3000-12e8e0f9f8a45124.js', revision: '12e8e0f9f8a45124' },
        { url: '/_next/static/chunks/341-fa95a9c24e5bf013.js', revision: 'fa95a9c24e5bf013' },
        { url: '/_next/static/chunks/4268-d80ea185dd8e29c5.js', revision: 'd80ea185dd8e29c5' },
        { url: '/_next/static/chunks/5449-90f94310b978495d.js', revision: '90f94310b978495d' },
        { url: '/_next/static/chunks/7912-d1143a3940061bd2.js', revision: 'd1143a3940061bd2' },
        { url: '/_next/static/chunks/8488-6d21c5c1dec9b0dc.js', revision: '6d21c5c1dec9b0dc' },
        { url: '/_next/static/chunks/9630-337a359ee945b120.js', revision: '337a359ee945b120' },
        {
          url: '/_next/static/chunks/app/_not-found/page-abf43d7aadbd397c.js',
          revision: 'abf43d7aadbd397c',
        },
        {
          url: '/_next/static/chunks/app/admin/analytics/page-c0663ea3688a670e.js',
          revision: 'c0663ea3688a670e',
        },
        {
          url: '/_next/static/chunks/app/admin/dashboard/page-97281520fd535f72.js',
          revision: '97281520fd535f72',
        },
        {
          url: '/_next/static/chunks/app/admin/layout-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/admin/logs/page-54f798817785d2e7.js',
          revision: '54f798817785d2e7',
        },
        {
          url: '/_next/static/chunks/app/admin/posts/page-9241900e834a4a8f.js',
          revision: '9241900e834a4a8f',
        },
        {
          url: '/_next/static/chunks/app/admin/security/page-eb10cc7a1693e93c.js',
          revision: 'eb10cc7a1693e93c',
        },
        {
          url: '/_next/static/chunks/app/admin/settings/page-c09b39c3a715bd94.js',
          revision: 'c09b39c3a715bd94',
        },
        {
          url: '/_next/static/chunks/app/admin/users/page-d6691264d33e7bff.js',
          revision: 'd6691264d33e7bff',
        },
        {
          url: '/_next/static/chunks/app/admin/verification/page-aa2ae5a50bf831a4.js',
          revision: 'aa2ae5a50bf831a4',
        },
        {
          url: '/_next/static/chunks/app/analytics/dashboard/page-54ce6eb29b7b1602.js',
          revision: '54ce6eb29b7b1602',
        },
        {
          url: '/_next/static/chunks/app/api/admin/posts/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/admin/stats/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/admin/users/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/admin/verification/generate/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/admin/verification/resend/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/admin/verification/verify/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/analytics/dashboard/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/analytics/stats/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/auth/%5B...nextauth%5D/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/auth/rate-limit/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/auth/register/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/auth/resend-verification/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/auth/reset-password/confirm/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/auth/reset-password/request/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/auth/verify-email/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/comments/%5Bid%5D/like/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/comments/%5Bid%5D/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/comments/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/debug/env/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/debug/ip/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/debug/mail/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/dev/reset-rate-limit/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/follow/%5BuserId%5D/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/follow/list/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/follow/requests/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/follow/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/follow/stats/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/hashtags/%5Btag%5D/posts/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/hashtags/%5Btag%5D/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/hashtags/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/hashtags/search/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/hashtags/trending/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/media/hash/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/media/signature/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/media/upload/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/mentions/notify/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/monitoring/connection/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/monitoring/metrics/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/notifications/%5Bid%5D/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/notifications/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/posts/%5Bid%5D/like/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/posts/%5Bid%5D/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/posts/infinite/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/posts/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/posts/search/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/block/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/check/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/mute/check/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/mute/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/notification-settings/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/settings/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/profile/check-username/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/profile/password/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/profile/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/security/audit/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/security/csp-report/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/security/csrf/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/security/stats/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/security/unblock/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/test/email/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/timeline/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/timeline/updates/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5Busername%5D/posts/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/users/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/api/users/search-mentions/route-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
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
          url: '/_next/static/chunks/app/board/%5Bid%5D/edit/page-7bc91a3dfc4713e1.js',
          revision: '7bc91a3dfc4713e1',
        },
        {
          url: '/_next/static/chunks/app/board/%5Bid%5D/page-884477f1e0e6b861.js',
          revision: '884477f1e0e6b861',
        },
        {
          url: '/_next/static/chunks/app/board/create/page-33e99907e474d82e.js',
          revision: '33e99907e474d82e',
        },
        {
          url: '/_next/static/chunks/app/board/loading-2f80746d48c76d18.js',
          revision: '2f80746d48c76d18',
        },
        {
          url: '/_next/static/chunks/app/board/page-3a919710c45da57d.js',
          revision: '3a919710c45da57d',
        },
        {
          url: '/_next/static/chunks/app/dashboard/loading-85f17b4e2f541395.js',
          revision: '85f17b4e2f541395',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-2919f7e81d2f6039.js',
          revision: '2919f7e81d2f6039',
        },
        {
          url: '/_next/static/chunks/app/hashtags/%5Btag%5D/page-7a743d40193a962b.js',
          revision: '7a743d40193a962b',
        },
        {
          url: '/_next/static/chunks/app/hashtags/page-3de5ce0055f35ac4.js',
          revision: '3de5ce0055f35ac4',
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
          url: '/_next/static/chunks/app/login/page-692743422fa6738d.js',
          revision: '692743422fa6738d',
        },
        {
          url: '/_next/static/chunks/app/members-only/page-b08c302ee0b9d1b5.js',
          revision: 'b08c302ee0b9d1b5',
        },
        {
          url: '/_next/static/chunks/app/members/page-6efe46f0715a80c7.js',
          revision: '6efe46f0715a80c7',
        },
        {
          url: '/_next/static/chunks/app/monitoring/dashboard/page-db96e429b953aaf9.js',
          revision: 'db96e429b953aaf9',
        },
        {
          url: '/_next/static/chunks/app/notifications/page-accb4caf575fcb77.js',
          revision: 'accb4caf575fcb77',
        },
        { url: '/_next/static/chunks/app/page-c3cd526c5a8cbe87.js', revision: 'c3cd526c5a8cbe87' },
        {
          url: '/_next/static/chunks/app/profile/edit/page-e15fb7b8bcb9a049.js',
          revision: 'e15fb7b8bcb9a049',
        },
        {
          url: '/_next/static/chunks/app/profile/loading-7c307190af0bf9cb.js',
          revision: '7c307190af0bf9cb',
        },
        {
          url: '/_next/static/chunks/app/profile/page-dcb512fb2598a0a4.js',
          revision: 'dcb512fb2598a0a4',
        },
        {
          url: '/_next/static/chunks/app/profile/password/page-2befa354a1189b62.js',
          revision: '2befa354a1189b62',
        },
        {
          url: '/_next/static/chunks/app/profile/privacy/page-be7f0291b465c216.js',
          revision: 'be7f0291b465c216',
        },
        {
          url: '/_next/static/chunks/app/register/page-67f8bea7adb35132.js',
          revision: '67f8bea7adb35132',
        },
        {
          url: '/_next/static/chunks/app/timeline/page-89c75e39ea6772e2.js',
          revision: '89c75e39ea6772e2',
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
          url: '/_next/static/chunks/app/users/page-ff10711a4b2c143e.js',
          revision: 'ff10711a4b2c143e',
        },
        {
          url: '/_next/static/chunks/app/users/search/page-122b4da3c1132113.js',
          revision: '122b4da3c1132113',
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
          url: '/_next/static/chunks/mui-2517f304-d58677daf2ec0462.js',
          revision: 'd58677daf2ec0462',
        },
        {
          url: '/_next/static/chunks/mui-35130889-96c5528dd0b2f2b6.js',
          revision: '96c5528dd0b2f2b6',
        },
        {
          url: '/_next/static/chunks/mui-5311f7c3-d2457ae053c293b0.js',
          revision: 'd2457ae053c293b0',
        },
        {
          url: '/_next/static/chunks/mui-837a64b6-66b1116b3538bb87.js',
          revision: '66b1116b3538bb87',
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
          url: '/_next/static/chunks/mui-d07eb308-78c019eab5a98c98.js',
          revision: '78c019eab5a98c98',
        },
        {
          url: '/_next/static/chunks/mui-f934a527-23827e14d978b4fd.js',
          revision: '23827e14d978b4fd',
        },
        {
          url: '/_next/static/chunks/mui-fa51799d-a3c2729299ad4174.js',
          revision: 'a3c2729299ad4174',
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
          url: '/_next/static/chunks/utils-493c5c7c-10fa1121e2c22234.js',
          revision: '10fa1121e2c22234',
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
          url: '/_next/static/chunks/vendors-ad6a2f20-07e1536d39846b76.js',
          revision: '07e1536d39846b76',
        },
        {
          url: '/_next/static/chunks/vendors-c0d76f48-008a2672663909c0.js',
          revision: '008a2672663909c0',
        },
        {
          url: '/_next/static/chunks/vendors-eb2fbf4c-8d2042ad87c17718.js',
          revision: '8d2042ad87c17718',
        },
        { url: '/_next/static/chunks/webpack-67902cb519b733d5.js', revision: '67902cb519b733d5' },
        {
          url: '/_next/static/d1lzEpRF3-5Mei-aUJdny/_buildManifest.js',
          revision: 'ab2ddd0e4348261ac6793eb21cc8dd05',
        },
        {
          url: '/_next/static/d1lzEpRF3-5Mei-aUJdny/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
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
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      '/',
      new e.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({ request: e, response: a, event: s, state: i }) =>
              a && 'opaqueredirect' === a.type
                ? new Response(a.body, { status: 200, statusText: 'OK', headers: a.headers })
                : a,
          },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^.*\/api\/posts.*$/,
      new e.NetworkFirst({
        cacheName: 'api-posts',
        networkTimeoutSeconds: 3,
        plugins: [new e.ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 })],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:png|jpg|jpeg|webp|avif|gif|svg|ico)$/,
      new e.CacheFirst({
        cacheName: 'images',
        plugins: [new e.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 86400 })],
      }),
      'GET'
    ),
    e.registerRoute(
      /\/_next\/static\/.*/,
      new e.CacheFirst({
        cacheName: 'static-assets',
        plugins: [new e.ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 604800 })],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https?.*/,
      new e.NetworkFirst({
        cacheName: 'offlineCache',
        networkTimeoutSeconds: 3,
        plugins: [new e.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 3600 })],
      }),
      'GET'
    ));
});
