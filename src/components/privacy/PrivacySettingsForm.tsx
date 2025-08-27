'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
  People as PeopleIcon,
  Article as ArticleIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSession } from 'next-auth/react';

interface PrivacySettings {
  account: {
    isPrivate: boolean;
    requireFollowApproval: boolean;
    allowDiscovery: boolean;
  };
  profile: {
    basicInfo: 'public' | 'followers' | 'private';
    bio: 'public' | 'followers' | 'private';
    location: 'public' | 'followers' | 'private';
    website: 'public' | 'followers' | 'private';
    birthDate: 'public' | 'followers' | 'private';
    joinDate: 'public' | 'followers' | 'private';
  };
  followers: {
    followersList: 'public' | 'followers' | 'private';
    followingList: 'public' | 'followers' | 'private';
    followersCount: 'public' | 'followers' | 'private';
    followingCount: 'public' | 'followers' | 'private';
  };
  posts: {
    defaultVisibility: 'public' | 'followers' | 'private' | 'custom';
    allowComments: 'public' | 'followers' | 'private';
    allowLikes: 'public' | 'followers' | 'private';
    allowSharing: 'public' | 'followers' | 'private';
    showInTimeline: boolean;
  };
  notifications: {
    follows: boolean;
    likes: boolean;
    comments: boolean;
    mentions: boolean;
    directMessages: boolean;
    email: boolean;
    push: boolean;
    onlyFromFollowers: boolean;
    onlyFromVerified: boolean;
  };
  discovery: {
    searchByEmail: boolean;
    searchByPhone: boolean;
    appearInSuggestions: boolean;
    allowTagging: 'public' | 'followers' | 'private';
  };
  activity: {
    showLastSeen: 'public' | 'followers' | 'private';
    showOnlineStatus: 'public' | 'followers' | 'private';
    showReadReceipts: boolean;
  };
}

const defaultSettings: PrivacySettings = {
  account: {
    isPrivate: false,
    requireFollowApproval: false,
    allowDiscovery: true,
  },
  profile: {
    basicInfo: 'public',
    bio: 'public',
    location: 'public',
    website: 'public',
    birthDate: 'followers',
    joinDate: 'public',
  },
  followers: {
    followersList: 'public',
    followingList: 'public',
    followersCount: 'public',
    followingCount: 'public',
  },
  posts: {
    defaultVisibility: 'public',
    allowComments: 'public',
    allowLikes: 'public',
    allowSharing: 'public',
    showInTimeline: true,
  },
  notifications: {
    follows: true,
    likes: true,
    comments: true,
    mentions: true,
    directMessages: true,
    email: true,
    push: true,
    onlyFromFollowers: false,
    onlyFromVerified: false,
  },
  discovery: {
    searchByEmail: false,
    searchByPhone: false,
    appearInSuggestions: true,
    allowTagging: 'followers',
  },
  activity: {
    showLastSeen: 'followers',
    showOnlineStatus: 'followers',
    showReadReceipts: true,
  },
};

export const PrivacySettingsForm: React.FC = () => {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<PrivacySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 設定読み込み
  useEffect(() => {
    if (session?.user?.id) {
      fetchSettings();
    }
  }, [session]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/privacy/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('設定の読み込みに失敗:', error);
      setMessage({ type: 'error', text: '設定の読み込みに失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  // 設定保存
  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/privacy/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'プライバシー設定を保存しました' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || '保存に失敗しました' });
      }
    } catch (error) {
      console.error('設定の保存に失敗:', error);
      setMessage({ type: 'error', text: '保存に失敗しました' });
    } finally {
      setSaving(false);
    }
  };

  // 設定リセット
  const handleReset = async () => {
    if (!confirm('プライバシー設定をデフォルトに戻しますか？')) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/privacy/settings', {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setMessage({ type: 'success', text: '設定をリセットしました' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'リセットに失敗しました' });
      }
    } catch (error) {
      console.error('設定のリセットに失敗:', error);
      setMessage({ type: 'error', text: 'リセットに失敗しました' });
    } finally {
      setSaving(false);
    }
  };

  // 可視性オプション選択コンポーネント
  const VisibilitySelector: React.FC<{
    value: string;
    onChange: (value: string) => void;
    label: string;
  }> = ({ value, onChange, label }) => (
    <FormControl component="fieldset" sx={{ width: '100%' }}>
      <FormLabel component="legend" sx={{ fontSize: '0.875rem', mb: 1 }}>
        {label}
      </FormLabel>
      <RadioGroup
        row
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{ gap: 2 }}
      >
        <FormControlLabel value="public" control={<Radio size="small" />} label="全体に公開" />
        <FormControlLabel value="followers" control={<Radio size="small" />} label="フォロワーのみ" />
        <FormControlLabel value="private" control={<Radio size="small" />} label="非公開" />
      </RadioGroup>
    </FormControl>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {message && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 2 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {/* アカウント設定 */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <SecurityIcon color="primary" />
            <Typography variant="h6">アカウント設定</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.account.isPrivate}
                  onChange={(e) => 
                    setSettings(prev => ({
                      ...prev,
                      account: { ...prev.account, isPrivate: e.target.checked }
                    }))
                  }
                />
              }
              label="非公開アカウント"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              非公開にすると、フォロワーのみがあなたの投稿やプロフィール詳細を見ることができます
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.account.requireFollowApproval}
                  onChange={(e) => 
                    setSettings(prev => ({
                      ...prev,
                      account: { ...prev.account, requireFollowApproval: e.target.checked }
                    }))
                  }
                />
              }
              label="フォロー承認制"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.account.allowDiscovery}
                  onChange={(e) => 
                    setSettings(prev => ({
                      ...prev,
                      account: { ...prev.account, allowDiscovery: e.target.checked }
                    }))
                  }
                />
              }
              label="検索・推奨での表示を許可"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* プロフィール公開設定 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <VisibilityIcon color="primary" />
            <Typography variant="h6">プロフィール公開設定</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" flexDirection="column" gap={3}>
            <VisibilitySelector
              value={settings.profile.basicInfo}
              onChange={(value) => 
                setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, basicInfo: value as any }
                }))
              }
              label="基本情報（名前・アバター）"
            />
            
            <VisibilitySelector
              value={settings.profile.bio}
              onChange={(value) => 
                setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, bio: value as any }
                }))
              }
              label="自己紹介"
            />

            <VisibilitySelector
              value={settings.profile.location}
              onChange={(value) => 
                setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, location: value as any }
                }))
              }
              label="位置情報"
            />

            <VisibilitySelector
              value={settings.profile.website}
              onChange={(value) => 
                setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, website: value as any }
                }))
              }
              label="ウェブサイト"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* 通知設定 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <NotificationsIcon color="primary" />
            <Typography variant="h6">通知設定</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.follows}
                  onChange={(e) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, follows: e.target.checked }
                    }))
                  }
                />
              }
              label="フォロー通知"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.likes}
                  onChange={(e) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, likes: e.target.checked }
                    }))
                  }
                />
              }
              label="いいね通知"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.comments}
                  onChange={(e) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, comments: e.target.checked }
                    }))
                  }
                />
              }
              label="コメント通知"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.mentions}
                  onChange={(e) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, mentions: e.target.checked }
                    }))
                  }
                />
              }
              label="メンション通知"
            />

            <Divider sx={{ my: 2 }} />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.onlyFromFollowers}
                  onChange={(e) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, onlyFromFollowers: e.target.checked }
                    }))
                  }
                />
              }
              label="フォロワーのみからの通知"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.onlyFromVerified}
                  onChange={(e) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, onlyFromVerified: e.target.checked }
                    }))
                  }
                />
              }
              label="認証済みユーザーのみからの通知"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* アクション */}
      <Box display="flex" gap={2} mt={3}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : <SecurityIcon />}
        >
          {saving ? '保存中...' : '設定を保存'}
        </Button>
        
        <Button
          variant="outlined"
          onClick={handleReset}
          disabled={saving}
          startIcon={<RefreshIcon />}
        >
          デフォルトに戻す
        </Button>
      </Box>
    </Box>
  );
};