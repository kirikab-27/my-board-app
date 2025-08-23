'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { MoreVert, Edit, Delete, ThumbUp, ThumbUpOutlined } from '@mui/icons-material';
import { highlightText } from '@/utils/highlightText';
import { SafePostContent } from '@/components/SafeContent';

interface Post {
  _id: string;
  title?: string;
  content: string;
  likes: number;
  likedBy: string[];
  userId?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    username?: string;
    displayName?: string;
  };
  authorName?: string;
  isPublic: boolean;
  hashtags?: Array<{ _id: string; name: string; count: number }>;
  media?: Array<{ url: string; type: string; publicId: string }>;
  createdAt: string;
  updatedAt: string;
}

interface PostListProps {
  posts: Post[];
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (post: Post) => void;
  onLikeUpdate?: (postId: string, newLikes: number, newLikedBy: string[]) => void;
  searchTerm?: string;
  sessionUserId?: string | null;
  onRefresh?: () => void;
  onEditPost?: (post: Post) => void;
  onPostClick?: (post: Post) => void;
  searchQuery?: string;
}

export default function PostList({
  posts,
  onPostDeleted,
  onPostUpdated,
  onLikeUpdate,
  searchTerm,
  sessionUserId,
  onRefresh,
  onEditPost,
  onPostClick,
  searchQuery,
}: PostListProps) {
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [postLikeCounts, setPostLikeCounts] = useState<Map<string, number>>(new Map());

  console.log('PostList レンダリング:', posts.length, '件の投稿');

  // 投稿のいいね状態と最新いいね数を取得
  React.useEffect(() => {
    const fetchLikeStates = async () => {
      const likedSet = new Set<string>();
      const likeCountMap = new Map<string, number>();

      for (const post of posts) {
        try {
          const response = await fetch(`/api/posts/${post._id}/like`);
          if (response.ok) {
            const data = await response.json();
            if (data.liked) {
              likedSet.add(post._id);
            }
            // 最新のいいね数を保存
            likeCountMap.set(post._id, data.likes);
          } else {
            // API エラーの場合は初期値を使用
            likeCountMap.set(post._id, post.likes);
          }
        } catch (error) {
          console.error(`Failed to fetch like state for post ${post._id}:`, error);
          // エラーの場合は初期値を使用
          likeCountMap.set(post._id, post.likes);
        }
      }

      setLikedPosts(likedSet);
      setPostLikeCounts(likeCountMap);
    };

    if (posts.length > 0) {
      fetchLikeStates();
    }
  }, [posts]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, post: Post) => {
    console.log('メニューがクリックされました:', post._id);
    setAnchorEl(event.currentTarget);
    setSelectedPost(post);
  };

  const handleMenuClose = () => {
    console.log('メニューを閉じます');
    setAnchorEl(null);
    setSelectedPost(null);
  };

  const handleEdit = () => {
    console.log('編集がクリックされました:', selectedPost?._id);
    if (selectedPost) {
      onEditPost?.(selectedPost);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    console.log('削除がクリックされました:', selectedPost?._id);
    setPostToDelete(selectedPost);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) {
      console.error('削除対象の投稿が選択されていません');
      return;
    }

    console.log('削除開始:', postToDelete._id);
    setIsDeleting(true);
    setError('');

    try {
      console.log(`削除API呼び出し: /api/posts/${postToDelete._id}`);
      const response = await fetch(`/api/posts/${postToDelete._id}`, {
        method: 'DELETE',
      });

      console.log('削除APIレスポンス:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('削除APIエラー:', errorData);
        throw new Error(errorData.error || '削除に失敗しました');
      }

      const result = await response.json();
      console.log('削除成功:', result);

      onPostDeleted?.(postToDelete._id);
      onRefresh?.();
      console.log('投稿削除処理完了');
    } catch (error) {
      console.error('削除処理エラー:', error);
      setError(error instanceof Error ? error.message : '削除に失敗しました');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setPostToDelete(null);
      console.log('削除処理完了');
    }
  };

  const handleDeleteCancel = () => {
    console.log('削除がキャンセルされました');
    setDeleteDialogOpen(false);
    setPostToDelete(null);
  };

  const handleLike = async (event: React.MouseEvent, postId: string) => {
    event.stopPropagation(); // 投稿詳細ページへの遷移を防ぐ

    if (likingPosts.has(postId)) return; // 既にいいね処理中の場合は何もしない

    setLikingPosts((prev) => new Set(prev).add(postId));
    setError('');

    const isLiked = likedPosts.has(postId);
    const method = isLiked ? 'DELETE' : 'POST';

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: method,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || (isLiked ? 'いいね取り消しに失敗しました' : 'いいねに失敗しました')
        );
      }

      const data = await response.json();

      // ローカル状態を更新
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        if (data.liked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });

      // いいね数をリアルタイム更新
      setPostLikeCounts((prev) => {
        const newMap = new Map(prev);
        newMap.set(postId, data.likes);
        return newMap;
      });

      // コールバック関数を呼び出し
      onLikeUpdate?.(postId, data.likes, data.likedBy || []);
      onRefresh?.(); // 投稿一覧を更新
    } catch (error) {
      console.error('いいねエラー:', error);
      setError(error instanceof Error ? error.message : 'いいね操作に失敗しました');
    } finally {
      setLikingPosts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP');
  };

  if (posts.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary" textAlign="center">
        まだ投稿がありません
      </Typography>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {posts.map((post) => (
        <Paper
          key={post._id}
          elevation={1}
          sx={{
            p: 2,
            mb: 2,
            cursor: onPostClick ? 'pointer' : 'default',
            overflow: 'hidden',
            '&:hover': onPostClick
              ? {
                  elevation: 3,
                  backgroundColor: 'action.hover',
                }
              : {},
          }}
          onClick={() => onPostClick && onPostClick(post)}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              {/* タイトル表示 */}
              {post.title && (
                <Typography
                  variant="h6"
                  sx={{
                    mb: 1,
                    fontWeight: 'bold',
                    color: onPostClick ? 'primary.main' : 'inherit',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto',
                  }}
                >
                  {searchQuery ? highlightText(post.title, searchQuery) : post.title}
                </Typography>
              )}

              {/* 投稿内容（プレビュー）- XSS対策済み */}
              <Box
                sx={{
                  mb: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: post.title ? 3 : 5, // タイトルありなら3行、なしなら5行
                  WebkitBoxOrient: 'vertical',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto',
                }}
              >
                {searchQuery ? (
                  // ハイライト機能を使用する場合（検索時）
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {highlightText(post.content, searchQuery)}
                  </Typography>
                ) : (
                  // 通常表示（XSS対策あり）
                  <SafePostContent
                    content={post.content}
                    sx={{
                      '& *': { fontSize: 'inherit !important' },
                      fontSize: 'body1.fontSize',
                      whiteSpace: 'pre-wrap',
                    }}
                  />
                )}
              </Box>

              {/* 投稿者情報 */}
              {post.authorName && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 1 }}
                >
                  投稿者: {post.authorName}
                </Typography>
              )}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  投稿日時: {formatDate(post.createdAt)}
                  {post.updatedAt !== post.createdAt && <> (更新: {formatDate(post.updatedAt)})</>}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={(event) => handleLike(event, post._id)}
                    disabled={likingPosts.has(post._id)}
                    color={likedPosts.has(post._id) ? 'primary' : 'default'}
                  >
                    {likedPosts.has(post._id) ? (
                      <ThumbUp fontSize="small" />
                    ) : (
                      <ThumbUpOutlined fontSize="small" />
                    )}
                  </IconButton>
                  <Typography variant="caption" color="text.secondary">
                    {postLikeCounts.get(post._id) ?? post.likes}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* 本人の投稿の場合のみメニューボタンを表示 */}
            {session?.user?.id === post.userId?._id && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation(); // 投稿クリックイベントを防ぐ
                  handleMenuClick(e, post);
                }}
              >
                <MoreVert />
              </IconButton>
            )}
          </Box>
        </Paper>
      ))}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1 }} />
          編集
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <Delete sx={{ mr: 1 }} />
          削除
        </MenuItem>
      </Menu>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>投稿を削除</DialogTitle>
        <DialogContent>
          <Typography>この投稿を削除してもよろしいですか？</Typography>
          {postToDelete && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1, whiteSpace: 'pre-wrap' }}
            >
              &ldquo;{postToDelete.content}&rdquo;
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            キャンセル
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" disabled={isDeleting}>
            {isDeleting ? '削除中...' : '削除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
