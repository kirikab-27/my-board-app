#!/bin/bash

# Git作業支援スクリプト - Issue #45管理者機能開発用
# my-board-app プロジェクト専用

set -e  # エラー時に停止

# 色付きログ関数
log_info() { echo -e "\033[34mℹ️  $1\033[0m"; }
log_success() { echo -e "\033[32m✅ $1\033[0m"; }
log_warning() { echo -e "\033[33m⚠️  $1\033[0m"; }
log_error() { echo -e "\033[31m❌ $1\033[0m"; }

# 現在作業の安全保存
safe_stash() {
    local message="${1:-Auto stash before branch operation}"
    
    log_info "現在の作業状況確認中..."
    
    if git diff --quiet && git diff --staged --quiet; then
        log_success "作業ディレクトリはクリーンです"
        return 0
    fi
    
    log_warning "未コミットの変更があります。stashに保存します..."
    git stash push -m "$message"
    log_success "作業を安全に保存しました: $message"
}

# mainブランチ最新化
update_main() {
    log_info "mainブランチを最新化中..."
    
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    
    # mainでない場合は一時的に切り替え
    if [ "$current_branch" != "main" ]; then
        safe_stash "Before updating main from $current_branch"
        git checkout main
    fi
    
    git pull origin main
    log_success "mainブランチを最新化しました"
    
    # 元のブランチに戻る
    if [ "$current_branch" != "main" ]; then
        git checkout "$current_branch"
        log_info "元のブランチ ($current_branch) に戻りました"
    fi
}

# featureブランチ作成
create_feature_branch() {
    local branch_name="$1"
    local base_branch="${2:-main}"
    
    if [ -z "$branch_name" ]; then
        log_error "使用方法: create_feature_branch <branch_name> [base_branch]"
        return 1
    fi
    
    log_info "featureブランチを作成中: $branch_name"
    
    # 現在作業を保存
    safe_stash "Before creating branch $branch_name"
    
    # ベースブランチに切り替え・最新化
    git checkout "$base_branch"
    git pull origin "$base_branch"
    
    # 新しいブランチ作成
    git checkout -b "$branch_name"
    git push -u origin "$branch_name"
    
    log_success "ブランチ作成完了: $branch_name"
    log_info "リモート追跡設定: origin/$branch_name"
}

# 管理者機能専用ブランチ作成
create_admin_branch() {
    local feature_name="$1"
    
    if [ -z "$feature_name" ]; then
        log_error "使用方法: create_admin_branch <feature_name>"
        log_info "例: create_admin_branch auth  → feature/admin-auth"
        return 1
    fi
    
    local branch_name="feature/admin-$feature_name"
    create_feature_branch "$branch_name" "feature/admin-dashboard"
}

# ブランチ削除（安全）
delete_branch() {
    local branch_name="$1"
    local force="${2:-false}"
    
    if [ -z "$branch_name" ]; then
        log_error "使用方法: delete_branch <branch_name> [force]"
        return 1
    fi
    
    if [ "$branch_name" = "main" ] || [ "$branch_name" = "develop" ]; then
        log_error "メインブランチは削除できません: $branch_name"
        return 1
    fi
    
    log_warning "ブランチを削除します: $branch_name"
    read -p "本当に削除しますか？ (y/N): " confirm
    
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        # ローカルブランチ削除
        if [ "$force" = "true" ]; then
            git branch -D "$branch_name"
        else
            git branch -d "$branch_name"
        fi
        
        # リモートブランチ削除
        git push origin --delete "$branch_name"
        
        log_success "ブランチを削除しました: $branch_name"
    else
        log_info "削除をキャンセルしました"
    fi
}

# mainとの差分確認
show_diff_main() {
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    
    log_info "ブランチ '$current_branch' とmainの差分:"
    
    echo "=== コミット数の差分 ==="
    echo "当ブランチにのみあるコミット: $(git rev-list --count HEAD...main)"
    echo "mainにのみあるコミット: $(git rev-list --count main...HEAD)"
    
    echo ""
    echo "=== ファイル変更サマリー ==="
    git diff --stat main...HEAD
    
    echo ""
    echo "=== 詳細ファイル差分 ==="
    read -p "詳細差分を表示しますか？ (y/N): " show_detail
    if [ "$show_detail" = "y" ] || [ "$show_detail" = "Y" ]; then
        git diff main...HEAD
    fi
}

# ブランチ状況表示
branch_status() {
    echo "=== Git Branch Status ==="
    echo "現在のブランチ: $(git rev-parse --abbrev-ref HEAD)"
    echo "リモート追跡: $(git rev-parse --abbrev-ref HEAD@{upstream} 2>/dev/null || echo 'なし')"
    echo ""
    
    echo "=== ローカルブランチ ==="
    git branch
    echo ""
    
    echo "=== リモートブランチ ==="
    git branch -r
    echo ""
    
    echo "=== 最近のコミット ==="
    git log --oneline -5
}

# 緊急時の安全リセット
emergency_reset() {
    log_warning "緊急リセットモード: 現在の変更を破棄してmainに戻ります"
    read -p "本当に実行しますか？未保存の作業は失われます (y/N): " confirm
    
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        git reset --hard HEAD
        git clean -fd
        git checkout main
        git pull origin main
        log_success "mainブランチの最新状態にリセットしました"
    else
        log_info "リセットをキャンセルしました"
    fi
}

# ヘルプ表示
show_help() {
    echo "=== my-board-app Git作業支援スクリプト ==="
    echo ""
    echo "使用方法:"
    echo "  ./scripts/git-utils.sh <command> [arguments]"
    echo ""
    echo "コマンド:"
    echo "  safe_stash [message]              - 現在作業を安全に保存"
    echo "  update_main                       - mainブランチ最新化"
    echo "  create_feature_branch <name>      - featureブランチ作成"
    echo "  create_admin_branch <feature>     - 管理者機能ブランチ作成"
    echo "  delete_branch <name> [force]      - ブランチ削除"
    echo "  show_diff_main                    - mainとの差分表示"
    echo "  branch_status                     - ブランチ状況表示"
    echo "  emergency_reset                   - 緊急時安全リセット"
    echo ""
    echo "例:"
    echo "  ./scripts/git-utils.sh create_admin_branch auth"
    echo "  ./scripts/git-utils.sh show_diff_main"
    echo "  ./scripts/git-utils.sh safe_stash 'Issue #45実装中'"
}

# メイン関数
main() {
    case "$1" in
        "safe_stash")
            safe_stash "$2"
            ;;
        "update_main")
            update_main
            ;;
        "create_feature_branch")
            create_feature_branch "$2" "$3"
            ;;
        "create_admin_branch")
            create_admin_branch "$2"
            ;;
        "delete_branch")
            delete_branch "$2" "$3"
            ;;
        "show_diff_main")
            show_diff_main
            ;;
        "branch_status")
            branch_status
            ;;
        "emergency_reset")
            emergency_reset
            ;;
        "help"|"-h"|"--help"|"")
            show_help
            ;;
        *)
            log_error "不明なコマンド: $1"
            show_help
            exit 1
            ;;
    esac
}

# スクリプトが直接実行された場合
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi