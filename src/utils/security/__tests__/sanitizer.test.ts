/**
 * XSS対策サニタイザーテスト
 */

import {
  sanitizeHtml,
  sanitizeMarkdown,
  sanitizePlainText,
  detectXSSAttempt
} from '../sanitizer';

// DOMPurifyのモック
jest.mock('dompurify', () => ({
  sanitize: jest.fn((input: string) => {
    // 基本的なXSS攻撃パターンを除去するシンプルなモック
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  })
}));

// Node.js環境用のDOM設定
const mockWindow = {
  document: {}
};

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
});

describe('XSS対策サニタイザー', () => {
  describe('sanitizeHtml', () => {
    it('基本的なHTMLタグを保持する', () => {
      const input = '<p>Hello <strong>world</strong>!</p>';
      const result = sanitizeHtml(input);
      
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('Hello');
      expect(result).toContain('world');
    });

    it('危険なscriptタグを除去する', () => {
      const input = '<p>Safe content</p><script>alert("XSS")</script>';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('Safe content');
    });

    it('iframeタグを除去する', () => {
      const input = '<p>Content</p><iframe src="evil.com"></iframe>';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('<iframe>');
      expect(result).not.toContain('evil.com');
      expect(result).toContain('Content');
    });

    it('javascript:スキームを除去する', () => {
      const input = '<a href="javascript:alert(1)">Click me</a>';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('alert');
    });
  });

  describe('sanitizeMarkdown', () => {
    it('マークダウン記法を保持する', () => {
      const input = '# Title\\n**Bold text**\\n- List item';
      const result = sanitizeMarkdown(input);
      
      expect(result).toBe('# Title\\n**Bold text**\\n- List item');
    });

    it('HTMLタグを除去する', () => {
      const input = '# Title\\n<script>alert("XSS")</script>\\n**Bold**';
      const result = sanitizeMarkdown(input);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('# Title');
      expect(result).toContain('**Bold**');
    });
  });

  describe('sanitizePlainText', () => {
    it('プレーンテキストを保持する', () => {
      const input = 'Hello world! This is plain text.';
      const result = sanitizePlainText(input);
      
      expect(result).toBe(input);
    });

    it('HTMLタグを除去する', () => {
      const input = 'Hello <script>alert("XSS")</script> world!';
      const result = sanitizePlainText(input);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('Hello');
      expect(result).toContain('world!');
    });

    it('改行文字を保持する', () => {
      const input = 'Line 1\\nLine 2\\nLine 3';
      const result = sanitizePlainText(input);
      
      expect(result).toContain('\\n');
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 3');
    });
  });

  describe('detectXSSAttempt', () => {
    it('基本的なscript攻撃を検出する', () => {
      expect(detectXSSAttempt('<script>alert(1)</script>')).toBe(true);
      expect(detectXSSAttempt('javascript:alert(1)')).toBe(true);
      expect(detectXSSAttempt('<iframe src="evil.com"></iframe>')).toBe(true);
    });

    it('イベントハンドラー攻撃を検出する', () => {
      expect(detectXSSAttempt('<img onerror="alert(1)" src="x">')).toBe(true);
      expect(detectXSSAttempt('<div onclick="malicious()">')).toBe(true);
      expect(detectXSSAttempt('<p onload="evil()">')).toBe(true);
    });

    it('data:スキーム攻撃を検出する', () => {
      expect(detectXSSAttempt('<a href="data:text/html,<script>alert(1)</script>">Link</a>')).toBe(true);
    });

    it('安全なコンテンツを通す', () => {
      expect(detectXSSAttempt('Hello world!')).toBe(false);
      expect(detectXSSAttempt('<p>Safe HTML content</p>')).toBe(false);
      expect(detectXSSAttempt('<a href="https://example.com">Safe link</a>')).toBe(false);
      expect(detectXSSAttempt('**Bold markdown**')).toBe(false);
    });

    it('大文字小文字を区別しない検出', () => {
      expect(detectXSSAttempt('<SCRIPT>alert(1)</SCRIPT>')).toBe(true);
      expect(detectXSSAttempt('JAVASCRIPT:alert(1)')).toBe(true);
      expect(detectXSSAttempt('<IMG ONERROR="alert(1)" SRC="x">')).toBe(true);
    });

    it('エンコードされた攻撃を検出する', () => {
      expect(detectXSSAttempt('&lt;script&gt;alert(1)&lt;/script&gt;')).toBe(true);
      expect(detectXSSAttempt('%3Cscript%3Ealert(1)%3C/script%3E')).toBe(true);
    });

    it('空文字列や無効な入力を処理する', () => {
      expect(detectXSSAttempt('')).toBe(false);
      expect(detectXSSAttempt(null as any)).toBe(false);
      expect(detectXSSAttempt(undefined as any)).toBe(false);
    });
  });
});