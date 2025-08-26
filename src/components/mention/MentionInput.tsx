'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  TextField,
  TextFieldProps,
  Box
} from '@mui/material';
import { useMention, User } from './useMention';
import UserSuggestions from './UserSuggestions';

export interface MentionInputProps extends Omit<TextFieldProps, 'onChange' | 'onKeyDown'> {
  value: string;
  onChange: (value: string, mentions: User[]) => void;
  onSearch: (query: string) => Promise<User[]>;
  placeholder?: string;
  disabled?: boolean;
  minChars?: number;
  maxSuggestions?: number;
  debounceMs?: number;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = 'メッセージを入力... (@でユーザーをメンション)',
  disabled = false,
  minChars = 1,
  maxSuggestions = 5,
  debounceMs = 300,
  ...textFieldProps
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  const mention = useMention({
    onSearch,
    minChars,
    maxSuggestions,
    debounceMs
  });

  // 外部のvalue変更に対応
  useEffect(() => {
    if (value !== internalValue) {
      setInternalValue(value);
    }
  }, [value]);

  // テキスト変更ハンドラ
  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      const newValue = event.target.value;
      const newCursorPosition = event.target.selectionStart || 0;

      setInternalValue(newValue);
      setCursorPosition(newCursorPosition);

      // メンション処理
      mention.handleTextChange(newValue, newCursorPosition);

      // 外部のonChangeを呼び出し
      onChange(newValue, mention.mentions);
    },
    [onChange, mention]
  );

  // キーダウンハンドラ
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      // メンション候補が表示されている場合はメンションのキーハンドラを実行
      if (mention.showSuggestions) {
        const handled = mention.handleKeyDown(event);
        if (handled) {
          // Enter/Tabでメンション選択された場合はテキストを更新
          if ((event.key === 'Enter' || event.key === 'Tab') && mention.suggestions.length > 0) {
            const selectedUser = mention.suggestions[selectedSuggestionIndex];
            if (selectedUser) {
              const result = mention.selectSuggestion(selectedUser);
              setInternalValue(result.text);
              onChange(result.text, mention.mentions);
              
              // カーソル位置を設定（次のrenderで適用）
              setTimeout(() => {
                if (mention.inputRef.current) {
                  mention.inputRef.current.setSelectionRange(
                    result.cursorPosition,
                    result.cursorPosition
                  );
                }
              }, 0);
            }
          }
          return;
        }
      }

      // その他のキーは親コンポーネントに委譲
      if ((textFieldProps as any).onKeyDown) {
        (textFieldProps as any).onKeyDown(event);
      }
    },
    [mention, selectedSuggestionIndex, onChange, (textFieldProps as any).onKeyDown]
  );

  // カーソル位置の更新
  const handleSelectionChange = useCallback(
    (event: React.SyntheticEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      const target = event.target as HTMLTextAreaElement | HTMLInputElement;
      setCursorPosition(target.selectionStart || 0);
    },
    []
  );

  // 候補選択
  const handleSuggestionSelect = useCallback(
    (user: User) => {
      const result = mention.selectSuggestion(user);
      setInternalValue(result.text);
      onChange(result.text, mention.mentions);

      // フォーカスとカーソル位置を設定
      setTimeout(() => {
        if (mention.inputRef.current) {
          mention.inputRef.current.focus();
          mention.inputRef.current.setSelectionRange(
            result.cursorPosition,
            result.cursorPosition
          );
        }
      }, 0);
    },
    [mention, onChange]
  );

  // 候補のマウスホバー
  const handleSuggestionMouseEnter = useCallback(
    (index: number) => {
      setSelectedSuggestionIndex(index);
    },
    []
  );

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        {...textFieldProps}
        inputRef={mention.inputRef}
        value={internalValue}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown as any}
        onSelect={handleSelectionChange as any}
        onClick={handleSelectionChange as any}
        placeholder={placeholder}
        disabled={disabled}
        fullWidth
        multiline
        minRows={textFieldProps.minRows || 3}
        maxRows={textFieldProps.maxRows || 8}
        sx={{
          '& .MuiInputBase-root': {
            fontSize: '0.9rem',
          },
          ...textFieldProps.sx
        }}
      />

      <UserSuggestions
        suggestions={mention.suggestions}
        selectedIndex={selectedSuggestionIndex}
        isLoading={mention.isLoading}
        show={mention.showSuggestions}
        anchorEl={mention.inputRef.current}
        onSelect={handleSuggestionSelect}
        onMouseEnter={handleSuggestionMouseEnter}
      />
    </Box>
  );
};

export default MentionInput;