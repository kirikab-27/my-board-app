'use client';

import { useState } from 'react';
import { Box, Button, Paper, Typography, Stack, Alert, TextField } from '@mui/material';
import { Upload as UploadIcon, Download as DownloadIcon } from '@mui/icons-material';

type Environment = 'development' | 'staging' | 'production';

interface ConfigImportExportProps {
  environment: Environment;
  onImport: (data: any) => void;
  onExport: () => void;
}

export default function ConfigImportExport({
  environment,
  onImport,
  onExport,
}: ConfigImportExportProps) {
  const [importData, setImportData] = useState('');
  const [error, setError] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
      setError('');
    };
    reader.onerror = () => {
      setError('ファイルの読み込みに失敗しました');
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!importData) {
      setError('インポートするデータを入力してください');
      return;
    }

    try {
      const data = JSON.parse(importData);
      onImport(data);
      setImportData('');
      setError('');
    } catch {
      setError('有効なJSONデータを入力してください');
    }
  };

  return (
    <Box>
      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            設定のエクスポート
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            現在の環境 ({environment}) の設定をJSONファイルとしてエクスポートします。
            秘密情報は含まれません。
          </Typography>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={onExport}>
            エクスポート
          </Button>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            設定のインポート
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            JSONファイルから設定をインポートします。 既存の設定は上書きされます。
          </Typography>

          <Stack spacing={2}>
            <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
              ファイルを選択
              <input type="file" accept=".json" hidden onChange={handleFileSelect} />
            </Button>

            <TextField
              label="またはJSONデータを直接入力"
              multiline
              rows={10}
              value={importData}
              onChange={(e) => {
                setImportData(e.target.value);
                setError('');
              }}
              error={!!error}
              helperText={error}
              fullWidth
            />

            {importData && (
              <Alert severity="warning">
                環境 <strong>{environment}</strong> に設定をインポートします。
                既存の設定は上書きされます。
              </Alert>
            )}

            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={handleImport}
              disabled={!importData}
            >
              インポート
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
