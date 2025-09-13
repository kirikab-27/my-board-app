const https = require('https');

// テスト用のサムネイルURL（最新のものを使用）
const testUrl =
  'https://res.cloudinary.com/dpp6layjc/image/upload/c_fit,w_150,h_150,g_center,q_auto,b_white/v1757768221/board-app/images/image_68988110559ff1f328a7c1e6_7bbe1637-0ab0-4206-bcd4-f2b8156f746a.jpg';

console.log('🔍 サムネイルURLをテスト中...');
console.log('URL:', testUrl);

// HTTPSリクエストを送信
https
  .get(testUrl, (res) => {
    console.log('\n📊 レスポンス情報:');
    console.log('ステータスコード:', res.statusCode);
    console.log('Content-Type:', res.headers['content-type']);
    console.log('Content-Length:', res.headers['content-length']);

    if (res.statusCode === 200) {
      console.log('\n✅ URLは正常にアクセス可能です');
      console.log('\n📝 ブラウザで以下を確認してください:');
      console.log('1. ブラウザのキャッシュをクリア（Ctrl+F5 または Cmd+Shift+R）');
      console.log('2. デベロッパーツールのNetworkタブでDisable cacheをチェック');
      console.log('3. シークレット/プライベートウィンドウで確認');
      console.log('\n🔗 直接URLをブラウザで開く:');
      console.log(testUrl);
    } else {
      console.log('\n❌ URLアクセスエラー');
    }
  })
  .on('error', (err) => {
    console.error('❌ エラー:', err);
  });
