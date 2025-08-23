'use client';

import React from 'react';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  Typography,
  SelectChangeEvent,
  Chip,
} from '@mui/material';
import {
  AccessTime,
  Update,
  ThumbUp,
  TrendingUp,
  TrendingDown,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from '@mui/icons-material';

export type SortOption = 
  | 'createdAt_desc'
  | 'createdAt_asc' 
  | 'likes_desc'
  | 'likes_asc'
  | 'updatedAt_desc'
  | 'updatedAt_asc';

export interface SortSelectorProps {
  value: SortOption;
  onChange: (sortBy: SortOption) => void;
  disabled?: boolean;
  size?: 'small' | 'medium';
}

const sortOptions: Array<{
  value: SortOption;
  label: string;
  icon: React.ReactNode;
  description: string;
}> = [
  {
    value: 'createdAt_desc',
    label: '新しい順',
    icon: <AccessTime />,
    description: '新しく作成された投稿から表示'
  },
  {
    value: 'createdAt_asc',
    label: '古い順',
    icon: <AccessTime />,
    description: '古く作成された投稿から表示'
  },
  {
    value: 'likes_desc',
    label: 'いいね数（多い順）',
    icon: <ThumbUp />,
    description: '人気の投稿から表示'
  },
  {
    value: 'likes_asc',
    label: 'いいね数（少ない順）',
    icon: <ThumbUp />,
    description: 'いいね数の少ない投稿から表示'
  },
  {
    value: 'updatedAt_desc',
    label: '更新順（新しい順）',
    icon: <Update />,
    description: '最近更新された投稿から表示'
  },
  {
    value: 'updatedAt_asc',
    label: '更新順（古い順）',
    icon: <Update />,
    description: '更新日が古い投稿から表示'
  }
];

export function SortSelector({
  value,
  onChange,
  disabled = false,
  size = 'medium'
}: SortSelectorProps) {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value as SortOption);
  };

  const currentOption = sortOptions.find(option => option.value === value);

  return (
    <Box sx={{ minWidth: 200, maxWidth: 300 }}>
      <FormControl fullWidth size={size} disabled={disabled}>
        <Select
          value={value}
          onChange={handleChange}
          displayEmpty
          sx={{
            '& .MuiSelect-select': {
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: size === 'small' ? 1 : 1.5,
            },
          }}
        >
          {sortOptions.map((option) => (
            <MenuItem 
              key={option.value} 
              value={option.value}
              sx={{ 
                py: 1.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 0.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: 'primary.main',
                    fontSize: '1.2rem' 
                  }}
                >
                  {option.icon}
                </Box>
                <Typography variant="body2" fontWeight={500}>
                  {option.label}
                </Typography>
                {/* 昇順・降順のインジケーター */}
                {option.value.endsWith('_desc') ? (
                  <KeyboardArrowDown sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                ) : (
                  <KeyboardArrowUp sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                )}
              </Box>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ fontSize: '0.75rem', pl: 4 }}
              >
                {option.description}
              </Typography>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* 現在のソート条件を表示 */}
      {currentOption && (
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={currentOption.icon}
            label={currentOption.label}
            size="small"
            variant="outlined"
            color="primary"
            sx={{
              fontSize: '0.75rem',
              height: 24,
              '& .MuiChip-icon': {
                fontSize: '0.9rem'
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
}

export default SortSelector;