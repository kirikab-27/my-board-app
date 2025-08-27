'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Chip,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography,
  Autocomplete,
  createFilterOptions
} from '@mui/material';
import { Tag as TagIcon } from '@mui/icons-material';

interface HashtagSuggestion {
  name: string;
  displayName: string;
  totalPosts?: number;
  isTrending?: boolean;
  isOfficial?: boolean;
}

interface HashtagInputProps {
  value: string[];
  onChange: (hashtags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  suggestions?: HashtagSuggestion[];
  onSuggestionSearch?: (query: string) => void;
  showSuggestions?: boolean;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'filled' | 'standard';
}

const filter = createFilterOptions<HashtagSuggestion>();

export default function HashtagInput({
  value = [],
  onChange,
  placeholder = 'ハッシュタグを入力... (#例: #技術 #プログラミング)',
  maxTags = 10,
  disabled = false,
  suggestions = [],
  onSuggestionSearch,
  showSuggestions = true,
  size = 'medium',
  variant = 'outlined'
}: HashtagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [localSuggestions, setLocalSuggestions] = useState<HashtagSuggestion[]>(suggestions);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // ハッシュタグの正規化
  const normalizeHashtag = (tag: string): string => {
    return tag.toLowerCase().replace(/^#/, '').trim();
  };

  // ハッシュタグの検証
  const validateHashtag = (tag: string): boolean => {
    const normalized = normalizeHashtag(tag);
    return /^[a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/.test(normalized) && 
           normalized.length >= 1 && 
           normalized.length <= 50;
  };

  // ハッシュタグ候補検索
  const searchSuggestions = async (query: string) => {
    if (!query || query.length < 1) {
      setLocalSuggestions(suggestions);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/hashtags/search?q=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();
      
      if (data.success && data.hashtags) {
        const newSuggestions = data.hashtags.map((hashtag: any) => ({
          name: hashtag.name,
          displayName: hashtag.displayName,
          totalPosts: hashtag.stats?.totalPosts || 0,
          isTrending: hashtag.isTrending,
          isOfficial: hashtag.isOfficial
        }));
        setLocalSuggestions(newSuggestions);
      }
    } catch (error) {
      console.error('ハッシュタグ検索エラー:', error);
    } finally {
      setIsLoading(false);
    }

    // 外部コールバック実行
    if (onSuggestionSearch) {
      onSuggestionSearch(query);
    }
  };

  // デバウンス検索
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (showSuggestions && inputValue) {
      timeoutRef.current = setTimeout(() => {
        searchSuggestions(normalizeHashtag(inputValue));
      }, 300);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inputValue, showSuggestions]);

  // ハッシュタグ追加
  const addHashtag = (tagInput: string) => {
    const normalized = normalizeHashtag(tagInput);
    
    if (!normalized) return;
    
    if (!validateHashtag(normalized)) {
      console.warn('無効なハッシュタグ:', tagInput);
      return;
    }

    if (value.includes(normalized)) {
      console.warn('重複するハッシュタグ:', normalized);
      return;
    }

    if (value.length >= maxTags) {
      console.warn(`ハッシュタグは${maxTags}個まで追加できます`);
      return;
    }

    onChange([...value, normalized]);
    setInputValue('');
  };

  // ハッシュタグ削除
  const removeHashtag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  // エンターキー・スペース・カンマでの追加
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === ',') {
      event.preventDefault();
      if (inputValue.trim()) {
        addHashtag(inputValue.trim());
      }
    }
    
    if (event.key === 'Backspace' && !inputValue && value.length > 0) {
      removeHashtag(value[value.length - 1]);
    }
  };

  // オートコンプリートオプション
  const options = showSuggestions ? localSuggestions : [];

  return (
    <Box>
      {/* 選択済みハッシュタグ表示 */}
      {value.length > 0 && (
        <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {value.map((tag, index) => (
            <Chip
              key={index}
              label={`#${tag}`}
              onDelete={() => removeHashtag(tag)}
              size={size}
              icon={<TagIcon />}
              color="primary"
              variant="outlined"
              disabled={disabled}
            />
          ))}
        </Box>
      )}

      {/* ハッシュタグ入力フィールド */}
      <Autocomplete
        multiple={false}
        options={options}
        getOptionLabel={(option) => 
          typeof option === 'string' ? option : option.displayName || option.name
        }
        filterOptions={(options, params) => {
          const filtered = filter(options, params);
          
          // 入力値が既存のオプションにない場合、新しいオプションとして追加
          const { inputValue } = params;
          const normalized = normalizeHashtag(inputValue);
          
          if (normalized && validateHashtag(normalized) && !value.includes(normalized)) {
            const isExisting = filtered.some(option => option.name === normalized);
            if (!isExisting) {
              filtered.unshift({
                name: normalized,
                displayName: `#${normalized} (新規作成)`,
                totalPosts: 0
              });
            }
          }
          
          return filtered;
        }}
        renderOption={(props, option) => (
          <ListItem {...props} key={option.name}>
            <TagIcon sx={{ mr: 1, color: option.isTrending ? 'red' : 'primary.main' }} />
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1">
                    #{option.displayName || option.name}
                  </Typography>
                  {option.isOfficial && (
                    <Chip label="公式" size="small" color="primary" />
                  )}
                  {option.isTrending && (
                    <Chip label="トレンド" size="small" color="error" />
                  )}
                </Box>
              }
              secondary={option.totalPosts ? `${option.totalPosts}件の投稿` : undefined}
            />
          </ListItem>
        )}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        onChange={(event, selectedOption) => {
          if (selectedOption) {
            addHashtag(typeof selectedOption === 'string' ? selectedOption : selectedOption.name);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={value.length === 0 ? placeholder : 'さらにハッシュタグを追加...'}
            variant={variant}
            size={size}
            disabled={disabled}
            onKeyDown={handleKeyDown}
            helperText={
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {value.length}/{maxTags} 個のハッシュタグ
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Enter、スペース、カンマで追加
                </Typography>
              </Box>
            }
            FormHelperTextProps={{
              component: 'div'
            }}
          />
        )}
        loading={isLoading}
        loadingText="検索中..."
        noOptionsText="ハッシュタグが見つかりません"
        disabled={disabled || value.length >= maxTags}
        freeSolo
      />

      {/* 入力ガイド */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        💡 ヒント: 日本語、英数字、アンダースコアが使用できます（1-50文字）
      </Typography>
    </Box>
  );
}