'use client';

import { useState } from 'react';
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Stack,
  Alert,
} from '@mui/material';
import { Compare as CompareIcon } from '@mui/icons-material';

type Environment = 'development' | 'staging' | 'production';

export default function ConfigDiff() {
  const [env1, setEnv1] = useState<Environment>('development');
  const [env2, setEnv2] = useState<Environment>('production');
  const [diff, setDiff] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (env1 === env2) {
      alert('異なる環境を選択してください');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/config/diff?env1=${env1}&env2=${env2}`);
      if (!response.ok) throw new Error('Failed to compare configurations');
      const data = await response.json();
      setDiff(data);
    } catch (error) {
      console.error('Error comparing configs:', error);
    } finally {
      setLoading(false);
    }
  };

  // const getDifferenceColor = (difference: string) => {
  //   switch (difference) {
  //     case 'missing_in_env1':
  //       return 'error';
  //     case 'missing_in_env2':
  //       return 'warning';
  //     case 'different_value':
  //       return 'info';
  //     case 'same':
  //       return 'success';
  //     default:
  //       return 'default';
  //   }
  // };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>環境1</InputLabel>
          <Select
            value={env1}
            label="環境1"
            onChange={(e) => setEnv1(e.target.value as Environment)}
          >
            <MenuItem value="development">Development</MenuItem>
            <MenuItem value="staging">Staging</MenuItem>
            <MenuItem value="production">Production</MenuItem>
          </Select>
        </FormControl>

        <Typography>vs</Typography>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>環境2</InputLabel>
          <Select
            value={env2}
            label="環境2"
            onChange={(e) => setEnv2(e.target.value as Environment)}
          >
            <MenuItem value="development">Development</MenuItem>
            <MenuItem value="staging">Staging</MenuItem>
            <MenuItem value="production">Production</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={handleCompare}
          startIcon={<CompareIcon />}
          disabled={loading}
        >
          比較
        </Button>
      </Stack>

      {diff && (
        <>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              合計: {diff.summary.total}件 |{env1}のみ: {diff.summary.missingInEnv2}件 |{env2}のみ:{' '}
              {diff.summary.missingInEnv1}件 | 値が異なる: {diff.summary.differentValues}件 | 同じ:{' '}
              {diff.summary.same}件
            </Typography>
          </Alert>

          {diff.differences.differentValues.length > 0 && (
            <Paper sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ p: 2 }}>
                値が異なる設定
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>キー</TableCell>
                      <TableCell>{env1}の値</TableCell>
                      <TableCell>{env2}の値</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {diff.differences.differentValues.map((item: any) => (
                      <TableRow key={item.key}>
                        <TableCell>{item.key}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {JSON.stringify(item.env1Value)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {JSON.stringify(item.env2Value)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {diff.differences.missingInEnv1.length > 0 && (
            <Paper sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ p: 2 }}>
                {env2}のみに存在する設定
              </Typography>
              <Box sx={{ p: 2 }}>
                {diff.differences.missingInEnv1.map((item: any) => (
                  <Chip key={item.key} label={item.key} sx={{ m: 0.5 }} color="warning" />
                ))}
              </Box>
            </Paper>
          )}

          {diff.differences.missingInEnv2.length > 0 && (
            <Paper>
              <Typography variant="h6" sx={{ p: 2 }}>
                {env1}のみに存在する設定
              </Typography>
              <Box sx={{ p: 2 }}>
                {diff.differences.missingInEnv2.map((item: any) => (
                  <Chip key={item.key} label={item.key} sx={{ m: 0.5 }} color="error" />
                ))}
              </Box>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}
