'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Article as ArticleIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Delete as DeleteIcon,
  Report as ReportIcon,
} from '@mui/icons-material';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminLayoutEnhanced } from '@/components/admin/AdminLayoutEnhanced';
import type { AdminPostView } from '@/types/admin';

/**
 * 管理者投稿管理ページ
 * Issue #46 Phase 2: 投稿管理・モデレーション機能実装
 */
export default function AdminPostsPage() {
  const { session, isLoading, hasAccess } = useAdminAuth({
    requiredLevel: ['admin', 'moderator'],
  });

  // 状態管理
  const [posts, setPosts] = useState<AdminPostView[]>([]);
  const [, setLoading] = useState(true);
  const [,] = useState<string | null>(null);

  // 検索・フィルタ
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // ページング
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // UI状態
  const [selectedPost, setSelectedPost] = useState<AdminPostView | null>(null);
  const [actionMenu, setActionMenu] = useState<null | HTMLElement>(null);
  const [moderationDialog, setModerationDialog] = useState<string | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // ダミーデータ（Phase 2実装用）
  useEffect(() => {
    if (!hasAccess) return;

    setLoading(true);

    // Phase 2: ダミーデータで UI 確認
    setTimeout(() => {
      const dummyPosts: AdminPostView[] = [
        {
          _id: '1',
          title: '今日の出来事について',
          content: 'とても良い天気でした。公園で散歩をして、多くの人と出会いました。',
          authorId: '1',
          authorName: 'テストユーザー1',
          isPublic: true,
          createdAt: new Date('2025-09-01'),
          updatedAt: new Date('2025-09-01'),
          engagement: {
            likes: 15,
            comments: 3,
            shares: 1,
          },
          moderation: {
            reportCount: 0,
            isHidden: false,
          },
        },
        {
          _id: '2',
          title: undefined,
          content: 'これは不適切な内容かもしれません...',
          authorId: '2',
          authorName: '問題ユーザー',
          isPublic: true,
          createdAt: new Date('2025-08-30'),
          updatedAt: new Date('2025-08-30'),
          engagement: {
            likes: 0,
            comments: 0,
            shares: 0,
          },
          moderation: {
            reportCount: 2,
            isHidden: false,
          },
          media: [{ type: 'image', url: '/placeholder-image.jpg', publicId: 'sample1' }],
        },
      ];

      setPosts(dummyPosts);
      setTotalCount(dummyPosts.length);
      setLoading(false);
    }, 1000);
  }, [hasAccess]);

  // モデレーションアクション
  const handleModeration = async (action: string, post: AdminPostView) => {
    setActionLoading(true);
    setModerationDialog(action);
    setSelectedPost(post);

    // 実装予定: API呼び出し・監査ログ記録
    console.log('投稿モデレーション:', {
      action,
      postId: post._id,
      reason: moderationReason,
      adminId: session?.user?.id,
    });

    setTimeout(() => {
      setActionLoading(false);
      setModerationDialog(null);
      setActionMenu(null);
      setModerationReason('');
    }, 2000);
  };

  const getStatusChip = (post: AdminPostView) => {
    if (post.moderation.isHidden) {
      return <Chip label="非表示" color="error" size="small" />;
    }
    if (post.moderation.reportCount > 0) {
      return <Chip label={`報告${post.moderation.reportCount}件`} color="warning" size="small" />;
    }
    return <Chip label="公開" color="success" size="small" />;
  };

  if (isLoading || !hasAccess) {
    return (
      <AdminLayoutEnhanced title="投稿管理">
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </AdminLayoutEnhanced>
    );
  }

  return (
    <AdminLayoutEnhanced title="投稿管理">
      <Container maxWidth="lg">
        {/* ヘッダー・検索 */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <ArticleIcon color="primary" />
            投稿管理・モデレーション
          </Typography>

          {/* 検索・フィルタバー */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              placeholder="タイトル・内容で検索"
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

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>状態</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="状態"
              >
                <MenuItem value="all">すべて</MenuItem>
                <MenuItem value="public">公開</MenuItem>
                <MenuItem value="hidden">非表示</MenuItem>
                <MenuItem value="reported">報告済み</MenuItem>
              </Select>
            </FormControl>

            <Button variant="outlined" startIcon={<ReportIcon />}>
              報告一覧
            </Button>
          </Box>
        </Box>

        {/* 投稿一覧テーブル */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>状態</TableCell>
                  <TableCell>投稿内容</TableCell>
                  <TableCell>投稿者</TableCell>
                  <TableCell>エンゲージメント</TableCell>
                  <TableCell>作成日</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {posts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((post) => (
                  <TableRow key={post._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {getStatusChip(post)}
                        {post.media && <Chip label="メディア" variant="outlined" size="small" />}
                      </Box>
                    </TableCell>

                    <TableCell sx={{ maxWidth: 300 }}>
                      {post.title && (
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                          {post.title}
                        </Typography>
                      )}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {post.content}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="subtitle2">{post.authorName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {post.authorId}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ fontSize: '0.875rem' }}>
                        <div>👍 {post.engagement.likes}</div>
                        <div>💬 {post.engagement.comments}</div>
                        <div>📤 {post.engagement.shares}</div>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption">
                        {post.createdAt.toLocaleDateString('ja-JP')}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <IconButton
                        onClick={(e) => {
                          setActionMenu(e.currentTarget);
                          setSelectedPost(post);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="表示件数:"
          />
        </Paper>

        {/* アクションメニュー */}
        <Menu anchorEl={actionMenu} open={Boolean(actionMenu)} onClose={() => setActionMenu(null)}>
          <MenuItem onClick={() => handleModeration('view_details', selectedPost!)}>
            詳細表示
          </MenuItem>
          <MenuItem onClick={() => handleModeration('hide', selectedPost!)}>
            <VisibilityOffIcon sx={{ mr: 1 }} />
            非表示
          </MenuItem>
          <MenuItem onClick={() => handleModeration('restore', selectedPost!)}>
            <VisibilityIcon sx={{ mr: 1 }} />
            復活
          </MenuItem>
          {session?.user?.role === 'admin' && (
            <MenuItem
              onClick={() => handleModeration('delete', selectedPost!)}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon sx={{ mr: 1 }} />
              削除
            </MenuItem>
          )}
        </Menu>

        {/* モデレーション確認ダイアログ */}
        <Dialog
          open={Boolean(moderationDialog)}
          onClose={() => setModerationDialog(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            投稿モデレーション -{' '}
            {moderationDialog === 'hide'
              ? '非表示'
              : moderationDialog === 'delete'
                ? '削除'
                : '操作'}
          </DialogTitle>
          <DialogContent>
            {selectedPost && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  対象投稿: {selectedPost.title || '(タイトルなし)'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {selectedPost.content.substring(0, 100)}...
                </Typography>

                <TextField
                  fullWidth
                  label="操作理由（必須）"
                  multiline
                  rows={3}
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  placeholder="スパム・不適切・著作権侵害・その他"
                  sx={{ mb: 2 }}
                />

                <Alert severity="warning">
                  この操作は監査ログに記録され、投稿者に通知されます。
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModerationDialog(null)}>キャンセル</Button>
            <Button
              variant="contained"
              color={moderationDialog === 'delete' ? 'error' : 'primary'}
              disabled={actionLoading || !moderationReason.trim()}
              onClick={() => handleModeration(moderationDialog!, selectedPost!)}
            >
              {actionLoading ? <CircularProgress size={20} /> : '実行'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 開発ステータス */}
        <Alert severity="info" sx={{ mt: 3 }}>
          🚧 Phase 2実装中: ダミーデータ表示・モデレーション機能UI完成・API統合は次のPhase予定
        </Alert>
      </Container>
    </AdminLayoutEnhanced>
  );
}
