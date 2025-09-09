/**
 * AIモデレーション機能
 * Issue #59: 投稿管理システム（AI自動モデレーション）
 */

// 禁止ワードリスト（実際の運用では外部ファイルや環境変数から読み込む）
const BANNED_WORDS = [
  'spam',
  'casino',
  'gambling',
  'viagra',
  'crypto',
  'forex',
  '稼げる',
  '儲かる',
  '無料',
  'クリック',
];

// URLパターン
const URL_PATTERN = /https?:\/\/[^\s]+/g;
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_PATTERN = /[\d-]{10,}/g;

// 不適切コンテンツパターン
const INAPPROPRIATE_PATTERNS = [/\b(fuck|shit|damn|hell)\b/gi, /死ね|殺す|クソ|バカ/g];

interface ModerationResult {
  status: 'approved' | 'rejected' | 'flagged' | 'pending';
  spamScore: number;
  flags: string[];
  reasons: string[];
  suggestions?: string[];
}

interface ContentAnalysis {
  urlCount: number;
  emailCount: number;
  phoneCount: number;
  capsRatio: number;
  specialCharRatio: number;
  repeatedCharCount: number;
  bannedWordCount: number;
  inappropriateCount: number;
}

/**
 * コンテンツ分析
 */
function analyzeContent(content: string): ContentAnalysis {
  const urls = content.match(URL_PATTERN) || [];
  const emails = content.match(EMAIL_PATTERN) || [];
  const phones = content.match(PHONE_PATTERN) || [];

  // 大文字の割合
  const upperCaseChars = content.match(/[A-Z]/g) || [];
  const letterChars = content.match(/[a-zA-Z]/g) || [];
  const capsRatio = letterChars.length > 0 ? upperCaseChars.length / letterChars.length : 0;

  // 特殊文字の割合
  const specialChars = content.match(/[!@#$%^&*()_+=\[\]{};':"\\|,.<>?]/g) || [];
  const specialCharRatio = content.length > 0 ? specialChars.length / content.length : 0;

  // 連続文字の検出
  const repeatedCharMatches = content.match(/(.)\1{4,}/g) || [];
  const repeatedCharCount = repeatedCharMatches.length;

  // 禁止ワードのカウント
  let bannedWordCount = 0;
  const lowerContent = content.toLowerCase();
  for (const word of BANNED_WORDS) {
    if (lowerContent.includes(word.toLowerCase())) {
      bannedWordCount++;
    }
  }

  // 不適切コンテンツのカウント
  let inappropriateCount = 0;
  for (const pattern of INAPPROPRIATE_PATTERNS) {
    const matches = content.match(pattern) || [];
    inappropriateCount += matches.length;
  }

  return {
    urlCount: urls.length,
    emailCount: emails.length,
    phoneCount: phones.length,
    capsRatio,
    specialCharRatio,
    repeatedCharCount,
    bannedWordCount,
    inappropriateCount,
  };
}

/**
 * スパムスコア計算
 */
function calculateSpamScore(analysis: ContentAnalysis): number {
  let score = 0;

  // URL数によるスコア（3個以上で高スコア）
  if (analysis.urlCount >= 5) score += 0.4;
  else if (analysis.urlCount >= 3) score += 0.3;
  else if (analysis.urlCount >= 2) score += 0.2;
  else if (analysis.urlCount >= 1) score += 0.1;

  // メールアドレス・電話番号
  if (analysis.emailCount > 0) score += 0.15;
  if (analysis.phoneCount > 0) score += 0.15;

  // 大文字の割合（50%以上で高スコア）
  if (analysis.capsRatio > 0.7) score += 0.2;
  else if (analysis.capsRatio > 0.5) score += 0.1;

  // 特殊文字の割合
  if (analysis.specialCharRatio > 0.3) score += 0.15;
  else if (analysis.specialCharRatio > 0.2) score += 0.1;

  // 連続文字
  score += analysis.repeatedCharCount * 0.05;

  // 禁止ワード
  score += analysis.bannedWordCount * 0.2;

  // 不適切コンテンツ
  score += analysis.inappropriateCount * 0.3;

  // スコアを0-1の範囲に正規化
  return Math.min(1, Math.max(0, score));
}

/**
 * モデレーション判定
 */
function determineStatus(
  spamScore: number,
  analysis: ContentAnalysis
): { status: ModerationResult['status']; reasons: string[] } {
  const reasons: string[] = [];

  // 明確なスパム（スコア0.8以上）
  if (spamScore >= 0.8) {
    reasons.push('高いスパムスコア');
    return { status: 'rejected', reasons };
  }

  // 不適切コンテンツ
  if (analysis.inappropriateCount > 0) {
    reasons.push('不適切な言葉が含まれています');
    return { status: 'rejected', reasons };
  }

  // 禁止ワード複数
  if (analysis.bannedWordCount >= 3) {
    reasons.push('禁止ワードが複数含まれています');
    return { status: 'rejected', reasons };
  }

  // 疑わしいコンテンツ（スコア0.5-0.8）
  if (spamScore >= 0.5) {
    if (analysis.urlCount >= 3) reasons.push('URLが多すぎます');
    if (analysis.capsRatio > 0.5) reasons.push('大文字が多すぎます');
    if (analysis.bannedWordCount > 0) reasons.push('禁止ワードが含まれています');
    return { status: 'flagged', reasons };
  }

  // 軽微な問題（スコア0.3-0.5）
  if (spamScore >= 0.3) {
    if (analysis.urlCount >= 2) reasons.push('複数のURLが含まれています');
    if (analysis.specialCharRatio > 0.2) reasons.push('特殊文字が多く含まれています');
    return { status: 'pending', reasons };
  }

  // 問題なし
  return { status: 'approved', reasons: [] };
}

/**
 * 改善提案の生成
 */
function generateSuggestions(analysis: ContentAnalysis): string[] {
  const suggestions: string[] = [];

  if (analysis.urlCount > 2) {
    suggestions.push('URLの数を減らすことを検討してください');
  }

  if (analysis.capsRatio > 0.5) {
    suggestions.push('大文字の使用を控えめにしてください');
  }

  if (analysis.specialCharRatio > 0.2) {
    suggestions.push('特殊文字の使用を減らしてください');
  }

  if (analysis.repeatedCharCount > 0) {
    suggestions.push('同じ文字の連続使用を避けてください');
  }

  return suggestions;
}

/**
 * メインのモデレーション関数
 */
export async function moderateContent(
  content: string,
  options: {
    strictMode?: boolean;
    checkTitle?: boolean;
    title?: string;
  } = {}
): Promise<ModerationResult> {
  // コンテンツとタイトルを結合して分析
  const fullContent = options.checkTitle && options.title ? `${options.title} ${content}` : content;

  // コンテンツ分析
  const analysis = analyzeContent(fullContent);

  // スパムスコア計算
  let spamScore = calculateSpamScore(analysis);

  // 厳格モードではスコアを20%上げる
  if (options.strictMode) {
    spamScore = Math.min(1, spamScore * 1.2);
  }

  // ステータス判定
  const { status, reasons } = determineStatus(spamScore, analysis);

  // フラグの設定
  const flags: string[] = [];
  if (analysis.urlCount > 0) flags.push('contains_url');
  if (analysis.emailCount > 0) flags.push('contains_email');
  if (analysis.phoneCount > 0) flags.push('contains_phone');
  if (analysis.bannedWordCount > 0) flags.push('banned_words');
  if (analysis.inappropriateCount > 0) flags.push('inappropriate');
  if (analysis.capsRatio > 0.5) flags.push('excessive_caps');
  if (spamScore > 0.5) flags.push('potential_spam');

  // 改善提案
  const suggestions =
    status === 'flagged' || status === 'pending' ? generateSuggestions(analysis) : undefined;

  return {
    status,
    spamScore,
    flags,
    reasons,
    suggestions,
  };
}

/**
 * バッチモデレーション（複数投稿の一括処理）
 */
export async function moderateBatch(
  posts: Array<{ id: string; content: string; title?: string }>
): Promise<Map<string, ModerationResult>> {
  const results = new Map<string, ModerationResult>();

  for (const post of posts) {
    const result = await moderateContent(post.content, {
      checkTitle: true,
      title: post.title,
    });
    results.set(post.id, result);
  }

  return results;
}

/**
 * 学習用フィードバック処理（将来の拡張用）
 */
export async function processFeedback(
  postId: string,
  actualStatus: 'spam' | 'not_spam',
  predictedScore: number
): Promise<void> {
  // 将来的にはここで機械学習モデルの再学習や
  // パラメータの調整を行う
  console.log('Moderation feedback:', {
    postId,
    actualStatus,
    predictedScore,
    error: actualStatus === 'spam' ? predictedScore < 0.5 : predictedScore >= 0.5,
  });
}

const aiModeration = {
  moderateContent,
  moderateBatch,
  processFeedback,
};

export default aiModeration;
