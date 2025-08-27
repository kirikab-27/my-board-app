'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface User {
  _id: string;
  name: string;
  username?: string;
  displayName?: string;
  avatar?: string;
}

export interface MentionRange {
  start: number;
  end: number;
  text: string;
}

export interface UseMentionOptions {
  onSearch: (query: string) => Promise<User[]>;
  minChars?: number;
  maxSuggestions?: number;
  debounceMs?: number;
}

export interface UseMentionResult {
  // 検索関連
  query: string;
  suggestions: User[];
  isLoading: boolean;
  showSuggestions: boolean;
  
  // 選択関連
  selectedIndex: number;
  
  // メンション処理
  mentionRange: MentionRange | null;
  mentions: User[];
  
  // メソッド
  handleTextChange: (text: string, cursorPosition: number) => void;
  selectSuggestion: (user: User) => { text: string; cursorPosition: number };
  handleKeyDown: (event: React.KeyboardEvent) => boolean;
  clearSuggestions: () => void;
  
  // 内部状態
  inputRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement>;
}

export const useMention = (options: UseMentionOptions): UseMentionResult => {
  const {
    onSearch,
    minChars = 1,
    maxSuggestions = 5,
    debounceMs = 300
  } = options;

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionRange, setMentionRange] = useState<MentionRange | null>(null);
  const [mentions, setMentions] = useState<User[]>([]);
  
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // メンション検索のデバウンス処理
  const debouncedSearch = useCallback(
    async (searchQuery: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(async () => {
        if (searchQuery.length >= minChars) {
          setIsLoading(true);
          try {
            const results = await onSearch(searchQuery);
            setSuggestions(results.slice(0, maxSuggestions));
            setShowSuggestions(results.length > 0);
            setSelectedIndex(0);
          } catch (error) {
            console.error('Mention search error:', error);
            setSuggestions([]);
            setShowSuggestions(false);
          } finally {
            setIsLoading(false);
          }
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }, debounceMs);
    },
    [onSearch, minChars, maxSuggestions, debounceMs]
  );

  // テキスト変更処理
  const handleTextChange = useCallback(
    (text: string, cursorPosition: number) => {
      // @記号から現在のカーソル位置までの範囲を検索
      const beforeCursor = text.substring(0, cursorPosition);
      const atIndex = beforeCursor.lastIndexOf('@');

      if (atIndex !== -1) {
        const afterAt = beforeCursor.substring(atIndex + 1);
        
        // @記号の後にスペースや改行が含まれていないかチェック
        if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
          const mentionQuery = afterAt;
          setQuery(mentionQuery);
          setMentionRange({
            start: atIndex,
            end: cursorPosition,
            text: `@${mentionQuery}`
          });
          
          // 検索実行
          debouncedSearch(mentionQuery);
        } else {
          // スペースや改行が含まれている場合は候補を非表示
          setShowSuggestions(false);
          setMentionRange(null);
        }
      } else {
        // @記号がない場合は候補を非表示
        setShowSuggestions(false);
        setMentionRange(null);
      }
    },
    [debouncedSearch]
  );

  // 候補選択処理
  const selectSuggestion = useCallback(
    (user: User): { text: string; cursorPosition: number } => {
      if (!inputRef.current || !mentionRange) {
        return { text: '', cursorPosition: 0 };
      }

      const input = inputRef.current;
      const currentText = input.value;
      const username = user.username || user.name;
      const mentionText = `@${username}`;

      // テキストを置換
      const newText = 
        currentText.substring(0, mentionRange.start) + 
        mentionText + ' ' +
        currentText.substring(mentionRange.end);

      const newCursorPosition = mentionRange.start + mentionText.length + 1;

      // メンション一覧に追加（重複チェック）
      const existingMention = mentions.find(m => m._id === user._id);
      if (!existingMention) {
        setMentions(prev => [...prev, user]);
      }

      // 候補を非表示
      setShowSuggestions(false);
      setMentionRange(null);
      setQuery('');
      setSuggestions([]);

      return { text: newText, cursorPosition: newCursorPosition };
    },
    [mentionRange, mentions]
  );

  // キーボード操作処理
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent): boolean => {
      if (!showSuggestions || suggestions.length === 0) {
        return false;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          return true;

        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          return true;

        case 'Enter':
        case 'Tab':
          event.preventDefault();
          const selectedUser = suggestions[selectedIndex];
          if (selectedUser) {
            const result = selectSuggestion(selectedUser);
            if (inputRef.current) {
              inputRef.current.value = result.text;
              inputRef.current.setSelectionRange(result.cursorPosition, result.cursorPosition);
            }
          }
          return true;

        case 'Escape':
          event.preventDefault();
          setShowSuggestions(false);
          setMentionRange(null);
          return true;

        default:
          return false;
      }
    },
    [showSuggestions, suggestions, selectedIndex, selectSuggestion]
  );

  // 候補をクリア
  const clearSuggestions = useCallback(() => {
    setShowSuggestions(false);
    setQuery('');
    setSuggestions([]);
    setMentionRange(null);
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    query,
    suggestions,
    isLoading,
    showSuggestions,
    selectedIndex,
    mentionRange,
    mentions,
    handleTextChange,
    selectSuggestion,
    handleKeyDown,
    clearSuggestions,
    inputRef
  };
};

export default useMention;