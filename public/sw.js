if (!self.define) {
  let e,
    s = {};
  const i = (i, a) => (
    (i = new URL(i + '.js', a).href),
    s[i] ||
      new Promise((s) => {
        if ('document' in self) {
          const e = document.createElement('script');
          ((e.src = i), (e.onload = s), document.head.appendChild(e));
        } else ((e = i), importScripts(i), s());
      }).then(() => {
        let e = s[i];
        if (!e) throw new Error(`Module ${i} didn’t register its module`);
        return e;
      })
  );
  self.define = (a, c) => {
    const t = e || ('document' in self ? document.currentScript.src : '') || location.href;
    if (s[t]) return;
    let n = {};
    const d = (e) => i(e, t),
      r = { module: { uri: t }, exports: n, require: d };
    s[t] = Promise.all(a.map((e) => r[e] || d(e))).then((e) => (c(...e), n));
  };
}
define(['./workbox-f52fd911'], function (e) {
  'use strict';
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        { url: '/_next/app-build-manifest.json', revision: 'c9ca646dfc4d40e897140bcd5179ff95' },
        { url: '/_next/dynamic-css-manifest.json', revision: '635e29f1572238182774b0257937f4dc' },
        {
          url: '/_next/static/4tU2zrgdBFBPQrdt-WlcZ/_buildManifest.js',
          revision: '8ed677642156f4bd0109ca89e8f5e2f3',
        },
        {
          url: '/_next/static/4tU2zrgdBFBPQrdt-WlcZ/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        { url: '/_next/static/chunks/1322.da56bcd244f97d30.js', revision: 'da56bcd244f97d30' },
        { url: '/_next/static/chunks/152.3d8c5bbf53d3ba5b.js', revision: '3d8c5bbf53d3ba5b' },
        { url: '/_next/static/chunks/1911.d2ddf4ce13f876d9.js', revision: 'd2ddf4ce13f876d9' },
        { url: '/_next/static/chunks/2768-2fc51a2ed41a1601.js', revision: '2fc51a2ed41a1601' },
        { url: '/_next/static/chunks/3000-3a6cefc681f7f94c.js', revision: '3a6cefc681f7f94c' },
        { url: '/_next/static/chunks/341-fa95a9c24e5bf013.js', revision: 'fa95a9c24e5bf013' },
        { url: '/_next/static/chunks/4268-d80ea185dd8e29c5.js', revision: 'd80ea185dd8e29c5' },
        { url: '/_next/static/chunks/4881.0a1204df4b4e6969.js', revision: '0a1204df4b4e6969' },
        { url: '/_next/static/chunks/4914.ca0b14d6b89debc5.js', revision: 'ca0b14d6b89debc5' },
        { url: '/_next/static/chunks/5449-90f94310b978495d.js', revision: '90f94310b978495d' },
        { url: '/_next/static/chunks/7912-d1143a3940061bd2.js', revision: 'd1143a3940061bd2' },
        { url: '/_next/static/chunks/8488-0788498dcf393e2b.js', revision: '0788498dcf393e2b' },
        { url: '/_next/static/chunks/9630-f7cdd106fa9fbb03.js', revision: 'f7cdd106fa9fbb03' },
        {
          url: '/_next/static/chunks/app/_not-found/page-0fe215c73db05a47.js',
          revision: '0fe215c73db05a47',
        },
        {
          url: '/_next/static/chunks/app/admin/analytics/page-cbca03da576f7d2c.js',
          revision: 'cbca03da576f7d2c',
        },
        {
          url: '/_next/static/chunks/app/admin/audit-logs/page-0e33e725d43301d1.js',
          revision: '0e33e725d43301d1',
        },
        {
          url: '/_next/static/chunks/app/admin/dashboard/enhanced/page-751b2fc54eecebc1.js',
          revision: '751b2fc54eecebc1',
        },
        {
          url: '/_next/static/chunks/app/admin/dashboard/page-18a63457091c43ca.js',
          revision: '18a63457091c43ca',
        },
        {
          url: '/_next/static/chunks/app/admin/layout-344f4b783ac670ac.js',
          revision: '344f4b783ac670ac',
        },
        {
          url: '/_next/static/chunks/app/admin/logs/page-ccecae2f9f1b4734.js',
          revision: 'ccecae2f9f1b4734',
        },
        {
          url: '/_next/static/chunks/app/admin/posts/page-841b4be944796e8e.js',
          revision: '841b4be944796e8e',
        },
        {
          url: '/_next/static/chunks/app/admin/reports/page-36119b5eeac4b8ee.js',
          revision: '36119b5eeac4b8ee',
        },
        {
          url: '/_next/static/chunks/app/admin/secrets/page-1bb6d2517d532ed9.js',
          revision: '1bb6d2517d532ed9',
        },
        {
          url: '/_next/static/chunks/app/admin/security/2fa/page-8b5eaa4f7bd9e460.js',
          revision: '8b5eaa4f7bd9e460',
        },
        {
          url: '/_next/static/chunks/app/admin/security/page-f73af6fb1a2db988.js',
          revision: 'f73af6fb1a2db988',
        },
        {
          url: '/_next/static/chunks/app/admin/sessions/page-75662a53ba74ef33.js',
          revision: '75662a53ba74ef33',
        },
        {
          url: '/_next/static/chunks/app/admin/settings/page-3deadb7c8b57414b.js',
          revision: '3deadb7c8b57414b',
        },
        {
          url: '/_next/static/chunks/app/admin/users/page-466ede44be089e44.js',
          revision: '466ede44be089e44',
        },
        {
          url: '/_next/static/chunks/app/admin/verification/page-0b58cfad00ebef15.js',
          revision: '0b58cfad00ebef15',
        },
        {
          url: '/_next/static/chunks/app/analytics/dashboard/page-26bf73d79d7f516d.js',
          revision: '26bf73d79d7f516d',
        },
        {
          url: '/_next/static/chunks/app/api/admin/2fa/disable/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/admin/2fa/enable/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/admin/2fa/setup/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/admin/2fa/status/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/admin/2fa/verify/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/admin/audit-logs/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/admin/posts/%5Bid%5D/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/admin/posts/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/admin/secrets/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/admin/sessions/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/admin/stats/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/admin/users/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/admin/verification/generate/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/admin/verification/resend/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/admin/verification/verify/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/analytics/dashboard/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/analytics/stats/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/auth/%5B...nextauth%5D/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/auth/rate-limit/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/auth/register/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/auth/resend-verification/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/auth/reset-password/confirm/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/auth/reset-password/request/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/auth/verify-email/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/comments/%5Bid%5D/like/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/comments/%5Bid%5D/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/comments/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/debug/env/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/debug/ip/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/debug/mail/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/dev/reset-rate-limit/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/follow/%5BuserId%5D/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/follow/list/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/follow/requests/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/follow/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/follow/stats/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/hashtags/%5Btag%5D/posts/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/hashtags/%5Btag%5D/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/hashtags/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/hashtags/search/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/hashtags/trending/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/media/hash/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/media/signature/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/media/upload/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/mentions/notify/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/monitoring/connection/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/monitoring/metrics/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/notifications/%5Bid%5D/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/notifications/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/posts/%5Bid%5D/like/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/posts/%5Bid%5D/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/posts/infinite/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/posts/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/posts/search/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/block/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/check/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/mute/check/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/mute/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/notification-settings/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/settings/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/profile/check-username/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/profile/password/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/profile/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/reports/%5Bid%5D/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/reports/batch/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/reports/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/reports/stats/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/security/audit/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/security/csp-report/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/security/csrf/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/security/stats/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/security/unblock/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/test/email/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/timeline/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/timeline/updates/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5Busername%5D/posts/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/users/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/api/users/search-mentions/route-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/auth/2fa/page-59af783f9893abaa.js',
          revision: '59af783f9893abaa',
        },
        {
          url: '/_next/static/chunks/app/auth/error/page-6e4fd570bdf05dbc.js',
          revision: '6e4fd570bdf05dbc',
        },
        {
          url: '/_next/static/chunks/app/auth/forgot-password/page-884c3ac72ecb122f.js',
          revision: '884c3ac72ecb122f',
        },
        {
          url: '/_next/static/chunks/app/auth/reset-password/page-d2f9f3cf77551a98.js',
          revision: 'd2f9f3cf77551a98',
        },
        {
          url: '/_next/static/chunks/app/auth/verified/page-455bb9380be7021c.js',
          revision: '455bb9380be7021c',
        },
        {
          url: '/_next/static/chunks/app/board/%5Bid%5D/edit/page-c0dcfbb978c8eb31.js',
          revision: 'c0dcfbb978c8eb31',
        },
        {
          url: '/_next/static/chunks/app/board/%5Bid%5D/page-d7d348f73db09741.js',
          revision: 'd7d348f73db09741',
        },
        {
          url: '/_next/static/chunks/app/board/create/page-424eea9704c4b989.js',
          revision: '424eea9704c4b989',
        },
        {
          url: '/_next/static/chunks/app/board/loading-2efae7b02b2bfc42.js',
          revision: '2efae7b02b2bfc42',
        },
        {
          url: '/_next/static/chunks/app/board/page-e655218bdc23eb09.js',
          revision: 'e655218bdc23eb09',
        },
        {
          url: '/_next/static/chunks/app/dashboard/loading-46e5371706567180.js',
          revision: '46e5371706567180',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-889c22e598b8dc6a.js',
          revision: '889c22e598b8dc6a',
        },
        {
          url: '/_next/static/chunks/app/hashtags/%5Btag%5D/page-860741aabfeb91ce.js',
          revision: '860741aabfeb91ce',
        },
        {
          url: '/_next/static/chunks/app/hashtags/page-2d596a8f83e42448.js',
          revision: '2d596a8f83e42448',
        },
        {
          url: '/_next/static/chunks/app/layout-ca5026da5ae48483.js',
          revision: 'ca5026da5ae48483',
        },
        {
          url: '/_next/static/chunks/app/loading-d32d9816052fee38.js',
          revision: 'd32d9816052fee38',
        },
        {
          url: '/_next/static/chunks/app/login/page-4635ff4a3c89d56a.js',
          revision: '4635ff4a3c89d56a',
        },
        {
          url: '/_next/static/chunks/app/members-only/page-cc52c38c4e05a51f.js',
          revision: 'cc52c38c4e05a51f',
        },
        {
          url: '/_next/static/chunks/app/members/page-8e29d42bdce0512b.js',
          revision: '8e29d42bdce0512b',
        },
        {
          url: '/_next/static/chunks/app/monitoring/dashboard/page-00f9864e38a23e08.js',
          revision: '00f9864e38a23e08',
        },
        {
          url: '/_next/static/chunks/app/notifications/page-c85a7a2d28a1b88b.js',
          revision: 'c85a7a2d28a1b88b',
        },
        { url: '/_next/static/chunks/app/page-8638357fefcd41f6.js', revision: '8638357fefcd41f6' },
        {
          url: '/_next/static/chunks/app/profile/edit/page-d31c0a97bfa408c0.js',
          revision: 'd31c0a97bfa408c0',
        },
        {
          url: '/_next/static/chunks/app/profile/loading-3f6fdeb047bc224c.js',
          revision: '3f6fdeb047bc224c',
        },
        {
          url: '/_next/static/chunks/app/profile/page-0e803f42543fe698.js',
          revision: '0e803f42543fe698',
        },
        {
          url: '/_next/static/chunks/app/profile/password/page-923f14e20adf5e66.js',
          revision: '923f14e20adf5e66',
        },
        {
          url: '/_next/static/chunks/app/profile/privacy/page-13aab3896317c37a.js',
          revision: '13aab3896317c37a',
        },
        {
          url: '/_next/static/chunks/app/register/page-32e1dd47ad5ed22c.js',
          revision: '32e1dd47ad5ed22c',
        },
        {
          url: '/_next/static/chunks/app/timeline/page-f03ebcf050075557.js',
          revision: 'f03ebcf050075557',
        },
        {
          url: '/_next/static/chunks/app/unauthorized/page-a2ae72631f762130.js',
          revision: 'a2ae72631f762130',
        },
        {
          url: '/_next/static/chunks/app/users/%5Busername%5D/posts/page-cb0f77fa99d85546.js',
          revision: 'cb0f77fa99d85546',
        },
        {
          url: '/_next/static/chunks/app/users/page-a6b1462a9271c3f5.js',
          revision: 'a6b1462a9271c3f5',
        },
        {
          url: '/_next/static/chunks/app/users/search/page-3f73c61dd5f51c6b.js',
          revision: '3f73c61dd5f51c6b',
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
        { url: '/_next/static/chunks/main-4fc47441fc1edbac.js', revision: '4fc47441fc1edbac' },
        { url: '/_next/static/chunks/main-app-fe61a2cc79dc011d.js', revision: 'fe61a2cc79dc011d' },
        {
          url: '/_next/static/chunks/mui-20747411-64ffee4b71cdc6ad.js',
          revision: '64ffee4b71cdc6ad',
        },
        {
          url: '/_next/static/chunks/mui-2517f304-b60fa3134e854cf1.js',
          revision: 'b60fa3134e854cf1',
        },
        {
          url: '/_next/static/chunks/mui-32b2b6a2-0b00945d8ffd55b8.js',
          revision: '0b00945d8ffd55b8',
        },
        {
          url: '/_next/static/chunks/mui-35130889-9c9fb83d343c02fe.js',
          revision: '9c9fb83d343c02fe',
        },
        {
          url: '/_next/static/chunks/mui-3b7feca0-343ecab3ad7035e2.js',
          revision: '343ecab3ad7035e2',
        },
        {
          url: '/_next/static/chunks/mui-5311f7c3-c24748a6517a17e7.js',
          revision: 'c24748a6517a17e7',
        },
        {
          url: '/_next/static/chunks/mui-5f15480b-bcde28ebf868552e.js',
          revision: 'bcde28ebf868552e',
        },
        {
          url: '/_next/static/chunks/mui-7d5f62f9-9fae251a6dffcd80.js',
          revision: '9fae251a6dffcd80',
        },
        {
          url: '/_next/static/chunks/mui-837a64b6-0c0e9934c4022ac7.js',
          revision: '0c0e9934c4022ac7',
        },
        {
          url: '/_next/static/chunks/mui-8d949fea-ab3f0e90af952453.js',
          revision: 'ab3f0e90af952453',
        },
        {
          url: '/_next/static/chunks/mui-9342a3d7-71877ec881eeaf7c.js',
          revision: '71877ec881eeaf7c',
        },
        {
          url: '/_next/static/chunks/mui-a1678900-b46b773260159d59.js',
          revision: 'b46b773260159d59',
        },
        {
          url: '/_next/static/chunks/mui-b199ba2a-07e4ec20d2f224af.js',
          revision: '07e4ec20d2f224af',
        },
        {
          url: '/_next/static/chunks/mui-bd2ef734-4a9b5a0d49730465.js',
          revision: '4a9b5a0d49730465',
        },
        {
          url: '/_next/static/chunks/mui-c3162354-3ea8837e9c08a638.js',
          revision: '3ea8837e9c08a638',
        },
        {
          url: '/_next/static/chunks/mui-cd1bebcf-1310b2812d8d9370.js',
          revision: '1310b2812d8d9370',
        },
        {
          url: '/_next/static/chunks/mui-d07eb308-73093fb14d320217.js',
          revision: '73093fb14d320217',
        },
        {
          url: '/_next/static/chunks/mui-de3ade33-d692736027aa7a47.js',
          revision: 'd692736027aa7a47',
        },
        {
          url: '/_next/static/chunks/mui-f934a527-3fd9668b74938b75.js',
          revision: '3fd9668b74938b75',
        },
        {
          url: '/_next/static/chunks/mui-fa51799d-451eddc2ce30de84.js',
          revision: '451eddc2ce30de84',
        },
        {
          url: '/_next/static/chunks/mui-fa72aa36-5036a5e914c9394d.js',
          revision: '5036a5e914c9394d',
        },
        {
          url: '/_next/static/chunks/mui-fdb9cefb-6db401d297a858b1.js',
          revision: '6db401d297a858b1',
        },
        {
          url: '/_next/static/chunks/pages/_app-ca818e222e665146.js',
          revision: 'ca818e222e665146',
        },
        {
          url: '/_next/static/chunks/pages/_error-51dce8186af7c060.js',
          revision: '51dce8186af7c060',
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
          url: '/_next/static/chunks/vendors-8cbd2506-27ca87b2dc138070.js',
          revision: '27ca87b2dc138070',
        },
        {
          url: '/_next/static/chunks/vendors-ad6a2f20-cb7c29c14803b619.js',
          revision: 'cb7c29c14803b619',
        },
        {
          url: '/_next/static/chunks/vendors-c0d76f48-fb0c022bd66e9c1e.js',
          revision: 'fb0c022bd66e9c1e',
        },
        {
          url: '/_next/static/chunks/vendors-eb2fbf4c-81de30bb2140fe32.js',
          revision: '81de30bb2140fe32',
        },
        { url: '/_next/static/chunks/webpack-f6af77fbe7c4da8e.js', revision: 'f6af77fbe7c4da8e' },
        { url: '/_next/static/css/c20897b7a28b184d.css', revision: 'c20897b7a28b184d' },
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
            cacheWillUpdate: async ({ request: e, response: s, event: i, state: a }) =>
              s && 'opaqueredirect' === s.type
                ? new Response(s.body, { status: 200, statusText: 'OK', headers: s.headers })
                : s,
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
