'use client';

import React from 'react';
import {
  Box,
  Pagination as MuiPagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  SelectChangeEvent,
} from '@mui/material';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const limitOptions = [5, 10, 20, 50];

export default function Pagination({ pagination, onPageChange, onLimitChange }: PaginationProps) {
  const { currentPage, totalPages, totalCount, limit } = pagination;

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    onPageChange(page);
  };

  const handleLimitChange = (event: SelectChangeEvent) => {
    const newLimit = parseInt(event.target.value);
    onLimitChange(newLimit);
  };

  // 現在表示している投稿の範囲を計算
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalCount);

  if (totalCount === 0) {
    return null;
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', sm: 'row' },
      justifyContent: 'space-between', 
      alignItems: 'center',
      gap: { xs: 1, sm: 2 },
      minWidth: { sm: '350px' },
      width: { xs: '100%', sm: 'auto' }
    }}>
      {/* 表示件数設定 */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        order: { xs: 2, sm: 1 }
      }}>
        <FormControl size="small" sx={{ minWidth: 70 }}>
          <Select
            value={limit.toString()}
            onChange={handleLimitChange}
            displayEmpty
            sx={{ fontSize: '0.875rem' }}
          >
            {limitOptions.map((option) => (
              <MenuItem key={option} value={option.toString()}>
                {option}件
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {startItem}〜{endItem} / {totalCount}
        </Typography>
      </Box>

      {/* ページネーション */}
      <Box sx={{ 
        display: 'flex',
        justifyContent: { xs: 'center', sm: 'flex-end' },
        order: { xs: 1, sm: 2 }
      }}>
        {totalPages > 1 && (
          <MuiPagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            size="small"
            showFirstButton
            showLastButton
            siblingCount={0}
            boundaryCount={1}
          />
        )}
      </Box>
    </Box>
  );
}