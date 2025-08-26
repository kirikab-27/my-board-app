'use client';

import React from 'react';
import { Typography, Link, Box } from '@mui/material';

export interface MentionRendererProps {
  content: string;
  className?: string;
  onMentionClick?: (username: string) => void;
}

export const MentionRenderer: React.FC<MentionRendererProps> = ({
  content,
  className,
  onMentionClick
}) => {
  // @mentionパターンを検出する正規表現
  const mentionRegex = /@(\w+)/g;
  
  // テキストを解析してメンション部分と通常テキストに分割
  const parseContent = (text: string) => {
    const parts: (string | { type: 'mention'; username: string })[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // メンション前のテキスト
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // メンション部分
      parts.push({
        type: 'mention',
        username: match[1]
      });

      lastIndex = match.index + match[0].length;
    }

    // 残りのテキスト
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  // メンションクリックハンドラ
  const handleMentionClick = (username: string, event: React.MouseEvent) => {
    event.preventDefault();
    if (onMentionClick) {
      onMentionClick(username);
    } else {
      // デフォルト動作: ユーザープロフィールページに遷移
      window.location.href = `/users/${username}`;
    }
  };

  const parts = parseContent(content);

  return (
    <Typography className={className} component="span">
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          // 改行を<br>に変換
          return part.split('\n').map((line, lineIndex) => (
            <React.Fragment key={`${index}-${lineIndex}`}>
              {lineIndex > 0 && <br />}
              {line}
            </React.Fragment>
          ));
        } else if (part.type === 'mention') {
          // メンション部分をリンクとして表示
          return (
            <Link
              key={index}
              component="button"
              variant="body2"
              onClick={(event) => handleMentionClick(part.username, event)}
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                padding: 0,
                font: 'inherit',
                '&:hover': {
                  textDecoration: 'underline',
                  backgroundColor: 'primary.light',
                  px: 0.5,
                  borderRadius: 0.5,
                },
                '&:focus': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 1,
                },
              }}
            >
              @{part.username}
            </Link>
          );
        }
        return null;
      })}
    </Typography>
  );
};

// 静的メソッド: メンションユーザー名を抽出
export const extractMentions = (content: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    const username = match[1];
    if (!mentions.includes(username)) {
      mentions.push(username);
    }
  }

  return mentions;
};

// 静的メソッド: テキスト内にメンションが含まれているかチェック
export const hasMentions = (content: string): boolean => {
  const mentionRegex = /@(\w+)/g;
  return mentionRegex.test(content);
};

export default MentionRenderer;