import React from 'react';
import { Box } from '@mui/material';

/**
 * テキスト内の検索クエリをハイライト表示する
 * @param text ハイライト対象のテキスト
 * @param query 検索クエリ
 * @returns ハイライト済みのReact要素
 */
export function highlightText(text: string, query: string): React.ReactNode {
  if (!query || query.trim().length === 0) {
    return text;
  }

  const trimmedQuery = query.trim();
  
  try {
    // 正規表現で大文字小文字を区別しない検索
    const regex = new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, index) => {
          const isMatch = regex.test(part);
          // 正規表現のlastIndexをリセット
          regex.lastIndex = 0;
          
          if (isMatch) {
            return (
              <Box
                key={index}
                component="span"
                sx={{
                  backgroundColor: 'yellow',
                  color: 'black',
                  fontWeight: 'bold',
                  padding: '1px 2px',
                  borderRadius: '2px'
                }}
              >
                {part}
              </Box>
            );
          }
          return part;
        })}
      </>
    );
  } catch (error) {
    // 正規表現エラーの場合は元のテキストを返す
    console.error('Highlight text error:', error);
    return text;
  }
}

/**
 * 正規表現の特殊文字をエスケープする
 * @param string エスケープ対象の文字列
 * @returns エスケープされた文字列
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}