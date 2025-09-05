// NextAuthセッション強制更新スクリプト
const { MongoClient } = require('mongodb');

async function forceSessionUpdate() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('📊 セッション強制更新開始');
    
    const db = client.db();
    
    // NextAuthのセッションコレクションをクリア（JWT戦略なので実際にはないが）
    const sessions = db.collection('sessions');
    const accounts = db.collection('accounts');
    
    // 管理者ユーザーの関連セッション・アカウントをクリア
    const adminEmails = ['kab27kav@gmail.com', 'minomasa34@gmail.com'];
    const users = db.collection('users');
    
    for (const email of adminEmails) {
      const user = await users.findOne({ email: email.toLowerCase() });
      if (user) {
        // 関連セッション削除
        const deletedSessions = await sessions.deleteMany({ userId: user._id });
        const deletedAccounts = await accounts.deleteMany({ userId: user._id });
        
        console.log(`✅ ${email}: sessions=${deletedSessions.deletedCount}, accounts=${deletedAccounts.deletedCount}`);
      }
    }
    
    console.log('✅ セッション情報クリア完了');
    console.log('次のステップ: ブラウザで完全ログアウト→再ログイン');
    
  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    await client.close();
  }
}

require('dotenv').config({ path: '.env.local' });
forceSessionUpdate();