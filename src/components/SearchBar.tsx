'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Chip,
  Paper,
  Typography
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  loading?: boolean;
  resultCount?: number;
  placeholder?: string;
}

export default function SearchBar({ 
  onSearch, 
  onClear, 
  loading = false, 
  resultCount,
  placeholder = "投稿を検索..."
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // デバウンス処理（300ms）
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // デバウンスされたクエリが変更されたら検索実行
  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      onSearch(debouncedQuery.trim());
    } else if (debouncedQuery.length === 0) {
      onClear();
    }
  }, [debouncedQuery, onSearch, onClear]);

  const handleClear = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    onClear();
  }, [onClear]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length > 0) {
      onSearch(query.trim());
    }
  }, [query, onSearch]);

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {loading && <CircularProgress size={20} />}
                {query.length > 0 && !loading && (
                  <IconButton
                    size="small"
                    onClick={handleClear}
                    edge="end"
                  >
                    <Clear />
                  </IconButton>
                )}
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        />
      </form>
      
      {/* 検索結果の件数表示 */}
      {debouncedQuery.length > 0 && resultCount !== undefined && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={`"${debouncedQuery}" の検索結果: ${resultCount}件`}
            size="small"
            color="primary"
            variant="outlined"
          />
          {resultCount === 0 && (
            <Typography variant="body2" color="text.secondary">
              別のキーワードで検索してみてください
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
}