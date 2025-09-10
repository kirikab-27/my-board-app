'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Restore as RestoreIcon } from '@mui/icons-material';

type Environment = 'development' | 'staging' | 'production';

interface ConfigHistoryProps {
  environment: Environment;
}

export default function ConfigHistory({ environment }: ConfigHistoryProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environment]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/config/rollback?environment=${environment}`);
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (key: string, version: number) => {
    if (!confirm(`設定 ${key} をバージョン ${version} にロールバックしますか？`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/config/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, environment, version }),
      });

      if (!response.ok) throw new Error('Failed to rollback');

      alert('ロールバックが完了しました');
      fetchHistory();
    } catch (error) {
      console.error('Error rolling back:', error);
      alert('ロールバックに失敗しました');
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'create':
        return 'success';
      case 'update':
        return 'info';
      case 'delete':
        return 'error';
      case 'rollback':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        変更履歴 - {environment}
      </Typography>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>日時</TableCell>
              <TableCell>キー</TableCell>
              <TableCell>変更タイプ</TableCell>
              <TableCell>前の値</TableCell>
              <TableCell>新しい値</TableCell>
              <TableCell>変更者</TableCell>
              <TableCell>理由</TableCell>
              <TableCell>バージョン</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((item) => (
              <TableRow key={item._id}>
                <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {item.key}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={item.changeType}
                    size="small"
                    color={getChangeTypeColor(item.changeType)}
                  />
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    fontFamily="monospace"
                    sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {JSON.stringify(item.previousValue)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    fontFamily="monospace"
                    sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {JSON.stringify(item.newValue)}
                  </Typography>
                </TableCell>
                <TableCell>{item.changedBy}</TableCell>
                <TableCell>{item.changeReason || '-'}</TableCell>
                <TableCell>v{item.version}</TableCell>
                <TableCell>
                  {item.changeType !== 'delete' && (
                    <Tooltip title="この版にロールバック">
                      <IconButton
                        size="small"
                        onClick={() => handleRollback(item.key, item.version)}
                      >
                        <RestoreIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
