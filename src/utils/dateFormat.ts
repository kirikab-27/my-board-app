/**
 * 日付を日本語形式でフォーマットする
 * @param dateString - フォーマット対象の日付文字列
 * @returns フォーマットされた日付文字列
 */
export function formatDate(dateString: string): string {
  try {
    // null や undefined の場合は早期リターン
    if (!dateString) {
      return '無効な日付';
    }
    
    const date = new Date(dateString);
    
    // 無効な日付の場合
    if (isNaN(date.getTime())) {
      return '無効な日付';
    }
    
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return '無効な日付';
  }
}

/**
 * 相対時間を取得する（例：2時間前）
 * @param dateString - 基準となる日付文字列
 * @returns 相対時間文字列
 */
export function getRelativeTime(dateString: string): string {
  try {
    // null や undefined の場合は早期リターン
    if (!dateString) {
      return '無効な日付';
    }
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    if (isNaN(date.getTime())) {
      return '無効な日付';
    }
    
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) {
      return 'たった今';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分前`;
    } else if (diffHours < 24) {
      return `${diffHours}時間前`;
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return formatDate(dateString);
    }
  } catch {
    return '無効な日付';
  }
}