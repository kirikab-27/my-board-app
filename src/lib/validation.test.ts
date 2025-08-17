import { validatePostContent, isValidObjectId } from './validation';

describe('validatePostContent', () => {
  test('正常な投稿内容の場合、isValidがtrueになる', () => {
    const result = validatePostContent('正常な投稿内容');
    
    expect(result.isValid).toBe(true);
    expect(result.errorMessage).toBeUndefined();
  });

  test('空文字の場合、バリデーションエラーになる', () => {
    const result = validatePostContent('');
    
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('投稿内容を入力してください');
  });

  test('空白のみの場合、バリデーションエラーになる', () => {
    const result = validatePostContent('   ');
    
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('投稿内容を入力してください');
  });

  test('200文字ちょうどの場合、バリデーション成功', () => {
    const content = 'あ'.repeat(200);
    const result = validatePostContent(content);
    
    expect(result.isValid).toBe(true);
    expect(result.errorMessage).toBeUndefined();
  });

  test('201文字の場合、バリデーションエラーになる', () => {
    const content = 'あ'.repeat(201);
    const result = validatePostContent(content);
    
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('投稿は200文字以内で入力してください');
  });

  test('改行文字を含む投稿の場合、正常に処理される', () => {
    const content = 'タイトル\n\n本文です';
    const result = validatePostContent(content);
    
    expect(result.isValid).toBe(true);
  });

  test('nullの場合、バリデーションエラーになる', () => {
    const result = validatePostContent(null as unknown as string);
    
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('投稿内容を入力してください');
  });

  test('undefinedの場合、バリデーションエラーになる', () => {
    const result = validatePostContent(undefined as unknown as string);
    
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('投稿内容を入力してください');
  });
});

describe('isValidObjectId', () => {
  test('有効なObjectIdの場合、trueを返す', () => {
    const validId = '507f1f77bcf86cd799439011';
    expect(isValidObjectId(validId)).toBe(true);
  });

  test('24文字未満の場合、falseを返す', () => {
    const shortId = '507f1f77bcf86cd79943901';
    expect(isValidObjectId(shortId)).toBe(false);
  });

  test('24文字超過の場合、falseを返す', () => {
    const longId = '507f1f77bcf86cd7994390111';
    expect(isValidObjectId(longId)).toBe(false);
  });

  test('16進数以外の文字が含まれる場合、falseを返す', () => {
    const invalidId = '507f1f77bcf86cd79943901g';
    expect(isValidObjectId(invalidId)).toBe(false);
  });

  test('空文字の場合、falseを返す', () => {
    expect(isValidObjectId('')).toBe(false);
  });

  test('nullの場合、falseを返す', () => {
    expect(isValidObjectId(null as unknown as string)).toBe(false);
  });

  test('undefinedの場合、falseを返す', () => {
    expect(isValidObjectId(undefined as unknown as string)).toBe(false);
  });
});