/**
 * XSS対策用サニタイゼーションユーティリティ
 * DOMPurifyを使用してユーザー入力を安全に処理
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * HTMLコンテンツのサニタイゼーション（基本版）
 * 限定的なHTMLタグのみ許可
 */
export const sanitizeHtml = (dirty: string): string => {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
  });
};

/**
 * マークダウン形式のコンテンツサニタイゼーション
 * より多くのタグを許可（記事投稿用）
 */
export const sanitizeMarkdown = (text: string): string => {
  if (!text) return '';
  
  return DOMPurify.sanitize(text, {
    USE_PROFILES: { html: false },
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'b', 'i', 'u',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'code', 'pre', 'blockquote',
      'span', 'div'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
  });
};

/**
 * プレーンテキストのサニタイゼーション
 * 全てのHTMLタグを除去
 */
export const sanitizePlainText = (text: string): string => {
  if (!text) return '';
  
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
};

/**
 * URLのサニタイゼーション
 * 安全なURLプロトコルのみ許可
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  
  // 許可するプロトコル
  const allowedProtocols = ['http:', 'https:', 'mailto:'];
  
  try {
    const parsed = new URL(url);
    if (!allowedProtocols.includes(parsed.protocol)) {
      return '';
    }
    return url;
  } catch {
    // 相対URLの場合はそのまま返す
    if (url.startsWith('/') || url.startsWith('#')) {
      return url;
    }
    return '';
  }
};

/**
 * 投稿コンテンツ用のサニタイゼーション
 * 掲示板の投稿内容に特化した設定
 */
export const sanitizePostContent = (content: string): string => {
  if (!content) return '';
  
  // 改行を保持しつつサニタイズ
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['br', 'p', 'strong', 'em', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ['style', 'onerror', 'onclick'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
    KEEP_CONTENT: true,
  });
  
  // 改行を<br>に変換（プレーンテキストの場合）
  return sanitized.replace(/\n/g, '<br>');
};

/**
 * 検索クエリのサニタイゼーション
 * 特殊文字をエスケープ
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (!query) return '';
  
  // HTML特殊文字をエスケープ
  return query
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * XSS攻撃の検出
 * 悪意のあるパターンをチェック
 */
export const detectXSSAttempt = (input: string): boolean => {
  if (!input) return false;
  
  const xssPatterns = [
    /<script[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick, onerror, etc.
    /<iframe/gi,
    /<embed/gi,
    /<object/gi,
    /eval\(/gi,
    /alert\(/gi,
    /document\./gi,
    /window\./gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * サニタイゼーション結果の検証
 * 元の内容と比較して変更があったかチェック
 */
export const wasContentSanitized = (original: string, sanitized: string): boolean => {
  return original !== sanitized;
};