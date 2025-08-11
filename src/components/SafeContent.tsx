'use client';

import React from 'react';
import { Box, Alert } from '@mui/material';
import {
  sanitizeHtml,
  sanitizeMarkdown,
  sanitizePostContent,
  detectXSSAttempt,
  wasContentSanitized,
} from '@/utils/security/sanitizer';

interface SafeContentProps {
  content: string;
  type?: 'html' | 'markdown' | 'post' | 'plain';
  showWarning?: boolean;
  className?: string;
  sx?: Record<string, unknown>;
}

/**
 * XSS攻撃から保護された安全なコンテンツ表示コンポーネント
 */
export function SafeContent({
  content,
  type = 'post',
  showWarning = false,
  className,
  sx,
}: SafeContentProps) {
  // XSS攻撃の検出
  const isXSSAttempt = detectXSSAttempt(content);

  // コンテンツタイプに応じたサニタイゼーション
  let sanitizedContent = '';
  switch (type) {
    case 'html':
      sanitizedContent = sanitizeHtml(content);
      break;
    case 'markdown':
      sanitizedContent = sanitizeMarkdown(content);
      break;
    case 'post':
      sanitizedContent = sanitizePostContent(content);
      break;
    case 'plain':
      // プレーンテキストの場合はそのまま表示（HTMLとして解釈しない）
      return (
        <Box className={className} sx={sx}>
          {showWarning && isXSSAttempt && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              潜在的に危険なコンテンツが検出され、安全に処理されました。
            </Alert>
          )}
          <Box
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              margin: 0,
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto',
            }}
          >
            {content}
          </Box>
        </Box>
      );
    default:
      sanitizedContent = sanitizePostContent(content);
  }

  // サニタイゼーションによる変更があったかチェック
  const wasModified = wasContentSanitized(content, sanitizedContent);

  // セキュリティログ（開発環境のみ）
  if (process.env.NODE_ENV === 'development' && wasModified) {
    console.warn('[SafeContent] Content was sanitized:', {
      original: content.substring(0, 100),
      sanitized: sanitizedContent.substring(0, 100),
      xssDetected: isXSSAttempt,
    });
  }

  return (
    <Box className={className} sx={sx}>
      {showWarning && isXSSAttempt && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          潜在的に危険なコンテンツが検出され、安全に処理されました。
        </Alert>
      )}
      <Box
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        sx={{
          // 基本的な文字折り返し設定
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          hyphens: 'auto',
          whiteSpace: 'pre-wrap',
          // 子要素の折り返し設定
          '& *': {
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            maxWidth: '100%',
          },
          '& a': {
            color: 'primary.main',
            textDecoration: 'underline',
            '&:hover': {
              textDecoration: 'none',
            },
          },
          '& code': {
            backgroundColor: 'grey.100',
            padding: '2px 4px',
            borderRadius: 1,
            fontFamily: 'monospace',
          },
          '& pre': {
            backgroundColor: 'grey.100',
            padding: 2,
            borderRadius: 1,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
          },
          '& blockquote': {
            borderLeft: '4px solid',
            borderColor: 'primary.main',
            paddingLeft: 2,
            marginLeft: 0,
            fontStyle: 'italic',
          },
        }}
      />
    </Box>
  );
}

/**
 * 投稿コンテンツ専用の安全表示コンポーネント
 */
export function SafePostContent({ content, ...props }: Omit<SafeContentProps, 'type'>) {
  return <SafeContent content={content} type="post" {...props} />;
}

/**
 * HTMLコンテンツ専用の安全表示コンポーネント
 */
export function SafeHtmlContent({ content, ...props }: Omit<SafeContentProps, 'type'>) {
  return <SafeContent content={content} type="html" {...props} />;
}

/**
 * マークダウンコンテンツ専用の安全表示コンポーネント
 */
export function SafeMarkdownContent({ content, ...props }: Omit<SafeContentProps, 'type'>) {
  return <SafeContent content={content} type="markdown" {...props} />;
}
