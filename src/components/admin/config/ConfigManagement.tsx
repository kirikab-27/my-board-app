'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Compare as CompareIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import ConfigList from './ConfigList';
import ConfigEditor from './ConfigEditor';
import ConfigDiff from './ConfigDiff';
import ConfigHistory from './ConfigHistory';
import ConfigImportExport from './ConfigImportExport';

type Environment = 'development' | 'staging' | 'production';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ConfigManagement() {
  const [currentTab, setCurrentTab] = useState(0);
  const [environment, setEnvironment] = useState<Environment>('development');
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState<any[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // 設定一覧を取得
  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/config?environment=${environment}`);
      if (!response.ok) throw new Error('Failed to fetch configurations');
      const data = await response.json();
      setConfigs(data);
    } catch (error) {
      console.error('Error fetching configs:', error);
      setSnackbar({
        open: true,
        message: '設定の取得に失敗しました',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [environment]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleEnvironmentChange = (newEnvironment: Environment) => {
    setEnvironment(newEnvironment);
  };

  const handleConfigSelect = (config: any) => {
    setSelectedConfig(config);
    setCurrentTab(1); // 編集タブに切り替え
  };

  const handleConfigSave = async (config: any) => {
    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          environment,
        }),
      });

      if (!response.ok) throw new Error('Failed to save configuration');

      await response.json();
      setSnackbar({
        open: true,
        message: `設定 ${config.key} を保存しました`,
        severity: 'success',
      });

      // リストを更新
      await fetchConfigs();
      setSelectedConfig(null);
      setCurrentTab(0);
    } catch (error) {
      console.error('Error saving config:', error);
      setSnackbar({
        open: true,
        message: '設定の保存に失敗しました',
        severity: 'error',
      });
    }
  };

  const handleConfigDelete = async (key: string) => {
    if (!confirm(`設定 ${key} を削除してもよろしいですか？`)) return;

    try {
      const response = await fetch(`/api/admin/config?key=${key}&environment=${environment}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete configuration');

      setSnackbar({
        open: true,
        message: `設定 ${key} を削除しました`,
        severity: 'success',
      });

      await fetchConfigs();
    } catch (error) {
      console.error('Error deleting config:', error);
      setSnackbar({
        open: true,
        message: '設定の削除に失敗しました',
        severity: 'error',
      });
    }
  };

  const handleImport = async (data: any) => {
    try {
      const response = await fetch('/api/admin/config/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          environment,
        }),
      });

      if (!response.ok) throw new Error('Failed to import configurations');

      const result = await response.json();
      setSnackbar({
        open: true,
        message: `${result.imported}件の設定をインポートしました`,
        severity: 'success',
      });

      await fetchConfigs();
    } catch (error) {
      console.error('Error importing configs:', error);
      setSnackbar({
        open: true,
        message: '設定のインポートに失敗しました',
        severity: 'error',
      });
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/admin/config/export?environment=${environment}`);
      if (!response.ok) throw new Error('Failed to export configurations');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `config-${environment}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSnackbar({
        open: true,
        message: '設定をエクスポートしました',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error exporting configs:', error);
      setSnackbar({
        open: true,
        message: '設定のエクスポートに失敗しました',
        severity: 'error',
      });
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchConfigs}
            disabled={loading}
          >
            更新
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>
            エクスポート
          </Button>
        </Stack>
      </Box>

      <Paper>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="config management tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="設定一覧" icon={<SettingsIcon />} iconPosition="start" />
          <Tab label="設定編集" icon={<SettingsIcon />} iconPosition="start" />
          <Tab label="環境比較" icon={<CompareIcon />} iconPosition="start" />
          <Tab label="変更履歴" icon={<HistoryIcon />} iconPosition="start" />
          <Tab label="インポート/エクスポート" icon={<UploadIcon />} iconPosition="start" />
        </Tabs>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && (
          <>
            <TabPanel value={currentTab} index={0}>
              <ConfigList
                configs={configs}
                environment={environment}
                onEnvironmentChange={handleEnvironmentChange}
                onConfigSelect={handleConfigSelect}
                onConfigDelete={handleConfigDelete}
                onRefresh={fetchConfigs}
              />
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
              <ConfigEditor
                config={selectedConfig}
                environment={environment}
                onSave={handleConfigSave}
                onCancel={() => {
                  setSelectedConfig(null);
                  setCurrentTab(0);
                }}
              />
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
              <ConfigDiff />
            </TabPanel>

            <TabPanel value={currentTab} index={3}>
              <ConfigHistory environment={environment} />
            </TabPanel>

            <TabPanel value={currentTab} index={4}>
              <ConfigImportExport
                environment={environment}
                onImport={handleImport}
                onExport={handleExport}
              />
            </TabPanel>
          </>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
