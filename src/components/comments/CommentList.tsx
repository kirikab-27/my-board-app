'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Pagination,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Paper,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';

interface CommentListProps {
  postId: string;
  initialComments?: any[];
  showForm?: boolean;
}

export default function CommentList({
  postId,
  initialComments = [],
  showForm = true,
}: CommentListProps) {
  const [comments, setComments] = useState(initialComments);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('asc');
  const hasInitialized = useRef(initialComments.length > 0);

  const fetchComments = useCallback(async () => {
    if (!postId) return;

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        postId,
        page: page.toString(),
        limit: '10',
        sortBy,
        order,
      });

      const response = await fetch(`/api/comments?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'コメントの取得に失敗しました');
      }

      setComments(data.comments);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(Math.max(data.pagination.totalCount, 0));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [postId, page, sortBy, order]);

  useEffect(() => {
    if (!hasInitialized.current) {
      fetchComments();
      hasInitialized.current = true;
    }
  }, []);

  // ページ・ソート変更時の再取得
  useEffect(() => {
    if (hasInitialized.current) {
      fetchComments();
    }
  }, [page, sortBy, order, postId]);

  const handleCommentSubmit = (newComment: any) => {
    setComments((prev) => [newComment, ...prev]);
    setTotalCount((prev) => Math.max(prev + 1, 0));
  };

  const handleReply = (newReply: any) => {
    // 再帰的に返信を追加する関数
    const addReplyRecursively = (comments: any[]): any[] => {
      return comments.map((comment) => {
        if (comment._id === newReply.parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply],
            totalReplies: comment.totalReplies + 1,
          };
        }

        // 子返信を再帰的に検索
        if (comment.replies && comment.replies.length > 0) {
          const updatedReplies = addReplyRecursively(comment.replies);
          return {
            ...comment,
            replies: updatedReplies,
          };
        }

        return comment;
      });
    };

    setComments((prev) => addReplyRecursively(prev));
    setTotalCount((prev) => Math.max(prev + 1, 0));

    // 手動でリフレッシュして最新状態を取得
    setTimeout(() => {
      fetchComments();
    }, 500);
  };

  const handleUpdate = (commentId: string, updatedComment: any) => {
    // 再帰的に更新する関数
    const updateRecursively = (comments: any[]): any[] => {
      return comments.map((comment) => {
        if (comment._id === commentId) {
          return { ...comment, ...updatedComment };
        }

        // 子返信を再帰的に更新
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: updateRecursively(comment.replies),
          };
        }

        return comment;
      });
    };

    setComments((prev) => updateRecursively(prev));
  };

  const handleDelete = (commentId: string) => {
    let deleted = false;

    // 再帰的に削除する関数
    const deleteRecursively = (comments: any[]): any[] => {
      return comments.filter((comment) => {
        if (comment._id === commentId) {
          deleted = true;
          return false;
        }

        // 子返信を再帰的に削除
        if (comment.replies && comment.replies.length > 0) {
          const originalLength = comment.replies.length;
          comment.replies = deleteRecursively(comment.replies);

          // 返信が削除された場合、totalRepliesを更新
          if (comment.replies.length < originalLength) {
            comment.totalReplies = comment.replies.length;
          }
        }

        return true;
      });
    };

    setComments((prev) => {
      const result = deleteRecursively(prev);
      if (deleted) {
        setTotalCount((prevCount) => Math.max(prevCount - 1, 0));
      }
      return result;
    });
  };

  const handleLike = (commentId: string, liked: boolean) => {
    // 再帰的にいいねを更新する関数
    const likeRecursively = (comments: any[]): any[] => {
      return comments.map((comment) => {
        if (comment._id === commentId) {
          return {
            ...comment,
            isLiked: liked,
            likes: liked ? comment.likes + 1 : comment.likes - 1,
          };
        }

        // 子返信を再帰的に処理
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: likeRecursively(comment.replies),
          };
        }

        return comment;
      });
    };

    setComments((prev) => likeRecursively(prev));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  const handleSortChange = (newSortBy: string, newOrder: string) => {
    setSortBy(newSortBy);
    setOrder(newOrder);
    setPage(1);
  };

  return (
    <Box>
      {/* ヘッダー */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6" component="h3">
            コメント ({Math.max(totalCount, 0)})
          </Typography>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchComments}
            disabled={loading}
            size="small"
          >
            更新
          </Button>
        </Box>

        {/* ソート設定 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>並び順</InputLabel>
            <Select
              value={`${sortBy}_${order}`}
              label="並び順"
              onChange={(e) => {
                const [newSortBy, newOrder] = e.target.value.split('_');
                handleSortChange(newSortBy, newOrder);
              }}
            >
              <MenuItem value="createdAt_asc">古い順</MenuItem>
              <MenuItem value="createdAt_desc">新しい順</MenuItem>
              <MenuItem value="likes_desc">いいね数順</MenuItem>
              <MenuItem value="replies_desc">返信数順</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* コメント投稿フォーム */}
      {showForm && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <CommentForm postId={postId} onSubmit={handleCommentSubmit} />
        </Paper>
      )}

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* ローディング */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* コメント一覧 */}
      {!loading && (
        <>
          {comments.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="body1" color="text.secondary">
                まだコメントがありません
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                最初のコメントを投稿してみましょう
              </Typography>
            </Paper>
          ) : (
            <Box>
              {comments.map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  onReply={handleReply}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onLike={handleLike}
                />
              ))}
            </Box>
          )}

          {/* ページネーション */}
          {totalPages > 1 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mt: 4,
              }}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
