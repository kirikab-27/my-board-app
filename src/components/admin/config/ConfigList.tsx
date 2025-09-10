'use client';

import { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Typography,
  InputAdornment,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FlashOn as FlashOnIcon,
} from '@mui/icons-material';

type Environment = 'development' | 'staging' | 'production';

interface ConfigListProps {
  configs: any[];
  environment: Environment;
  onEnvironmentChange: (environment: Environment) => void;
  onConfigSelect: (config: any) => void;
  onConfigDelete: (key: string) => void;
  onRefresh: () => void;
}

export default function ConfigList({
  configs,
  environment,
  onEnvironmentChange,
  onConfigSelect,
  onConfigDelete,
  onRefresh,
}: ConfigListProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // カテゴリー一覧を取得
  const categories = Array.from(new Set(configs.map((c) => c.category)));

  // フィルタリング
  const filteredConfigs = configs.filter((config) => {
    const matchesSearch =
      config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || config.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // ページネーション
  const paginatedConfigs = filteredConfigs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, any> = {
      security: 'error',
      email: 'primary',
      features: 'success',
      general: 'default',
      performance: 'warning',
      api: 'info',
    };
    return colors[category] || 'default';
  };

  const getDataTypeIcon = (dataType: string) => {
    const icons: Record<string, string> = {
      string: 'abc',
      number: '123',
      boolean: '✓✗',
      json: '{}',
    };
    return icons[dataType] || '?';
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>環境</InputLabel>
          <Select
            value={environment}
            label="環境"
            onChange={(e) => onEnvironmentChange(e.target.value as Environment)}
          >
            <MenuItem value="development">Development</MenuItem>
            <MenuItem value="staging">Staging</MenuItem>
            <MenuItem value="production">Production</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>カテゴリー</InputLabel>
          <Select
            value={categoryFilter}
            label="カテゴリー"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="all">すべて</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          placeholder="設定を検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />

        <Tooltip title="更新">
          <IconButton onClick={onRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>キー</TableCell>
              <TableCell>値</TableCell>
              <TableCell>説明</TableCell>
              <TableCell>カテゴリー</TableCell>
              <TableCell>型</TableCell>
              <TableCell>属性</TableCell>
              <TableCell>バージョン</TableCell>
              <TableCell>最終更新</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedConfigs.map((config) => (
              <TableRow key={config.key} hover>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {config.key}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    fontFamily="monospace"
                    sx={{
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {config.isSecret ? '•••••••••' : JSON.stringify(config.value)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 250 }}>
                    {config.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={config.category}
                    size="small"
                    color={getCategoryColor(config.category)}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={`${getDataTypeIcon(config.dataType)} ${config.dataType}`}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    {config.isSecret && (
                      <Tooltip title="暗号化">
                        <LockIcon fontSize="small" color="action" />
                      </Tooltip>
                    )}
                    {config.isHotReloadable && (
                      <Tooltip title="ホットリロード対応">
                        <FlashOnIcon fontSize="small" color="warning" />
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip label={`v${config.version}`} size="small" />
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {new Date(config.lastModifiedAt).toLocaleDateString()}
                    <br />
                    {config.lastModifiedBy}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row">
                    <Tooltip title="編集">
                      <IconButton size="small" onClick={() => onConfigSelect(config)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="削除">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onConfigDelete(config.key)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredConfigs.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="表示件数："
      />
    </Box>
  );
}
