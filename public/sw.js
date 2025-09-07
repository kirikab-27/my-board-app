if (!self.define) {
  let e,
    a = {};
  const d = (d, s) => (
    (d = new URL(d + '.js', s).href),
    a[d] ||
      new Promise((a) => {
        if ('document' in self) {
          const e = document.createElement('script');
          ((e.src = d), (e.onload = a), document.head.appendChild(e));
        } else ((e = d), importScripts(d), a());
      }).then(() => {
        let e = a[d];
        if (!e) throw new Error(`Module ${d} didn’t register its module`);
        return e;
      })
  );
  self.define = (s, i) => {
    const t = e || ('document' in self ? document.currentScript.src : '') || location.href;
    if (a[t]) return;
    let n = {};
    const c = (e) => d(e, t),
      r = { module: { uri: t }, exports: n, require: c };
    a[t] = Promise.all(s.map((e) => r[e] || c(e))).then((e) => (i(...e), n));
  };
}
define(['./workbox-f52fd911'], function (e) {
  'use strict';
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        { url: '/_next/app-build-manifest.json', revision: '5bd0b9ac1cac5ea46e18481fda1df2ac' },
        { url: '/_next/dynamic-css-manifest.json', revision: 'd751713988987e9331980363e24189ce' },
        {
          url: '/_next/static/0o-TYwq1PtuAokFKVJItO/_buildManifest.js',
          revision: 'e35467873ffbf027332d33c33d286f50',
        },
        {
          url: '/_next/static/0o-TYwq1PtuAokFKVJItO/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        { url: '/_next/static/chunks/1322.da56bcd244f97d30.js', revision: 'da56bcd244f97d30' },
        { url: '/_next/static/chunks/152.3d8c5bbf53d3ba5b.js', revision: '3d8c5bbf53d3ba5b' },
        { url: '/_next/static/chunks/3000-3a6cefc681f7f94c.js', revision: '3a6cefc681f7f94c' },
        { url: '/_next/static/chunks/341-fa95a9c24e5bf013.js', revision: 'fa95a9c24e5bf013' },
        { url: '/_next/static/chunks/4268-d80ea185dd8e29c5.js', revision: 'd80ea185dd8e29c5' },
        { url: '/_next/static/chunks/5449-90f94310b978495d.js', revision: '90f94310b978495d' },
        { url: '/_next/static/chunks/7912-d1143a3940061bd2.js', revision: 'd1143a3940061bd2' },
        { url: '/_next/static/chunks/8488-0788498dcf393e2b.js', revision: '0788498dcf393e2b' },
        { url: '/_next/static/chunks/9630-f7cdd106fa9fbb03.js', revision: 'f7cdd106fa9fbb03' },
        {
          url: '/_next/static/chunks/app/_not-found/page-abf43d7aadbd397c.js',
          revision: 'abf43d7aadbd397c',
        },
        {
          url: '/_next/static/chunks/app/admin/analytics/page-4fb51fa8a3e7bb2f.js',
          revision: '4fb51fa8a3e7bb2f',
        },
        {
          url: '/_next/static/chunks/app/admin/audit-logs/page-a16a26bcc1a55ec3.js',
          revision: 'a16a26bcc1a55ec3',
        },
        {
          url: '/_next/static/chunks/app/admin/dashboard/enhanced/page-7a2dfd0859922bf8.js',
          revision: '7a2dfd0859922bf8',
        },
        {
          url: '/_next/static/chunks/app/admin/dashboard/page-37bd402ba1e2622e.js',
          revision: '37bd402ba1e2622e',
        },
        {
          url: '/_next/static/chunks/app/admin/layout-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/admin/logs/page-022106a50204d9d7.js',
          revision: '022106a50204d9d7',
        },
        {
          url: '/_next/static/chunks/app/admin/posts/page-45c26fba4e97a6ba.js',
          revision: '45c26fba4e97a6ba',
        },
        {
          url: '/_next/static/chunks/app/admin/secrets/page-a0c98827dd783693.js',
          revision: 'a0c98827dd783693',
        },
        {
          url: '/_next/static/chunks/app/admin/security/2fa/page-366e6342e01ecc4b.js',
          revision: '366e6342e01ecc4b',
        },
        {
          url: '/_next/static/chunks/app/admin/security/page-957d5e8885c6cf50.js',
          revision: '957d5e8885c6cf50',
        },
        {
          url: '/_next/static/chunks/app/admin/sessions/page-455d1793dd17e24d.js',
          revision: '455d1793dd17e24d',
        },
        {
          url: '/_next/static/chunks/app/admin/settings/page-d6d3de6ccd41ffb2.js',
          revision: 'd6d3de6ccd41ffb2',
        },
        {
          url: '/_next/static/chunks/app/admin/users/page-39667da90f520d03.js',
          revision: '39667da90f520d03',
        },
        {
          url: '/_next/static/chunks/app/admin/verification/page-203b872095dbbce2.js',
          revision: '203b872095dbbce2',
        },
        {
          url: '/_next/static/chunks/app/analytics/dashboard/page-f324e7f92727ae97.js',
          revision: 'f324e7f92727ae97',
        },
        {
          url: '/_next/static/chunks/app/api/admin/2fa/disable/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/admin/2fa/enable/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/admin/2fa/setup/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/admin/2fa/status/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/admin/2fa/verify/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/admin/audit-logs/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/admin/posts/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/admin/secrets/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/admin/sessions/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/admin/stats/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/admin/users/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/admin/verification/generate/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/admin/verification/resend/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/admin/verification/verify/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/analytics/dashboard/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/analytics/stats/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/auth/%5B...nextauth%5D/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/auth/rate-limit/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/auth/register/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/auth/resend-verification/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/auth/reset-password/confirm/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/auth/reset-password/request/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/auth/verify-email/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/comments/%5Bid%5D/like/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/comments/%5Bid%5D/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/comments/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/debug/env/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/debug/ip/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/debug/mail/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/dev/reset-rate-limit/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/follow/%5BuserId%5D/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/follow/list/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/follow/requests/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/follow/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/follow/stats/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/hashtags/%5Btag%5D/posts/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/hashtags/%5Btag%5D/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/hashtags/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/hashtags/search/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/hashtags/trending/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/media/hash/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/media/signature/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/media/upload/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/mentions/notify/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/monitoring/connection/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/monitoring/metrics/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/notifications/%5Bid%5D/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/notifications/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/posts/%5Bid%5D/like/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/posts/%5Bid%5D/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/posts/infinite/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/posts/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/posts/search/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/block/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/check/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/mute/check/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/mute/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/notification-settings/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/settings/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/profile/check-username/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/profile/password/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/profile/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/security/audit/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/security/csp-report/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/security/csrf/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/security/stats/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/security/unblock/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/test/email/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/timeline/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/timeline/updates/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5Busername%5D/posts/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/users/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/api/users/search-mentions/route-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/auth/2fa/page-920670aab9e82835.js',
          revision: '920670aab9e82835',
        },
        {
          url: '/_next/static/chunks/app/auth/error/page-0f30041f192ecf9f.js',
          revision: '0f30041f192ecf9f',
        },
        {
          url: '/_next/static/chunks/app/auth/forgot-password/page-4f85fe3c3e0adbbf.js',
          revision: '4f85fe3c3e0adbbf',
        },
        {
          url: '/_next/static/chunks/app/auth/reset-password/page-bbf9916df374c975.js',
          revision: 'bbf9916df374c975',
        },
        {
          url: '/_next/static/chunks/app/auth/verified/page-84b3f6d44c37c381.js',
          revision: '84b3f6d44c37c381',
        },
        {
          url: '/_next/static/chunks/app/board/%5Bid%5D/edit/page-4b50db022a69c0bd.js',
          revision: '4b50db022a69c0bd',
        },
        {
          url: '/_next/static/chunks/app/board/%5Bid%5D/page-2eb90b66f604d529.js',
          revision: '2eb90b66f604d529',
        },
        {
          url: '/_next/static/chunks/app/board/create/page-2b19764065cd7b34.js',
          revision: '2b19764065cd7b34',
        },
        {
          url: '/_next/static/chunks/app/board/loading-0331dd622ad18f83.js',
          revision: '0331dd622ad18f83',
        },
        {
          url: '/_next/static/chunks/app/board/page-9f757ab858ed34f0.js',
          revision: '9f757ab858ed34f0',
        },
        {
          url: '/_next/static/chunks/app/dashboard/loading-66440c8eaa4c8c49.js',
          revision: '66440c8eaa4c8c49',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-32209f8d50ed39ad.js',
          revision: '32209f8d50ed39ad',
        },
        {
          url: '/_next/static/chunks/app/hashtags/%5Btag%5D/page-f6caedaa6b82566f.js',
          revision: 'f6caedaa6b82566f',
        },
        {
          url: '/_next/static/chunks/app/hashtags/page-40478eb58ea239ac.js',
          revision: '40478eb58ea239ac',
        },
        {
          url: '/_next/static/chunks/app/layout-340e53ccc1c3f3d6.js',
          revision: '340e53ccc1c3f3d6',
        },
        {
          url: '/_next/static/chunks/app/loading-eb1be1a6f5d4579d.js',
          revision: 'eb1be1a6f5d4579d',
        },
        {
          url: '/_next/static/chunks/app/login/page-33929c6d42e722df.js',
          revision: '33929c6d42e722df',
        },
        {
          url: '/_next/static/chunks/app/members-only/page-3a2efdb2a632512e.js',
          revision: '3a2efdb2a632512e',
        },
        {
          url: '/_next/static/chunks/app/members/page-08de19bdd326f6ad.js',
          revision: '08de19bdd326f6ad',
        },
        {
          url: '/_next/static/chunks/app/monitoring/dashboard/page-b3ebb2f90bcbc900.js',
          revision: 'b3ebb2f90bcbc900',
        },
        {
          url: '/_next/static/chunks/app/notifications/page-5081ae10cc925da5.js',
          revision: '5081ae10cc925da5',
        },
        { url: '/_next/static/chunks/app/page-6643b445279a350b.js', revision: '6643b445279a350b' },
        {
          url: '/_next/static/chunks/app/profile/edit/page-4841fe8e62041bbb.js',
          revision: '4841fe8e62041bbb',
        },
        {
          url: '/_next/static/chunks/app/profile/loading-72f1528d3e39d7d4.js',
          revision: '72f1528d3e39d7d4',
        },
        {
          url: '/_next/static/chunks/app/profile/page-bedec8e33204dd4c.js',
          revision: 'bedec8e33204dd4c',
        },
        {
          url: '/_next/static/chunks/app/profile/password/page-32b68f58d1a6eb3c.js',
          revision: '32b68f58d1a6eb3c',
        },
        {
          url: '/_next/static/chunks/app/profile/privacy/page-eea5636ff880e062.js',
          revision: 'eea5636ff880e062',
        },
        {
          url: '/_next/static/chunks/app/register/page-7c27852e56c6d6b4.js',
          revision: '7c27852e56c6d6b4',
        },
        {
          url: '/_next/static/chunks/app/timeline/page-ba7a31885bfb5ed6.js',
          revision: 'ba7a31885bfb5ed6',
        },
        {
          url: '/_next/static/chunks/app/unauthorized/page-46655ee1a00c9008.js',
          revision: '46655ee1a00c9008',
        },
        {
          url: '/_next/static/chunks/app/users/%5Busername%5D/posts/page-f473e15ba02473bb.js',
          revision: 'f473e15ba02473bb',
        },
        {
          url: '/_next/static/chunks/app/users/page-d3d95a58407dd484.js',
          revision: 'd3d95a58407dd484',
        },
        {
          url: '/_next/static/chunks/app/users/search/page-e3891330fbb51cdd.js',
          revision: 'e3891330fbb51cdd',
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
          url: '/_next/static/chunks/mui-2517f304-e78eaea1646a0d47.js',
          revision: 'e78eaea1646a0d47',
        },
        {
          url: '/_next/static/chunks/mui-5311f7c3-e06e8186b320d9e2.js',
          revision: 'e06e8186b320d9e2',
        },
        {
          url: '/_next/static/chunks/mui-837a64b6-0c0e9934c4022ac7.js',
          revision: '0c0e9934c4022ac7',
        },
        {
          url: '/_next/static/chunks/mui-9342a3d7-33cd1e26165443eb.js',
          revision: '33cd1e26165443eb',
        },
        {
          url: '/_next/static/chunks/mui-b199ba2a-d87c12f7fbbe8818.js',
          revision: 'd87c12f7fbbe8818',
        },
        {
          url: '/_next/static/chunks/mui-cd1bebcf-a8343c1291500180.js',
          revision: 'a8343c1291500180',
        },
        {
          url: '/_next/static/chunks/mui-d07eb308-e306d4903a0acf31.js',
          revision: 'e306d4903a0acf31',
        },
        {
          url: '/_next/static/chunks/mui-d5a2c1ce-a1e1e0691d4fd6ba.js',
          revision: 'a1e1e0691d4fd6ba',
        },
        {
          url: '/_next/static/chunks/mui-f934a527-8616d90d39586713.js',
          revision: '8616d90d39586713',
        },
        {
          url: '/_next/static/chunks/mui-fa51799d-6f162efdaea005d6.js',
          revision: '6f162efdaea005d6',
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
        { url: '/_next/static/chunks/webpack-655da250f982feb7.js', revision: '655da250f982feb7' },
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
            cacheWillUpdate: async ({ request: e, response: a, event: d, state: s }) =>
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
