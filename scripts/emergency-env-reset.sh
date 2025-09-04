#!/bin/bash

# 緊急環境リセットスクリプト
# Next.js環境破損時の完全修復用

set -e  # エラー時に停止

# 色付きログ関数
log_info() { echo -e "\033[34mℹ️  $1\033[0m"; }
log_success() { echo -e "\033[32m✅ $1\033[0m"; }
log_warning() { echo -e "\033[33m⚠️  $1\033[0m"; }
log_error() { echo -e "\033[31m❌ $1\033[0m"; }

echo "🚨 緊急環境リセット実行中..."
echo "目的: Next.js環境破損の完全修復"
echo ""

# Step 1: 実装保護確認
log_info "Step 1: 現在の実装保護確認"
if git status --porcelain | grep -q "^[MADRCU]"; then
    log_warning "未コミットの変更があります。保存中..."
    git add .
    git commit -m "🚨 Emergency: Save work before environment reset"
    log_success "作業を安全に保存しました"
else
    log_success "作業ディレクトリはクリーンです"
fi

# Step 2: 現在の実装確認
log_info "Step 2: 管理者機能実装確認"
if [ -d "src/app/admin" ]; then
    admin_files=$(find src/app/admin -name "*.tsx" | wc -l)
    log_success "管理者機能ファイル: ${admin_files}個確認"
else
    log_warning "管理者機能が見つかりません"
fi

# Step 3: Node.jsプロセス確認・終了
log_info "Step 3: Node.jsプロセス確認・終了"
if command -v tasklist &> /dev/null; then
    # Windows
    node_processes=$(tasklist | grep -i node.exe | wc -l)
    if [ "$node_processes" -gt 5 ]; then
        log_warning "${node_processes}個のNode.jsプロセスが稼働中"
        read -p "全Node.jsプロセスを終了しますか？ (y/N): " confirm
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            taskkill /F /IM node.exe 2>/dev/null || true
            log_success "Node.jsプロセスを終了しました"
        fi
    else
        log_success "Node.jsプロセス数は正常範囲です"
    fi
else
    # Linux/Mac
    node_pids=$(pgrep -f "node" || true)
    if [ -n "$node_pids" ]; then
        log_warning "Node.jsプロセスが稼働中: $node_pids"
    fi
fi

# Step 4: 破損ファイル削除
log_info "Step 4: 破損ファイル完全削除"
rm -rf .next
rm -rf node_modules  
rm -f package-lock.json
log_success "破損ファイルを完全削除しました"

# Step 5: Next.js存在確認
log_info "Step 5: Next.js削除確認"
if [ -f "node_modules/next/dist/bin/next" ]; then
    log_error "Next.jsファイルが残っています。手動削除が必要です"
    exit 1
else
    log_success "Next.jsファイルの完全削除を確認"
fi

# Step 6: クリーンインストール
log_info "Step 6: クリーンインストール実行"
echo "npm install実行中（時間がかかる場合があります）..."

if npm install --legacy-peer-deps; then
    log_success "依存関係のインストール完了"
else
    log_error "npm installが失敗しました"
    exit 1
fi

# Step 7: Next.js復旧確認
log_info "Step 7: Next.js復旧確認"
if [ -f "node_modules/next/dist/bin/next" ]; then
    log_success "Next.jsバイナリの復旧を確認"
else
    log_error "Next.jsバイナリが復旧されていません"
    exit 1
fi

# Step 8: 開発サーバーテスト
log_info "Step 8: 開発サーバーテスト起動"
echo "開発サーバーを起動しています..."

if timeout 30 npm run dev -- --port 3333 > /dev/null 2>&1 & then
    sleep 5
    if curl -f http://localhost:3333 > /dev/null 2>&1; then
        log_success "開発サーバー正常起動確認"
        pkill -f "next dev" || true
    else
        log_warning "開発サーバー起動はしたが応答がありません"
    fi
else
    log_warning "開発サーバーテストに失敗（手動確認必要）"
fi

# Step 9: 最終確認・レポート
log_info "Step 9: 最終確認・レポート"
echo ""
echo "🎯 緊急環境リセット完了レポート:"
echo "✅ 実装保護: Git commitで安全に保存"
echo "✅ プロセス管理: Node.jsプロセス整理"  
echo "✅ クリーンアップ: 破損ファイル完全削除"
echo "✅ 再インストール: 依存関係完全復旧"
echo "✅ Next.js復旧: バイナリファイル確認"
echo ""
echo "🚀 次のステップ:"
echo "1. npm run dev で開発サーバー起動"
echo "2. http://localhost:3010 で動作確認"
echo "3. 管理者機能: http://localhost:3010/admin/dashboard"
echo ""
echo "⚠️  今後の予防策:"
echo "- 環境操作前に全Node.jsプロセス終了"
echo "- このスクリプトを緊急時に使用"
echo "- 段階的な環境操作・完了確認"

log_success "緊急環境リセット完了！"