'use client';

import { ThemeContextProvider } from '@/contexts/ThemeContext';

/**
 * 管理者機能専用レイアウト
 * Issue #45 Phase 3: セキュリティ重視の基本構造
 * Issue #63: ThemeContextProvider追加
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContextProvider>
      <div>
        {/* 管理者専用ヘッダー（Phase 2で実装予定） */}
        <div
          style={{
            backgroundColor: '#d32f2f',
            color: 'white',
            padding: '8px 16px',
            fontSize: '14px',
            textAlign: 'center',
          }}
        >
          🛡️ 管理者モード - セキュアアクセス
        </div>

        {children}
      </div>
    </ThemeContextProvider>
  );
}
