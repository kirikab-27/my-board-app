'use client';

import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { Sort } from '@mui/icons-material';

export type SortOption = 'createdAt_desc' | 'createdAt_asc' | 'likes_desc' | 'likes_asc' | 'updatedAt_desc' | 'updatedAt_asc';

interface SortSelectorProps {
  value: SortOption;
  onChange: (sortOption: SortOption) => void;
}

const sortOptions = [
  { value: 'createdAt_desc' as SortOption, label: '作成日時（新しい順）' },
  { value: 'createdAt_asc' as SortOption, label: '作成日時（古い順）' },
  { value: 'likes_desc' as SortOption, label: 'いいね数（多い順）' },
  { value: 'likes_asc' as SortOption, label: 'いいね数（少ない順）' },
  { value: 'updatedAt_desc' as SortOption, label: '更新日時（新しい順）' },
  { value: 'updatedAt_asc' as SortOption, label: '更新日時（古い順）' },
];

export default function SortSelector({ value, onChange }: SortSelectorProps) {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value as SortOption);
  };

  return (
    <Box sx={{ minWidth: 200 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="sort-select-label">並び替え</InputLabel>
        <Select
          labelId="sort-select-label"
          id="sort-select"
          value={value}
          label="並び替え"
          onChange={handleChange}
          startAdornment={<Sort sx={{ mr: 1, color: 'action.active' }} />}
        >
          {sortOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}