/**
 * NoSQLインジェクション対策
 * 入力値の検証とサニタイゼーション
 */

import mongoose from 'mongoose';

/**
 * NoSQLインジェクション対策 - オブジェクト型チェック
 */
export function sanitizeMongoQuery(input: any): any {
  if (input === null || input === undefined) {
    return input;
  }

  // プリミティブ型はそのまま返す
  if (typeof input !== 'object') {
    return input;
  }

  // 配列の場合は各要素を再帰的にサニタイズ
  if (Array.isArray(input)) {
    return input.map(sanitizeMongoQuery);
  }

  // オブジェクトの場合は危険なキーを除去
  const sanitized: any = {};
  for (const [key, value] of Object.entries(input)) {
    // MongoDB演算子を除去（$で始まるキー）
    if (key.startsWith('$')) {
      console.warn('🚨 NoSQLインジェクション検出:', { key, value });
      continue;
    }

    // 関数やprototype汚染を防ぐ
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      console.warn('🚨 プロトタイプ汚染検出:', { key, value });
      continue;
    }

    sanitized[key] = sanitizeMongoQuery(value);
  }

  return sanitized;
}

/**
 * MongoDB ObjectID の検証
 */
export function validateObjectId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }

  // 24文字の16進数文字列かチェック
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return false;
  }

  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * 検索クエリのサニタイゼーション
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return '';
  }

  // 基本的なサニタイゼーション
  return query
    .trim()
    .replace(/[\\$]/g, '') // バックスラッシュと$記号を除去
    .substring(0, 100); // 長さ制限
}

/**
 * ソートパラメータの検証
 */
export function validateSortParam(sortBy: string, allowedFields: string[]): boolean {
  if (!sortBy || typeof sortBy !== 'string') {
    return false;
  }

  return allowedFields.includes(sortBy);
}

/**
 * ページネーションパラメータの検証
 */
export function validatePaginationParams(page: any, limit: any): {
  page: number;
  limit: number;
  valid: boolean;
} {
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  const valid = (
    Number.isInteger(pageNum) && 
    pageNum >= 1 && 
    Number.isInteger(limitNum) && 
    limitNum >= 1 && 
    limitNum <= 100
  );

  return {
    page: valid ? pageNum : 1,
    limit: valid ? limitNum : 10,
    valid
  };
}

/**
 * フィルタオブジェクトのサニタイゼーション
 */
export function sanitizeFilter(filter: any): any {
  if (!filter || typeof filter !== 'object') {
    return {};
  }

  const sanitized = sanitizeMongoQuery(filter);
  
  // 追加の検証ルール
  const allowedTopLevelKeys = ['userId', 'isPublic', 'createdAt', 'updatedAt', '_id'];
  const result: any = {};

  for (const [key, value] of Object.entries(sanitized)) {
    if (allowedTopLevelKeys.includes(key)) {
      result[key] = value;
    } else {
      console.warn('🚨 許可されていないフィルタキー:', { key, value });
    }
  }

  return result;
}

/**
 * 集計パイプラインのサニタイゼーション
 */
export function sanitizeAggregationPipeline(pipeline: any[]): any[] {
  if (!Array.isArray(pipeline)) {
    return [];
  }

  return pipeline
    .slice(0, 10) // パイプラインの長さ制限
    .map(stage => {
      if (!stage || typeof stage !== 'object') {
        return {};
      }

      // 危険な演算子を除去
      const dangerousOperators = [
        '$where', '$function', '$accumulator', '$expr'
      ];

      const sanitized = sanitizeMongoQuery(stage);
      
      for (const op of dangerousOperators) {
        if (sanitized[op]) {
          console.warn('🚨 危険な集計演算子検出:', { operator: op, stage: sanitized[op] });
          delete sanitized[op];
        }
      }

      return sanitized;
    });
}

/**
 * 更新オブジェクトのサニタイゼーション
 */
export function sanitizeUpdateObject(update: any): any {
  if (!update || typeof update !== 'object') {
    return {};
  }

  const sanitized = sanitizeMongoQuery(update);
  
  // $setなどの更新演算子のみを許可
  const allowedUpdateOperators = ['$set', '$unset', '$inc', '$push', '$pull', '$addToSet'];
  const result: any = {};

  for (const [key, value] of Object.entries(sanitized)) {
    if (key.startsWith('$')) {
      if (allowedUpdateOperators.includes(key)) {
        result[key] = value;
      } else {
        console.warn('🚨 許可されていない更新演算子:', { operator: key, value });
      }
    } else {
      // 直接フィールド更新（$setに変換）
      if (!result.$set) {
        result.$set = {};
      }
      result.$set[key] = value;
    }
  }

  return result;
}

/**
 * 正規表現インジェクション対策
 */
export function sanitizeRegexQuery(pattern: string): string | null {
  if (!pattern || typeof pattern !== 'string') {
    return null;
  }

  // 基本的なサニタイゼーション
  const sanitized = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // 特殊文字をエスケープ
    .substring(0, 50); // 長さ制限

  try {
    // 正規表現として有効かテスト
    new RegExp(sanitized, 'i');
    return sanitized;
  } catch (error) {
    console.warn('🚨 無効な正規表現パターン:', { pattern, sanitized });
    return null;
  }
}