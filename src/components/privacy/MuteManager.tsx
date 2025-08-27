'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Switch,
  Chip,
  Tabs,
  Tab,
  Pagination,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  VolumeOff as MuteIcon,
  Person as PersonIcon,
  Keyboard as KeyboardIcon,
  Tag as TagIcon,
  Language as DomainIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useSession } from 'next-auth/react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';

interface MuteItem {
  _id: string;
  type: 'user' | 'keyword' | 'hashtag' | 'domain';
  targetUserId?: {
    id: string;
    username: string;
    name: string;
    avatar?: string;
  };
  keyword?: string;
  hashtag?: string;
  domain?: string;
  duration: 'permanent' | 'temporary';
  expiresAt?: string;
  isRegex: boolean;
  caseSensitive: boolean;
  scope: {
    posts: boolean;
    comments: boolean;
    notifications: boolean;
    timeline: boolean;
    search: boolean;
  };
  reason?: string;
  isActive: boolean;
  createdAt: string;
}

interface MuteStats {
  total: number;
  user: number;
  keyword: number;
  hashtag: number;
  domain: number;
  permanent: number;
  temporary: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const MuteManager: React.FC = () => {
  const { data: session } = useSession();
  const [mutes, setMutes] = useState<MuteItem[]>([]);
  const [stats, setStats] = useState<MuteStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // タブ状態
  const [currentTab, setCurrentTab] = useState(0);
  const muteTypes = ['all', 'user', 'keyword', 'hashtag', 'domain'];
  
  // ミュート追加ダイアログ
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMuteType, setNewMuteType] = useState<'user' | 'keyword' | 'hashtag' | 'domain'>('user');
  const [targetUsername, setTargetUsername] = useState('');
  const [keyword, setKeyword] = useState('');
  const [hashtag, setHashtag] = useState('');
  const [domain, setDomain] = useState('');
  const [duration, setDuration] = useState<'permanent' | 'temporary'>('permanent');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isRegex, setIsRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [scope, setScope] = useState({
    posts: true,
    comments: true,
    notifications: true,
    timeline: true,
    search: false,
  });
  const [reason, setReason] = useState('');
  const [adding, setAdding] = useState(false);

  // ユーザー検索
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // ミュート編集ダイアログ
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMute, setEditingMute] = useState<MuteItem | null>(null);
  const [editScope, setEditScope] = useState({
    posts: true,
    comments: true,
    notifications: true,
    timeline: true,
    search: false,
  });
  const [editReason, setEditReason] = useState('');
  const [updating, setUpdating] = useState(false);

  // ミュートリスト読み込み
  useEffect(() => {
    if (session?.user?.id) {
      fetchMutes(1);
    }
  }, [session, currentTab]);

  const fetchMutes = async (page = 1) => {
    try {
      setLoading(true);
      const type = muteTypes[currentTab] !== 'all' ? muteTypes[currentTab] : undefined;
      const typeParam = type ? `&type=${type}` : '';
      const response = await fetch(`/api/privacy/mute?page=${page}&limit=10${typeParam}`);
      
      if (response.ok) {
        const data = await response.json();
        setMutes(data.mutes || []);
        setPagination(data.pagination);
        setStats(data.stats);
      } else {
        setMessage({ type: 'error', text: 'ミュートリストの読み込みに失敗しました' });
      }
    } catch (error) {
      console.error('ミュートリスト読み込みエラー:', error);
      setMessage({ type: 'error', text: 'ミュートリストの読み込みに失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  // ユーザー検索
  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await fetch(`/api/users?search=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('ユーザー検索エラー:', error);
    } finally {
      setSearching(false);
    }
  };

  // ミュート追加
  const handleAddMute = async () => {
    try {
      setAdding(true);
      
      const muteData: any = {
        type: newMuteType,
        duration,
        isRegex: newMuteType === 'keyword' ? isRegex : false,
        caseSensitive: newMuteType === 'keyword' ? caseSensitive : false,
        scope,
        reason: reason.trim(),
      };

      switch (newMuteType) {
        case 'user':
          if (!selectedUser) {
            setMessage({ type: 'error', text: 'ユーザーを選択してください' });
            return;
          }
          muteData.targetUserId = selectedUser._id;
          break;
        case 'keyword':
          if (!keyword.trim()) {
            setMessage({ type: 'error', text: 'キーワードを入力してください' });
            return;
          }
          muteData.keyword = keyword.trim();
          break;
        case 'hashtag':
          if (!hashtag.trim()) {
            setMessage({ type: 'error', text: 'ハッシュタグを入力してください' });
            return;
          }
          muteData.hashtag = hashtag.trim().replace(/^#/, '');
          break;
        case 'domain':
          if (!domain.trim()) {
            setMessage({ type: 'error', text: 'ドメインを入力してください' });
            return;
          }
          muteData.domain = domain.trim();
          break;
      }

      if (duration === 'temporary') {
        if (!expiresAt) {
          setMessage({ type: 'error', text: '期限を設定してください' });
          return;
        }
        muteData.expiresAt = expiresAt.toISOString();
      }

      const response = await fetch('/api/privacy/mute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(muteData),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'ミュートを設定しました' });
        setAddDialogOpen(false);
        resetAddForm();
        fetchMutes(1);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'ミュート設定に失敗しました' });
      }
    } catch (error) {
      console.error('ミュート追加エラー:', error);
      setMessage({ type: 'error', text: 'ミュート設定に失敗しました' });
    } finally {
      setAdding(false);
    }
  };

  // ミュート削除
  const handleDeleteMute = async (muteItem: MuteItem) => {
    const muteTarget = getMuteDisplayName(muteItem);
    if (!confirm(`${muteTarget}のミュートを解除しますか？`)) {
      return;
    }

    try {
      setDeleting(muteItem._id);
      const response = await fetch(`/api/privacy/mute?muteId=${muteItem._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'ミュートを解除しました' });
        fetchMutes(pagination?.currentPage || 1);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'ミュート解除に失敗しました' });
      }
    } catch (error) {
      console.error('ミュート削除エラー:', error);
      setMessage({ type: 'error', text: 'ミュート解除に失敗しました' });
    } finally {
      setDeleting(null);
    }
  };

  // ミュート編集
  const handleEditMute = async () => {
    if (!editingMute) return;

    try {
      setUpdating(true);
      const response = await fetch('/api/privacy/mute', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          muteId: editingMute._id,
          scope: editScope,
          reason: editReason.trim(),
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'ミュート設定を更新しました' });
        setEditDialogOpen(false);
        fetchMutes(pagination?.currentPage || 1);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || '更新に失敗しました' });
      }
    } catch (error) {
      console.error('ミュート更新エラー:', error);
      setMessage({ type: 'error', text: '更新に失敗しました' });
    } finally {
      setUpdating(false);
    }
  };

  // フォームリセット
  const resetAddForm = () => {
    setTargetUsername('');
    setKeyword('');
    setHashtag('');
    setDomain('');
    setDuration('permanent');
    setExpiresAt(null);
    setIsRegex(false);
    setCaseSensitive(false);
    setScope({
      posts: true,
      comments: true,
      notifications: true,
      timeline: true,
      search: false,
    });
    setReason('');
    setSearchResults([]);
    setSelectedUser(null);
  };

  // ミュート表示名取得
  const getMuteDisplayName = (mute: MuteItem): string => {
    switch (mute.type) {
      case 'user':
        return mute.targetUserId?.name || 'ユーザー';
      case 'keyword':
        return mute.keyword || 'キーワード';
      case 'hashtag':
        return `#${mute.hashtag}`;
      case 'domain':
        return mute.domain || 'ドメイン';
      default:
        return '不明';
    }
  };

  // ミュートアイコン取得
  const getMuteIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <PersonIcon />;
      case 'keyword':
        return <KeyboardIcon />;
      case 'hashtag':
        return <TagIcon />;
      case 'domain':
        return <DomainIcon />;
      default:
        return <MuteIcon />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
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

        {/* 統計情報 */}
        {stats && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              ミュート統計
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2} justifyContent="space-around">
              <Box textAlign="center" minWidth="120px">
                <Typography variant="h4" color="primary">{stats.total}</Typography>
                <Typography variant="caption">総数</Typography>
              </Box>
              <Box textAlign="center" minWidth="120px">
                <Typography variant="h4" color="secondary">{stats.user}</Typography>
                <Typography variant="caption">ユーザー</Typography>
              </Box>
              <Box textAlign="center" minWidth="120px">
                <Typography variant="h4" color="info.main">{stats.keyword}</Typography>
                <Typography variant="caption">キーワード</Typography>
              </Box>
              <Box textAlign="center" minWidth="120px">
                <Typography variant="h4" color="warning.main">{stats.hashtag}</Typography>
                <Typography variant="caption">ハッシュタグ</Typography>
              </Box>
            </Box>
          </Paper>
        )}

        {/* ヘッダー */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" display="flex" alignItems="center" gap={1}>
            <MuteIcon color="primary" />
            ミュート管理
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            ミュート追加
          </Button>
        </Box>

        {/* タブ */}
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          sx={{ mb: 2 }}
        >
          <Tab label="すべて" />
          <Tab label="ユーザー" />
          <Tab label="キーワード" />
          <Tab label="ハッシュタグ" />
          <Tab label="ドメイン" />
        </Tabs>

        {/* ミュートリスト */}
        {mutes.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                {muteTypes[currentTab] === 'all' ? 'ミュートはありません' : `${muteTypes[currentTab]}ミュートはありません`}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <List>
              {mutes.map((mute, index) => (
                <React.Fragment key={mute._id}>
                  <ListItem>
                    <Box display="flex" alignItems="center" mr={2}>
                      {getMuteIcon(mute.type)}
                    </Box>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography variant="subtitle2">
                            {getMuteDisplayName(mute)}
                          </Typography>
                          <Chip 
                            label={mute.type}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                          {mute.duration === 'temporary' && (
                            <Chip
                              icon={<ScheduleIcon />}
                              label={`${new Date(mute.expiresAt!).toLocaleDateString('ja-JP')}`}
                              size="small"
                              variant="outlined"
                              color="warning"
                            />
                          )}
                          {mute.type === 'keyword' && mute.isRegex && (
                            <Chip
                              label="正規表現"
                              size="small"
                              variant="outlined"
                              color="info"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          {mute.reason && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              {mute.reason}
                            </Typography>
                          )}
                          <Box display="flex" flexWrap="wrap" gap={0.5}>
                            {Object.entries(mute.scope)
                              .filter(([key, value]) => value)
                              .map(([key]) => (
                                <Chip
                                  key={key}
                                  label={key === 'posts' ? '投稿' : 
                                        key === 'comments' ? 'コメント' :
                                        key === 'notifications' ? '通知' :
                                        key === 'timeline' ? 'タイムライン' :
                                        key === 'search' ? '検索' : key}
                                  size="small"
                                  variant="filled"
                                  sx={{ fontSize: '0.7rem', height: '20px' }}
                                />
                              ))
                            }
                          </Box>
                          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                            {new Date(mute.createdAt).toLocaleDateString('ja-JP')}にミュート
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box display="flex" gap={1}>
                        <Tooltip title="設定編集">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingMute(mute);
                              setEditScope(mute.scope);
                              setEditReason(mute.reason || '');
                              setEditDialogOpen(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleDeleteMute(mute)}
                          disabled={deleting === mute._id}
                          startIcon={deleting === mute._id ? <CircularProgress size={16} /> : <DeleteIcon />}
                        >
                          {deleting === mute._id ? '解除中...' : 'ミュート解除'}
                        </Button>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < mutes.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Card>
        )}

        {/* ページネーション */}
        {pagination && pagination.totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={2}>
            <Pagination
              count={pagination.totalPages}
              page={pagination.currentPage}
              onChange={(e, page) => fetchMutes(page)}
              color="primary"
            />
          </Box>
        )}

        {/* ミュート追加ダイアログ */}
        <Dialog 
          open={addDialogOpen} 
          onClose={() => setAddDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>ミュート追加</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              ミュートしたいコンテンツの種類を選択し、詳細を設定してください。
            </DialogContentText>

            {/* ミュートタイプ選択 */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>ミュートタイプ</InputLabel>
              <Select
                value={newMuteType}
                onChange={(e) => {
                  setNewMuteType(e.target.value as any);
                  resetAddForm();
                }}
              >
                <MenuItem value="user">ユーザー</MenuItem>
                <MenuItem value="keyword">キーワード</MenuItem>
                <MenuItem value="hashtag">ハッシュタグ</MenuItem>
                <MenuItem value="domain">ドメイン</MenuItem>
              </Select>
            </FormControl>

            {/* タイプ別入力フィールド */}
            {newMuteType === 'user' && (
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="ユーザーを検索"
                  value={targetUsername}
                  onChange={(e) => {
                    setTargetUsername(e.target.value);
                    if (e.target.value.length >= 2) {
                      searchUsers(e.target.value);
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  InputProps={{
                    endAdornment: searching && <CircularProgress size={20} />,
                  }}
                  placeholder="名前またはユーザー名を入力"
                />
                
                {searchResults.length > 0 && (
                  <List sx={{ maxHeight: 200, overflow: 'auto', mt: 1 }}>
                    {searchResults.map((user) => (
                      <ListItem
                        key={user._id}
                        component="div"
                        sx={{ cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedUser(user);
                          setTargetUsername(`${user.name} (@${user.username})`);
                          setSearchResults([]);
                        }}
                      >
                        <ListItemText
                          primary={user.name}
                          secondary={`@${user.username}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}

            {newMuteType === 'keyword' && (
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="キーワード"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="ミュートしたいキーワードを入力"
                  sx={{ mb: 2 }}
                />
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isRegex}
                        onChange={(e) => setIsRegex(e.target.checked)}
                      />
                    }
                    label="正規表現として扱う"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={caseSensitive}
                        onChange={(e) => setCaseSensitive(e.target.checked)}
                      />
                    }
                    label="大文字小文字を区別"
                  />
                </FormGroup>
              </Box>
            )}

            {newMuteType === 'hashtag' && (
              <TextField
                fullWidth
                label="ハッシュタグ"
                value={hashtag}
                onChange={(e) => setHashtag(e.target.value)}
                placeholder="ミュートしたいハッシュタグを入力"
                sx={{ mb: 2 }}
              />
            )}

            {newMuteType === 'domain' && (
              <TextField
                fullWidth
                label="ドメイン"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                sx={{ mb: 2 }}
              />
            )}

            {/* ミュート期間 */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>ミュート期間</InputLabel>
              <Select
                value={duration}
                onChange={(e) => setDuration(e.target.value as any)}
              >
                <MenuItem value="permanent">永続</MenuItem>
                <MenuItem value="temporary">期間限定</MenuItem>
              </Select>
            </FormControl>

            {duration === 'temporary' && (
              <DateTimePicker
                label="ミュート解除日時"
                value={expiresAt}
                onChange={setExpiresAt}
                minDateTime={new Date()}
                sx={{ mb: 2, width: '100%' }}
              />
            )}

            {/* 適用範囲 */}
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              適用範囲
            </Typography>
            <FormGroup sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={scope.posts}
                    onChange={(e) => setScope(prev => ({ ...prev, posts: e.target.checked }))}
                  />
                }
                label="投稿"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={scope.comments}
                    onChange={(e) => setScope(prev => ({ ...prev, comments: e.target.checked }))}
                  />
                }
                label="コメント"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={scope.notifications}
                    onChange={(e) => setScope(prev => ({ ...prev, notifications: e.target.checked }))}
                  />
                }
                label="通知"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={scope.timeline}
                    onChange={(e) => setScope(prev => ({ ...prev, timeline: e.target.checked }))}
                  />
                }
                label="タイムライン"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={scope.search}
                    onChange={(e) => setScope(prev => ({ ...prev, search: e.target.checked }))}
                  />
                }
                label="検索結果"
              />
            </FormGroup>

            {/* ミュート理由 */}
            <TextField
              fullWidth
              label="ミュート理由（任意）"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              multiline
              rows={2}
              placeholder="スパム、不適切なコンテンツなど"
              inputProps={{ maxLength: 500 }}
              helperText={`${reason.length}/500文字`}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              variant="contained"
              onClick={handleAddMute}
              disabled={adding}
              startIcon={adding ? <CircularProgress size={16} /> : <MuteIcon />}
            >
              {adding ? 'ミュート中...' : 'ミュート'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ミュート編集ダイアログ */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>ミュート設定編集</DialogTitle>
          <DialogContent>
            {editingMute && (
              <>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {getMuteDisplayName(editingMute)}のミュート設定を編集
                </Typography>

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  適用範囲
                </Typography>
                <FormGroup sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editScope.posts}
                        onChange={(e) => setEditScope(prev => ({ ...prev, posts: e.target.checked }))}
                      />
                    }
                    label="投稿"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editScope.comments}
                        onChange={(e) => setEditScope(prev => ({ ...prev, comments: e.target.checked }))}
                      />
                    }
                    label="コメント"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editScope.notifications}
                        onChange={(e) => setEditScope(prev => ({ ...prev, notifications: e.target.checked }))}
                      />
                    }
                    label="通知"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editScope.timeline}
                        onChange={(e) => setEditScope(prev => ({ ...prev, timeline: e.target.checked }))}
                      />
                    }
                    label="タイムライン"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editScope.search}
                        onChange={(e) => setEditScope(prev => ({ ...prev, search: e.target.checked }))}
                      />
                    }
                    label="検索結果"
                  />
                </FormGroup>

                <TextField
                  fullWidth
                  label="ミュート理由"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  multiline
                  rows={2}
                  inputProps={{ maxLength: 500 }}
                  helperText={`${editReason.length}/500文字`}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              variant="contained"
              onClick={handleEditMute}
              disabled={updating}
              startIcon={updating ? <CircularProgress size={16} /> : <SettingsIcon />}
            >
              {updating ? '更新中...' : '更新'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};