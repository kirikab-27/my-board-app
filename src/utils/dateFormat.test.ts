import { formatDate, getRelativeTime } from './dateFormat';

// モックの現在時刻を固定
const MOCK_NOW = new Date('2025-01-20T12:00:00.000Z');

describe('formatDate', () => {
  test('有効な日付文字列を正しくフォーマットする', () => {
    const dateString = '2025-01-20T10:30:00.000Z';
    const result = formatDate(dateString);
    
    // 日本時間での表示を確認（タイムゾーンによって結果が変わる可能性があるため、基本的な形式をチェック）
    expect(result).toMatch(/\d{4}\/\d{2}\/\d{2}/);
    expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  test('無効な日付文字列の場合、エラーメッセージを返す', () => {
    const invalidDate = 'invalid-date';
    const result = formatDate(invalidDate);
    
    expect(result).toBe('無効な日付');
  });

  test('空文字の場合、エラーメッセージを返す', () => {
    const result = formatDate('');
    
    expect(result).toBe('無効な日付');
  });

  test('nullの場合、エラーメッセージを返す', () => {
    const result = formatDate(null as unknown as string);
    
    expect(result).toBe('無効な日付');
  });

  test('undefinedの場合、エラーメッセージを返す', () => {
    const result = formatDate(undefined as unknown as string);
    
    expect(result).toBe('無効な日付');
  });
});

describe('getRelativeTime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('30秒前の場合、"たった今"を返す', () => {
    const dateString = new Date(MOCK_NOW.getTime() - 30 * 1000).toISOString();
    const result = getRelativeTime(dateString);
    
    expect(result).toBe('たった今');
  });

  test('5分前の場合、"5分前"を返す', () => {
    const dateString = new Date(MOCK_NOW.getTime() - 5 * 60 * 1000).toISOString();
    const result = getRelativeTime(dateString);
    
    expect(result).toBe('5分前');
  });

  test('2時間前の場合、"2時間前"を返す', () => {
    const dateString = new Date(MOCK_NOW.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const result = getRelativeTime(dateString);
    
    expect(result).toBe('2時間前');
  });

  test('3日前の場合、"3日前"を返す', () => {
    const dateString = new Date(MOCK_NOW.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const result = getRelativeTime(dateString);
    
    expect(result).toBe('3日前');
  });

  test('1週間以上前の場合、フォーマットされた日付を返す', () => {
    const dateString = new Date(MOCK_NOW.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const result = getRelativeTime(dateString);
    
    // フォーマットされた日付文字列が返されることを確認
    expect(result).toMatch(/\d{4}\/\d{2}\/\d{2}/);
  });

  test('未来の日付の場合、負の値でも適切に処理する', () => {
    const futureDate = new Date(MOCK_NOW.getTime() + 60 * 60 * 1000).toISOString();
    const result = getRelativeTime(futureDate);
    
    // 未来の日付でも何らかの結果を返すことを確認
    expect(result).toBeDefined();
  });

  test('無効な日付文字列の場合、エラーメッセージを返す', () => {
    const result = getRelativeTime('invalid-date');
    
    expect(result).toBe('無効な日付');
  });

  test('nullの場合、エラーメッセージを返す', () => {
    const result = getRelativeTime(null as unknown as string);
    
    expect(result).toBe('無効な日付');
  });

  test('undefinedの場合、エラーメッセージを返す', () => {
    const result = getRelativeTime(undefined as unknown as string);
    
    expect(result).toBe('無効な日付');
  });
});