export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * 投稿内容をバリデーションする
 * @param content - 検証対象の投稿内容
 * @returns バリデーション結果
 */
export function validatePostContent(content: string): ValidationResult {
  // 空文字チェック
  if (!content || content.trim().length === 0) {
    return {
      isValid: false,
      errorMessage: '投稿内容を入力してください'
    };
  }

  // 文字数チェック
  if (content.length > 200) {
    return {
      isValid: false,
      errorMessage: '投稿は200文字以内で入力してください'
    };
  }

  return {
    isValid: true
  };
}

/**
 * MongoDBのObjectIdが有効かチェックする
 * @param id - チェック対象のID
 * @returns 有効な場合true
 */
export function isValidObjectId(id: string): boolean {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
}