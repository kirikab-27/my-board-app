'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  IconButton,
  Popover,
  Paper,
  TextField,
  InputAdornment,
  Box,
  Typography,
  Chip,
  Fade,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Clear as ClearIcon, 
  KeyboardReturn as EnterIcon 
} from '@mui/icons-material';

interface HeaderSearchIconProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  placeholder?: string;
  resultCount?: number;
}

export function HeaderSearchIcon({ 
  onSearch, 
  onClear, 
  placeholder = "投稿を検索...",
  resultCount 
}: HeaderSearchIconProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const open = Boolean(anchorEl);

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

  // キーボードショートカット (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        handleSearchIconClick(event as any);
      }
      if (event.key === 'Escape' && open) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleSearchIconClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    // ポップオーバー開いた後にフォーカス設定
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    onClear();
    searchInputRef.current?.focus();
  }, [onClear]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length > 0) {
      onSearch(query.trim());
    }
  }, [query, onSearch]);

  return (
    <>
      <IconButton
        onClick={handleSearchIconClick}
        color="inherit"
        aria-label="検索"
        title="検索 (Ctrl+K)"
        sx={{
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <SearchIcon />
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 200 }}
        sx={{
          '& .MuiPopover-paper': {
            mt: 1,
            minWidth: isMobile ? '90vw' : 400,
            maxWidth: isMobile ? '95vw' : 500,
          }
        }}
      >
        <Paper sx={{ p: 2 }}>
          <form onSubmit={handleSubmit}>
            <TextField
              ref={searchInputRef}
              fullWidth
              variant="outlined"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {query.length > 0 && (
                      <IconButton
                        size="small"
                        onClick={handleClear}
                        edge="end"
                        aria-label="クリア"
                      >
                        <ClearIcon />
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
          
          {/* ショートカットヒント */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {query.length > 0 ? 'Enterで検索' : 'Ctrl+K でクイック検索'}
            </Typography>
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip 
                  label="Ctrl+K" 
                  size="small" 
                  variant="outlined" 
                  sx={{ fontSize: '0.65rem', height: 20 }} 
                />
                <Typography variant="caption" color="text.secondary">
                  で開く
                </Typography>
              </Box>
            )}
          </Box>

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
                  別のキーワードで検索してください
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      </Popover>
    </>
  );
}