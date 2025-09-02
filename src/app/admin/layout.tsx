import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '管理者パネル - My Board App',
  description: 'システム管理・ユーザー管理・コンテンツモデレーション',
  robots: 'noindex, nofollow', // 検索エンジンからの除外
};

/**
 * 管理者機能専用レイアウト
 * Issue #45 Phase 3: セキュリティ重視の基本構造
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* 管理者専用ヘッダー（Phase 2で実装予定） */}
      <div style={{ 
        backgroundColor: '#d32f2f', 
        color: 'white', 
        padding: '8px 16px', 
        fontSize: '14px',
        textAlign: 'center'
      }}>
        🛡️ 管理者モード - セキュアアクセス
      </div>
      
      {children}
    </div>
  );
}