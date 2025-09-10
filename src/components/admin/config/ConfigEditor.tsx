'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Button,
  Stack,
  Typography,
  Alert,
  Paper,
  Divider,
  Chip,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon, Add as AddIcon } from '@mui/icons-material';

type Environment = 'development' | 'staging' | 'production';

interface ConfigEditorProps {
  config?: any;
  environment: Environment;
  onSave: (config: any) => void;
  onCancel: () => void;
}

export default function ConfigEditor({ config, environment, onSave, onCancel }: ConfigEditorProps) {
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: '',
    category: 'general',
    dataType: 'string',
    isSecret: false,
    isHotReloadable: false,
    changeReason: '',
    allowedValues: [] as string[],
    dependencies: [] as string[],
  });

  const [newAllowedValue, setNewAllowedValue] = useState('');
  const [newDependency, setNewDependency] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (config) {
      setFormData({
        key: config.key || '',
        value: config.isSecret ? '' : JSON.stringify(config.value || ''),
        description: config.description || '',
        category: config.category || 'general',
        dataType: config.dataType || 'string',
        isSecret: config.isSecret || false,
        isHotReloadable: config.isHotReloadable || false,
        changeReason: '',
        allowedValues: config.allowedValues || [],
        dependencies: config.dependencies || [],
      });
    }
  }, [config]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // エラーをクリア
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.key) {
      newErrors.key = 'キーは必須です';
    }

    if (!formData.value && !formData.isSecret) {
      newErrors.value = '値は必須です';
    }

    if (!formData.description) {
      newErrors.description = '説明は必須です';
    }

    // データ型に応じたバリデーション
    if (formData.value && !formData.isSecret) {
      try {
        const parsedValue = JSON.parse(formData.value);

        switch (formData.dataType) {
          case 'number':
            if (typeof parsedValue !== 'number') {
              newErrors.value = '数値を入力してください';
            }
            break;
          case 'boolean':
            if (typeof parsedValue !== 'boolean') {
              newErrors.value = 'true または false を入力してください';
            }
            break;
          case 'json':
            if (typeof parsedValue !== 'object') {
              newErrors.value = '有効なJSONを入力してください';
            }
            break;
        }
      } catch {
        if (formData.dataType === 'json') {
          newErrors.value = '有効なJSONを入力してください';
        }
      }
    }

    if (!config && !formData.changeReason) {
      newErrors.changeReason = '変更理由を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    let value = formData.value;

    // データ型に応じて値を変換
    if (!formData.isSecret && formData.value) {
      try {
        value = JSON.parse(formData.value);
      } catch {
        if (formData.dataType !== 'string') {
          value = formData.value;
        }
      }
    }

    onSave({
      ...formData,
      value,
    });
  };

  const addAllowedValue = () => {
    if (newAllowedValue && !formData.allowedValues.includes(newAllowedValue)) {
      setFormData((prev) => ({
        ...prev,
        allowedValues: [...prev.allowedValues, newAllowedValue],
      }));
      setNewAllowedValue('');
    }
  };

  const removeAllowedValue = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedValues: prev.allowedValues.filter((v) => v !== value),
    }));
  };

  const addDependency = () => {
    if (newDependency && !formData.dependencies.includes(newDependency)) {
      setFormData((prev) => ({
        ...prev,
        dependencies: [...prev.dependencies, newDependency],
      }));
      setNewDependency('');
    }
  };

  const removeDependency = (dep: string) => {
    setFormData((prev) => ({
      ...prev,
      dependencies: prev.dependencies.filter((d) => d !== dep),
    }));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {config ? '設定の編集' : '新規設定の作成'}
      </Typography>

      <Stack spacing={3}>
        <TextField
          label="キー"
          value={formData.key}
          onChange={(e) => handleChange('key', e.target.value)}
          error={!!errors.key}
          helperText={errors.key}
          disabled={!!config}
          fullWidth
          required
        />

        <Stack direction="row" spacing={2}>
          <FormControl fullWidth>
            <InputLabel>カテゴリー</InputLabel>
            <Select
              value={formData.category}
              label="カテゴリー"
              onChange={(e) => handleChange('category', e.target.value)}
            >
              <MenuItem value="general">一般</MenuItem>
              <MenuItem value="security">セキュリティ</MenuItem>
              <MenuItem value="email">メール</MenuItem>
              <MenuItem value="features">機能</MenuItem>
              <MenuItem value="performance">パフォーマンス</MenuItem>
              <MenuItem value="api">API</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>データ型</InputLabel>
            <Select
              value={formData.dataType}
              label="データ型"
              onChange={(e) => handleChange('dataType', e.target.value)}
            >
              <MenuItem value="string">文字列</MenuItem>
              <MenuItem value="number">数値</MenuItem>
              <MenuItem value="boolean">真偽値</MenuItem>
              <MenuItem value="json">JSON</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <TextField
          label="値"
          value={formData.value}
          onChange={(e) => handleChange('value', e.target.value)}
          error={!!errors.value}
          helperText={errors.value || '※ JSON形式で入力してください（文字列は "文字列" のように）'}
          multiline
          rows={4}
          fullWidth
          required
          disabled={formData.isSecret && !!config}
        />

        <TextField
          label="説明"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          error={!!errors.description}
          helperText={errors.description}
          multiline
          rows={2}
          fullWidth
          required
        />

        <Stack direction="row" spacing={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isSecret}
                onChange={(e) => handleChange('isSecret', e.target.checked)}
              />
            }
            label="秘密情報（暗号化して保存）"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isHotReloadable}
                onChange={(e) => handleChange('isHotReloadable', e.target.checked)}
              />
            }
            label="ホットリロード対応"
          />
        </Stack>

        <Divider />

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            許可される値（オプション）
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <TextField
              size="small"
              value={newAllowedValue}
              onChange={(e) => setNewAllowedValue(e.target.value)}
              placeholder="許可する値を入力"
              onKeyPress={(e) => e.key === 'Enter' && addAllowedValue()}
            />
            <Button size="small" onClick={addAllowedValue} startIcon={<AddIcon />}>
              追加
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {formData.allowedValues.map((value) => (
              <Chip
                key={value}
                label={value}
                onDelete={() => removeAllowedValue(value)}
                size="small"
              />
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            依存関係（オプション）
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <TextField
              size="small"
              value={newDependency}
              onChange={(e) => setNewDependency(e.target.value)}
              placeholder="依存する設定キーを入力"
              onKeyPress={(e) => e.key === 'Enter' && addDependency()}
            />
            <Button size="small" onClick={addDependency} startIcon={<AddIcon />}>
              追加
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {formData.dependencies.map((dep) => (
              <Chip key={dep} label={dep} onDelete={() => removeDependency(dep)} size="small" />
            ))}
          </Stack>
        </Box>

        <TextField
          label="変更理由"
          value={formData.changeReason}
          onChange={(e) => handleChange('changeReason', e.target.value)}
          error={!!errors.changeReason}
          helperText={errors.changeReason}
          multiline
          rows={2}
          fullWidth
          required={!config}
        />

        <Alert severity="info">
          環境: <strong>{environment}</strong>
        </Alert>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={onCancel} startIcon={<CancelIcon />}>
            キャンセル
          </Button>
          <Button variant="contained" onClick={handleSubmit} startIcon={<SaveIcon />}>
            保存
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
