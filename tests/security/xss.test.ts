/**
 * XSS対策テストスイート
 * DOMPurifyサニタイゼーション機能のテスト
 */

import { 
  sanitizeHtml, 
  sanitizeMarkdown, 
  sanitizePlainText,
  sanitizePostContent,
  sanitizeSearchQuery,
  detectXSSAttempt,
  wasContentSanitized 
} from '@/utils/security/sanitizer';

describe('XSS Protection Tests', () => {
  
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const malicious = '<script>alert("XSS")</script>Hello World';
      const sanitized = sanitizeHtml(malicious);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Hello World');
    });

    it('should remove event handlers', () => {
      const malicious = '<img src=x onerror="alert(1)" />Image';
      const sanitized = sanitizeHtml(malicious);
      
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove javascript: URLs', () => {
      const malicious = '<a href="javascript:alert(1)">Click me</a>';
      const sanitized = sanitizeHtml(malicious);
      
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Click me');
    });

    it('should allow safe HTML tags', () => {
      const safe = '<strong>Bold</strong> and <em>italic</em> text';
      const sanitized = sanitizeHtml(safe);
      
      expect(sanitized).toContain('<strong>');
      expect(sanitized).toContain('<em>');
      expect(sanitized).toContain('Bold');
      expect(sanitized).toContain('italic');
    });

    it('should remove forbidden attributes', () => {
      const malicious = '<p style="background:red" onclick="alert(1)">Text</p>';
      const sanitized = sanitizeHtml(malicious);
      
      expect(sanitized).not.toContain('style');
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).toContain('Text');
    });
  });

  describe('sanitizePlainText', () => {
    it('should remove all HTML tags', () => {
      const htmlContent = '<script>alert("XSS")</script><strong>Bold</strong> text';
      const sanitized = sanitizePlainText(htmlContent);
      
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).toContain('Bold');
      expect(sanitized).toContain('text');
    });

    it('should preserve text content', () => {
      const content = 'This is <b>important</b> information';
      const sanitized = sanitizePlainText(content);
      
      expect(sanitized).toBe('This is important information');
    });
  });

  describe('sanitizePostContent', () => {
    it('should preserve line breaks as <br> tags', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const sanitized = sanitizePostContent(content);
      
      expect(sanitized).toContain('<br>');
      expect(sanitized).toContain('Line 1');
      expect(sanitized).toContain('Line 2');
      expect(sanitized).toContain('Line 3');
    });

    it('should remove dangerous content but keep formatting', () => {
      const content = '<script>alert("XSS")</script>\n<strong>Important</strong> message';
      const sanitized = sanitizePostContent(content);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('<strong>Important</strong>');
      expect(sanitized).toContain('<br>');
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('should escape HTML special characters', () => {
      const query = '<script>alert("XSS")</script>';
      const sanitized = sanitizeSearchQuery(query);
      
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
    });

    it('should handle ampersands correctly', () => {
      const query = 'Tom & Jerry';
      const sanitized = sanitizeSearchQuery(query);
      
      expect(sanitized).toBe('Tom &amp; Jerry');
    });
  });

  describe('detectXSSAttempt', () => {
    it('should detect script tags', () => {
      const malicious = '<script>alert("XSS")</script>';
      expect(detectXSSAttempt(malicious)).toBe(true);
    });

    it('should detect event handlers', () => {
      const malicious = '<img onerror="alert(1)" src=x>';
      expect(detectXSSAttempt(malicious)).toBe(true);
    });

    it('should detect javascript: URLs', () => {
      const malicious = 'javascript:alert(1)';
      expect(detectXSSAttempt(malicious)).toBe(true);
    });

    it('should detect common XSS patterns', () => {
      const patterns = [
        '<iframe src="javascript:alert(1)"></iframe>',
        '<object data="javascript:alert(1)"></object>',
        '<embed src="javascript:alert(1)">',
        'eval(alert(1))',
        'document.cookie',
        'window.location'
      ];
      
      patterns.forEach(pattern => {
        expect(detectXSSAttempt(pattern)).toBe(true);
      });
    });

    it('should not flag safe content', () => {
      const safeContent = [
        'Hello world',
        '<strong>Bold text</strong>',
        'This is a normal message',
        'Email: user@example.com'
      ];
      
      safeContent.forEach(content => {
        expect(detectXSSAttempt(content)).toBe(false);
      });
    });
  });

  describe('wasContentSanitized', () => {
    it('should detect when content was changed', () => {
      const original = '<script>alert("XSS")</script>Hello';
      const sanitized = 'Hello';
      
      expect(wasContentSanitized(original, sanitized)).toBe(true);
    });

    it('should detect when content was not changed', () => {
      const content = 'Hello world';
      
      expect(wasContentSanitized(content, content)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizePlainText('')).toBe('');
      expect(detectXSSAttempt('')).toBe(false);
    });

    it('should handle null and undefined', () => {
      // @ts-ignore - Testing runtime behavior
      expect(sanitizeHtml(null)).toBe('');
      // @ts-ignore - Testing runtime behavior  
      expect(sanitizePlainText(undefined)).toBe('');
    });

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(10000) + '<script>alert("XSS")</script>';
      const sanitized = sanitizeHtml(longContent);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized.length).toBeLessThan(longContent.length);
    });

    it('should handle Unicode characters', () => {
      const unicode = '🚀 Hello 世界 <strong>混合</strong> content';
      const sanitized = sanitizeHtml(unicode);
      
      expect(sanitized).toContain('🚀');
      expect(sanitized).toContain('世界');
      expect(sanitized).toContain('<strong>混合</strong>');
    });
  });
});

describe('XSS Protection Integration Tests', () => {
  it('should sanitize content in realistic scenarios', () => {
    const userPost = `
      Hello! Check out this <strong>amazing</strong> website:
      <a href="javascript:alert('XSS')">Click here</a>
      
      <script>
        // This should be removed
        document.cookie = "stolen";
      </script>
      
      But this <em>emphasis</em> should remain!
    `;
    
    const sanitized = sanitizePostContent(userPost);
    
    // Should keep safe formatting
    expect(sanitized).toContain('<strong>amazing</strong>');
    expect(sanitized).toContain('<em>emphasis</em>');
    
    // Should remove dangerous content
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).not.toContain('document.cookie');
    
    // Should preserve line breaks
    expect(sanitized).toContain('<br>');
  });
});