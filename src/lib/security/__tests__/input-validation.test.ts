/**
 * NoSQLインジェクション対策テスト
 */

import {
  sanitizeMongoQuery,
  validateObjectId,
  sanitizeSearchQuery,
  validateSortParam,
  validatePaginationParams,
  sanitizeFilter,
  sanitizeUpdateObject,
  sanitizeRegexQuery
} from '../input-validation';

describe('NoSQLインジェクション対策', () => {
  describe('sanitizeMongoQuery', () => {
    it('MongoDB演算子を除去する', () => {
      const maliciousInput = {
        name: 'test',
        $where: 'function() { return true; }',
        $regex: { $ne: null },
        content: { $gt: '' }
      };

      const result = sanitizeMongoQuery(maliciousInput);

      expect(result).toEqual({
        name: 'test',
        content: {}
      });
    });

    it('プロトタイプ汚染を防ぐ', () => {
      const maliciousInput = {
        __proto__: { isAdmin: true },
        constructor: { prototype: { isAdmin: true } },
        prototype: { isAdmin: true },
        name: 'test'
      };

      const result = sanitizeMongoQuery(maliciousInput);

      expect(result).toEqual({
        name: 'test'
      });
    });

    it('配列を再帰的にサニタイズする', () => {
      const input = [
        { name: 'test', $where: 'malicious' },
        { content: 'safe', $ne: null }
      ];

      const result = sanitizeMongoQuery(input);

      expect(result).toEqual([
        { name: 'test' },
        { content: 'safe' }
      ]);
    });

    it('プリミティブ型はそのまま返す', () => {
      expect(sanitizeMongoQuery('test')).toBe('test');
      expect(sanitizeMongoQuery(123)).toBe(123);
      expect(sanitizeMongoQuery(true)).toBe(true);
      expect(sanitizeMongoQuery(null)).toBe(null);
      expect(sanitizeMongoQuery(undefined)).toBe(undefined);
    });
  });

  describe('validateObjectId', () => {
    it('有効なObjectIDを受け入れる', () => {
      expect(validateObjectId('507f1f77bcf86cd799439011')).toBe(true);
      expect(validateObjectId('507f191e810c19729de860ea')).toBe(true);
    });

    it('無効なObjectIDを拒否する', () => {
      expect(validateObjectId('')).toBe(false);
      expect(validateObjectId('invalid')).toBe(false);
      expect(validateObjectId('507f1f77bcf86cd799439g11')).toBe(false); // 無効な文字
      expect(validateObjectId('507f1f77bcf86cd79943901')).toBe(false); // 短すぎる
      expect(validateObjectId(null as any)).toBe(false);
      expect(validateObjectId(123 as any)).toBe(false);
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('検索クエリを安全にサニタイズする', () => {
      expect(sanitizeSearchQuery('  test query  ')).toBe('test query');
      expect(sanitizeSearchQuery('test\\$regex')).toBe('testregex');
      expect(sanitizeSearchQuery('a'.repeat(150))).toBe('a'.repeat(100));
    });

    it('無効な入力を処理する', () => {
      expect(sanitizeSearchQuery('')).toBe('');
      expect(sanitizeSearchQuery(null as any)).toBe('');
      expect(sanitizeSearchQuery(123 as any)).toBe('');
    });
  });

  describe('validateSortParam', () => {
    it('許可されたフィールドを受け入れる', () => {
      const allowedFields = ['name', 'createdAt', 'updatedAt'];
      
      expect(validateSortParam('name', allowedFields)).toBe(true);
      expect(validateSortParam('createdAt', allowedFields)).toBe(true);
    });

    it('許可されていないフィールドを拒否する', () => {
      const allowedFields = ['name', 'createdAt'];
      
      expect(validateSortParam('$where', allowedFields)).toBe(false);
      expect(validateSortParam('password', allowedFields)).toBe(false);
      expect(validateSortParam('', allowedFields)).toBe(false);
      expect(validateSortParam(null as any, allowedFields)).toBe(false);
    });
  });

  describe('validatePaginationParams', () => {
    it('有効なページネーションパラメータを処理する', () => {
      const result = validatePaginationParams('1', '10');
      
      expect(result).toEqual({
        page: 1,
        limit: 10,
        valid: true
      });
    });

    it('無効なパラメータをデフォルト値で処理する', () => {
      const result1 = validatePaginationParams('invalid', 'invalid');
      expect(result1).toEqual({
        page: 1,
        limit: 10,
        valid: false
      });

      const result2 = validatePaginationParams('-1', '101');
      expect(result2).toEqual({
        page: 1,
        limit: 10,
        valid: false
      });
    });
  });

  describe('sanitizeFilter', () => {
    it('許可されたキーのみを通す', () => {
      const filter = {
        userId: '507f1f77bcf86cd799439011',
        isPublic: true,
        maliciousField: { $where: 'function() { return true; }' },
        $regex: 'test'
      };

      const result = sanitizeFilter(filter);

      expect(result).toEqual({
        userId: '507f1f77bcf86cd799439011',
        isPublic: true
      });
    });
  });

  describe('sanitizeUpdateObject', () => {
    it('更新演算子を適切に処理する', () => {
      const update = {
        $set: { name: 'test' },
        $where: 'function() { return true; }',
        directField: 'value'
      };

      const result = sanitizeUpdateObject(update);

      expect(result).toEqual({
        $set: {
          name: 'test',
          directField: 'value'
        }
      });
    });

    it('危険な演算子を除去する', () => {
      const update = {
        $set: { name: 'test' },
        $where: 'malicious',
        $function: 'malicious'
      };

      const result = sanitizeUpdateObject(update);

      expect(result).toEqual({
        $set: { name: 'test' }
      });
    });
  });

  describe('sanitizeRegexQuery', () => {
    it('正規表現パターンを安全にエスケープする', () => {
      expect(sanitizeRegexQuery('test.*')).toBe('test\\.\\*');
      expect(sanitizeRegexQuery('user[0-9]+')).toBe('user\\[0-9\\]\\+');
    });

    it('無効な入力を処理する', () => {
      expect(sanitizeRegexQuery('')).toBe(null);
      expect(sanitizeRegexQuery(null as any)).toBe(null);
      expect(sanitizeRegexQuery('a'.repeat(100))).toBe('a'.repeat(50).replace(/a/g, '\\a'));
    });
  });
});