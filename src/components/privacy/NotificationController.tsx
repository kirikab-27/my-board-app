'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  TextField,
  Button,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Select,
  MenuItem,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Quiz as TestIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  FilterList as FilterIcon,
  Security as SecurityIcon,
  VolumeOff as VolumeOffIcon,
  NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';

interface NotificationSettings {
  _id?: string;
  senderRestriction: 'all' | 'followers' | 'verified' | 'mutual';
  contentFilter: {
    enabled: boolean;
    keywords: string[];
    isRegex: boolean;
    caseSensitive: boolean;
  };
  timeControl: {
    enabled: boolean;
    allowedTimeSlots: Array<{ start: string; end: string }>;
    timezone: string;
    silentMode: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  prioritySettings: Record<string, 'low' | 'normal' | 'high'>;
  notificationTypes: {
    like: boolean;
    comment: boolean;
    follow: boolean;
    mention: boolean;
    reply: boolean;
    directMessage: boolean;
    system: boolean;
    security: boolean;
  };
  globalSettings: {
    enabled: boolean;
    pushNotifications: boolean;
    emailNotifications: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
  };
  stats: {
    totalFiltered: number;
    lastUpdated: string;
  };
}

interface TimeSlot {
  start: string;
  end: string;
}

export const NotificationController: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // 通知設定取得
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/privacy/notification-settings');
      const data = await response.json();
      
      if (response.ok) {
        setSettings(data.settings);
      } else {
        setError(data.error || '設定の取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 通知設定保存
  const saveSettings = async (updatedSettings: Partial<NotificationSettings>) => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch('/api/privacy/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSettings(data.settings);
        setSuccess('設定を保存しました');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || '設定の保存に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  // 設定リセット
  const resetSettings = async () => {
    if (!confirm('通知設定をデフォルト値にリセットしますか？')) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/privacy/notification-settings', {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSettings(data.settings);
        setSuccess('設定をリセットしました');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || '設定のリセットに失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>通知設定を読み込んでいます...</Typography>
      </Box>
    );
  }

  if (!settings) {
    return (
      <Alert severity="error">
        通知設定を読み込めませんでした。ページを再読み込みしてください。
      </Alert>
    );
  }

  const handleUpdateSettings = (updates: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...updates };
    setSettings(updatedSettings);
    saveSettings(updates);
  };

  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    
    const updatedKeywords = [...settings.contentFilter.keywords, newKeyword.trim()];
    const updates = {
      contentFilter: {
        ...settings.contentFilter,
        keywords: updatedKeywords,
      },
    };
    
    handleUpdateSettings(updates);
    setNewKeyword('');
  };

  const removeKeyword = (index: number) => {
    const updatedKeywords = settings.contentFilter.keywords.filter((_, i) => i !== index);
    const updates = {
      contentFilter: {
        ...settings.contentFilter,
        keywords: updatedKeywords,
      },
    };
    
    handleUpdateSettings(updates);
  };

  const addTimeSlot = () => {
    const newSlot: TimeSlot = { start: '09:00', end: '18:00' };
    const updatedSlots = [...settings.timeControl.allowedTimeSlots, newSlot];
    const updates = {
      timeControl: {
        ...settings.timeControl,
        allowedTimeSlots: updatedSlots,
      },
    };
    
    handleUpdateSettings(updates);
  };

  const removeTimeSlot = (index: number) => {
    const updatedSlots = settings.timeControl.allowedTimeSlots.filter((_, i) => i !== index);
    const updates = {
      timeControl: {
        ...settings.timeControl,
        allowedTimeSlots: updatedSlots,
      },
    };
    
    handleUpdateSettings(updates);
  };

  const updateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
    const updatedSlots = [...settings.timeControl.allowedTimeSlots];
    updatedSlots[index] = { ...updatedSlots[index], [field]: value };
    const updates = {
      timeControl: {
        ...settings.timeControl,
        allowedTimeSlots: updatedSlots,
      },
    };
    
    handleUpdateSettings(updates);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        {/* エラー・成功メッセージ */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* グローバル設定 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <NotificationsIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">グローバル設定</Typography>
            </Box>
            
            <Box display="flex" flexDirection="column" gap={2}>
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.globalSettings.enabled}
                      onChange={(e) =>
                        handleUpdateSettings({
                          globalSettings: {
                            ...settings.globalSettings,
                            enabled: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="通知を受信する"
                />
              </Box>
              
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.globalSettings.pushNotifications}
                      disabled={!settings.globalSettings.enabled}
                      onChange={(e) =>
                        handleUpdateSettings({
                          globalSettings: {
                            ...settings.globalSettings,
                            pushNotifications: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="プッシュ通知"
                />
              </Box>
              
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.globalSettings.emailNotifications}
                      disabled={!settings.globalSettings.enabled}
                      onChange={(e) =>
                        handleUpdateSettings({
                          globalSettings: {
                            ...settings.globalSettings,
                            emailNotifications: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="メール通知"
                />
              </Box>
              
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.globalSettings.soundEnabled}
                      disabled={!settings.globalSettings.enabled}
                      onChange={(e) =>
                        handleUpdateSettings({
                          globalSettings: {
                            ...settings.globalSettings,
                            soundEnabled: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="通知音"
                />
              </Box>
            </Box>

            {/* 統計情報 */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                📊 フィルタリング済み通知: {settings.stats.totalFiltered}件 |
                最終更新: {new Date(settings.stats.lastUpdated).toLocaleString('ja-JP')}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* 通知タイプ設定 */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">通知タイプ設定</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexWrap="wrap" gap={2}>
              {Object.entries(settings.notificationTypes).map(([type, enabled]) => (
                <Box flex="1 1 300px" key={type}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={enabled}
                        disabled={!settings.globalSettings.enabled}
                        onChange={(e) =>
                          handleUpdateSettings({
                            notificationTypes: {
                              ...settings.notificationTypes,
                              [type]: e.target.checked,
                            },
                          })
                        }
                      />
                    }
                    label={getNotificationTypeLabel(type)}
                  />
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* 送信者制限設定 */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">送信者制限</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl component="fieldset">
              <FormLabel component="legend">通知を受信する相手</FormLabel>
              <RadioGroup
                value={settings.senderRestriction}
                onChange={(e) =>
                  handleUpdateSettings({
                    senderRestriction: e.target.value as any,
                  })
                }
              >
                <FormControlLabel
                  value="all"
                  control={<Radio />}
                  label="すべてのユーザー"
                />
                <FormControlLabel
                  value="followers"
                  control={<Radio />}
                  label="フォロワーのみ"
                />
                <FormControlLabel
                  value="verified"
                  control={<Radio />}
                  label="認証済みユーザーのみ"
                />
                <FormControlLabel
                  value="mutual"
                  control={<Radio />}
                  label="相互フォローのみ"
                />
              </RadioGroup>
            </FormControl>
          </AccordionDetails>
        </Accordion>

        {/* 内容フィルタ設定 */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <FilterIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                内容フィルタ
                {settings.contentFilter.enabled && (
                  <Chip size="small" label="有効" color="primary" sx={{ ml: 1 }} />
                )}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.contentFilter.enabled}
                  onChange={(e) =>
                    handleUpdateSettings({
                      contentFilter: {
                        ...settings.contentFilter,
                        enabled: e.target.checked,
                      },
                    })
                  }
                />
              }
              label="内容フィルタを有効にする"
              sx={{ mb: 2 }}
            />

            {settings.contentFilter.enabled && (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    フィルタキーワード ({settings.contentFilter.keywords.length}/50)
                  </Typography>
                  
                  <Box display="flex" gap={1} mb={1}>
                    <TextField
                      size="small"
                      placeholder="キーワードを入力"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={addKeyword}
                      disabled={!newKeyword.trim()}
                    >
                      追加
                    </Button>
                  </Box>
                  
                  <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                    {settings.contentFilter.keywords.map((keyword, index) => (
                      <Chip
                        key={index}
                        label={keyword}
                        onDelete={() => removeKeyword(index)}
                        deleteIcon={<DeleteIcon />}
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>

                <Box display="flex" flexDirection="column" gap={2}>
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.contentFilter.isRegex}
                          onChange={(e) =>
                            handleUpdateSettings({
                              contentFilter: {
                                ...settings.contentFilter,
                                isRegex: e.target.checked,
                              },
                            })
                          }
                        />
                      }
                      label="正規表現を使用"
                    />
                  </Box>
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.contentFilter.caseSensitive}
                          onChange={(e) =>
                            handleUpdateSettings({
                              contentFilter: {
                                ...settings.contentFilter,
                                caseSensitive: e.target.checked,
                              },
                            })
                          }
                        />
                      }
                      label="大文字小文字を区別"
                    />
                  </Box>
                </Box>
              </>
            )}
          </AccordionDetails>
        </Accordion>

        {/* 時間帯制御設定 */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                時間帯制御
                {settings.timeControl.enabled && (
                  <Chip size="small" label="有効" color="primary" sx={{ ml: 1 }} />
                )}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.timeControl.enabled}
                  onChange={(e) =>
                    handleUpdateSettings({
                      timeControl: {
                        ...settings.timeControl,
                        enabled: e.target.checked,
                      },
                    })
                  }
                />
              }
              label="時間帯制御を有効にする"
              sx={{ mb: 2 }}
            />

            {settings.timeControl.enabled && (
              <>
                {/* サイレントモード */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <VolumeOffIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    サイレントモード
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.timeControl.silentMode.enabled}
                        onChange={(e) =>
                          handleUpdateSettings({
                            timeControl: {
                              ...settings.timeControl,
                              silentMode: {
                                ...settings.timeControl.silentMode,
                                enabled: e.target.checked,
                              },
                            },
                          })
                        }
                      />
                    }
                    label="サイレントモードを有効にする"
                    sx={{ mb: 1 }}
                  />

                  {settings.timeControl.silentMode.enabled && (
                    <Box display="flex" gap={2}>
                      <Box flex="1">
                        <TextField
                          label="開始時刻"
                          type="time"
                          size="small"
                          fullWidth
                          value={settings.timeControl.silentMode.start}
                          onChange={(e) =>
                            handleUpdateSettings({
                              timeControl: {
                                ...settings.timeControl,
                                silentMode: {
                                  ...settings.timeControl.silentMode,
                                  start: e.target.value,
                                },
                              },
                            })
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      </Box>
                      <Box flex="1">
                        <TextField
                          label="終了時刻"
                          type="time"
                          size="small"
                          fullWidth
                          value={settings.timeControl.silentMode.end}
                          onChange={(e) =>
                            handleUpdateSettings({
                              timeControl: {
                                ...settings.timeControl,
                                silentMode: {
                                  ...settings.timeControl.silentMode,
                                  end: e.target.value,
                                },
                              },
                            })
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* 許可時間帯 */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    <NotificationsActiveIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    許可時間帯 ({settings.timeControl.allowedTimeSlots.length})
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={addTimeSlot}
                    sx={{ mb: 2 }}
                    size="small"
                  >
                    時間帯を追加
                  </Button>

                  {settings.timeControl.allowedTimeSlots.map((slot, index) => (
                    <Box key={index} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Box display="flex" gap={2} alignItems="center">
                        <Box flex="1">
                          <TextField
                            label="開始"
                            type="time"
                            size="small"
                            fullWidth
                            value={slot.start}
                            onChange={(e) => updateTimeSlot(index, 'start', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Box>
                        <Box flex="1">
                          <TextField
                            label="終了"
                            type="time"
                            size="small"
                            fullWidth
                            value={slot.end}
                            onChange={(e) => updateTimeSlot(index, 'end', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Box>
                        <Box>
                          <IconButton
                            color="error"
                            onClick={() => removeTimeSlot(index)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </AccordionDetails>
        </Accordion>

        {/* アクションボタン */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<TestIcon />}
            onClick={() => setTestDialogOpen(true)}
            disabled={saving}
          >
            フィルタテスト
          </Button>
          
          <Button
            variant="outlined"
            color="warning"
            onClick={resetSettings}
            disabled={saving}
          >
            リセット
          </Button>
          
          <Button
            variant="contained"
            disabled={saving}
            onClick={() => saveSettings(settings)}
          >
            {saving ? <CircularProgress size={20} /> : '保存'}
          </Button>
        </Box>

        {/* テストダイアログ */}
        <NotificationFilterTestDialog
          open={testDialogOpen}
          onClose={() => setTestDialogOpen(false)}
          onTest={(result) => setTestResult(result)}
        />
      </Box>
    </LocalizationProvider>
  );
};

// 通知タイプのラベル取得
function getNotificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    like: 'いいね',
    comment: 'コメント',
    follow: 'フォロー',
    mention: 'メンション',
    reply: '返信',
    directMessage: 'ダイレクトメッセージ',
    system: 'システム',
    security: 'セキュリティ',
  };
  return labels[type] || type;
}

// フィルタテストダイアログ
interface NotificationFilterTestDialogProps {
  open: boolean;
  onClose: () => void;
  onTest: (result: any) => void;
}

const NotificationFilterTestDialog: React.FC<NotificationFilterTestDialogProps> = ({
  open,
  onClose,
  onTest,
}) => {
  const [testData, setTestData] = useState({
    senderId: '',
    content: '',
    notificationType: 'comment',
    priority: 'normal',
  });
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runTest = async () => {
    try {
      setTesting(true);
      setResult(null);
      
      const response = await fetch('/api/privacy/notification-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });
      
      const data = await response.json();
      setResult(data);
      onTest(data);
    } catch (err) {
      setResult({ error: 'テストに失敗しました' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>通知フィルタテスト</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="送信者ID"
            value={testData.senderId}
            onChange={(e) => setTestData({ ...testData, senderId: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="テスト用の送信者IDを入力"
          />
          
          <TextField
            fullWidth
            label="通知内容"
            value={testData.content}
            onChange={(e) => setTestData({ ...testData, content: e.target.value })}
            multiline
            rows={3}
            sx={{ mb: 2 }}
            placeholder="フィルタテスト用の内容を入力"
          />
          
          <Box display="flex" gap={2} sx={{ mb: 2 }}>
            <Box flex={1}>
              <FormControl fullWidth size="small">
                <InputLabel>通知タイプ</InputLabel>
                <Select
                  value={testData.notificationType}
                  onChange={(e) => setTestData({ ...testData, notificationType: e.target.value })}
                  label="通知タイプ"
                >
                  <MenuItem value="like">いいね</MenuItem>
                  <MenuItem value="comment">コメント</MenuItem>
                  <MenuItem value="follow">フォロー</MenuItem>
                  <MenuItem value="mention">メンション</MenuItem>
                  <MenuItem value="reply">返信</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box flex={1}>
              <FormControl fullWidth size="small">
                <InputLabel>優先度</InputLabel>
                <Select
                  value={testData.priority}
                  onChange={(e) => setTestData({ ...testData, priority: e.target.value })}
                  label="優先度"
                >
                  <MenuItem value="low">低</MenuItem>
                  <MenuItem value="normal">通常</MenuItem>
                  <MenuItem value="high">高</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          
          {result && (
            <Alert 
              severity={result.shouldFilter ? 'warning' : 'success'}
              sx={{ mt: 2 }}
            >
              <Typography variant="body2">
                <strong>結果:</strong> {result.result === 'filtered' ? 'フィルタされます' : '通知されます'}
              </Typography>
              {result.currentSettings && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  現在の設定: 送信者制限={result.currentSettings.senderRestriction}, 
                  内容フィルタ={result.currentSettings.contentFilterEnabled ? '有効' : '無効'},
                  時間制御={result.currentSettings.timeControlEnabled ? '有効' : '無効'}
                </Typography>
              )}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
        <Button 
          variant="contained" 
          onClick={runTest}
          disabled={testing || !testData.senderId}
        >
          {testing ? <CircularProgress size={20} /> : 'テスト実行'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};