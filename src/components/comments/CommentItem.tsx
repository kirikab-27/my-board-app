'use client';

import React, { useState } from 'react';
import {
  Typography,
  Avatar,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Chip,
  Divider,
  Collapse,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Reply as ReplyIcon,
  MoreVert,
  Edit,
  Delete,
  Report,
} from '@mui/icons-material';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import CommentForm from './CommentForm';
import { MentionRenderer } from '../mention';

interface CommentItemProps {
  comment: any;
  depth?: number;
  onReply?: (comment: any) => void;
  onUpdate?: (commentId: string, updatedComment: any) => void;
  onDelete?: (commentId: string) => void;
  onLike?: (commentId: string, liked: boolean) => void;
}

export default function CommentItem({
  comment,
  depth = 0,
  onReply,
  onUpdate,
  onDelete,
  onLike,
}: CommentItemProps) {
  const { data: session } = useSession();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isOwner = session?.user?.id === comment.userId;
  const maxDepth = 5; // 最大ネスト深度

  const handleLike = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const method = comment.isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/comments/${comment._id}/like`, {
        method,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'いいね処理に失敗しました');
      }

      if (onLike) {
        onLike(comment._id, data.liked);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setMenuAnchor(null);
  };

  const handleDelete = async () => {
    if (!confirm('このコメントを削除しますか？')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/comments/${comment._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'コメントの削除に失敗しました');
      }

      if (onDelete) {
        onDelete(comment._id);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
    setMenuAnchor(null);
  };

  const handleReplySubmit = (newComment: any) => {
    setShowReplyForm(false);
    if (onReply) {
      onReply(newComment);
    }
    setShowReplies(true);
  };

  const formatTimeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ja,
    });
  };

  const getAvatarProps = (user: any) => {
    if (user?.image) {
      return { src: user.image };
    }
    const initial = user?.name?.charAt(0)?.toUpperCase() || '?';
    return { children: initial };
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}

      <div
        className={`comment-level-${depth}`}
        style={{
          // 🚨 右シフト問題の完全解決：全て左端揃い
          display: 'flex',
          gap: 16,
          marginLeft: 0,
          paddingLeft: 0, // ★ 全階層で左端揃い！
          width: '100%',
          maxWidth: '100%',
          borderLeft: depth > 0 ? `${Math.min(depth * 2, 6)}px solid #e0e0e0` : 'none', // 階層表現は線の太さで
          boxSizing: 'border-box',
        }}
      >
        <Avatar {...getAvatarProps(comment.user)} sx={{ width: 32, height: 32 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* ヘッダー */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {/* 返信アイコン（第1階層以降） */}
                {depth > 0 && <ReplyIcon sx={{ fontSize: 14, color: 'text.secondary' }} />}
                <Typography variant="subtitle2" fontWeight="bold">
                  {comment.user?.name || comment.authorName}
                </Typography>
              </div>

              <Typography variant="caption" color="text.secondary">
                {formatTimeAgo(comment.createdAt)}
              </Typography>

              {comment.isEdited && (
                <Chip
                  label="編集済み"
                  size="small"
                  variant="outlined"
                  sx={{ height: 16, fontSize: '0.6rem' }}
                />
              )}

              {comment.isPinned && (
                <Chip
                  label="ピン留め"
                  size="small"
                  color="primary"
                  sx={{ height: 16, fontSize: '0.6rem' }}
                />
              )}
            </div>

            {(isOwner || session?.user?.role === 'admin') && (
              <IconButton
                size="small"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                disabled={loading}
              >
                <MoreVert fontSize="small" />
              </IconButton>
            )}
          </div>

          {/* コンテンツ */}
          {isEditing ? (
            <CommentForm
              postId={comment.postId}
              placeholder="コメントを編集..."
              onSubmit={(updatedComment) => {
                setIsEditing(false);
                if (onUpdate) {
                  onUpdate(comment._id, updatedComment);
                }
              }}
              onCancel={() => setIsEditing(false)}
              autoFocus
            />
          ) : (
            <div style={{ marginBottom: 8 }}>
              {/* @メンション表示（第2階層以降） */}
              {depth >= 2 && comment.parentComment && (
                <Typography
                  variant="body2"
                  component="span"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                    mr: 1,
                  }}
                  onClick={() => {
                    // TODO: 親コメントまでスクロール機能
                    console.log('Scroll to parent comment:', comment.parentComment);
                  }}
                >
                  @{comment.parentComment?.user?.name || comment.parentComment?.authorName}
                </Typography>
              )}

              <MentionRenderer
                content={comment.content}
                onMentionClick={(username) => {
                  // ユーザープロフィールページに遷移
                  if (typeof window !== 'undefined') {
                    window.location.href = `/users/${username}`;
                  }
                }}
              />
            </div>
          )}

          {/* アクションボタン */}
          {!isEditing && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <Button
                size="small"
                startIcon={comment.isLiked ? <Favorite /> : <FavoriteBorder />}
                onClick={handleLike}
                disabled={loading || !session}
                color={comment.isLiked ? 'error' : 'inherit'}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                {comment.likes > 0 && comment.likes}
              </Button>

              {depth < maxDepth ? (
                <Tooltip title={`返信を投稿 (現在 ${depth + 1}/${maxDepth} 階層)`}>
                  <Button
                    size="small"
                    startIcon={<ReplyIcon />}
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    disabled={!session}
                    sx={{ minWidth: 'auto', px: 1 }}
                  >
                    返信
                  </Button>
                </Tooltip>
              ) : (
                <div style={{ padding: '4px 8px' }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    📝 返信の上限（{maxDepth}階層）に達しました
                  </Typography>
                </div>
              )}

              {comment.totalReplies > 0 && (
                <Button
                  size="small"
                  onClick={() => setShowReplies(!showReplies)}
                  variant="text"
                  sx={{ minWidth: 'auto', px: 1 }}
                >
                  {showReplies ? '返信を非表示' : `返信を表示 (${comment.totalReplies})`}
                </Button>
              )}
            </div>
          )}

          {/* 返信フォーム */}
          <Collapse in={showReplyForm}>
            <div
              style={{ marginTop: 16, padding: 16, backgroundColor: '#fafafa', borderRadius: 4 }}
            >
              <CommentForm
                postId={comment.postId}
                parentId={comment._id}
                placeholder={`${comment.user?.name || comment.authorName}さんに返信...`}
                onSubmit={handleReplySubmit}
                onCancel={() => setShowReplyForm(false)}
                autoFocus
              />
            </div>
          </Collapse>

          {/* 返信一覧 */}
          <Collapse in={showReplies}>
            <div
              style={{
                marginTop: 8,
                marginLeft: 0,
                position: 'relative',
              }}
            >
              {comment.replies?.map((reply: any) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  depth={depth + 1}
                  onReply={onReply}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onLike={onLike}
                />
              ))}
            </div>
          </Collapse>

          {/* メニュー */}
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
          >
            {isOwner && (
              <MenuItem onClick={handleEdit}>
                <Edit fontSize="small" sx={{ mr: 1 }} />
                編集
              </MenuItem>
            )}

            <MenuItem onClick={handleDelete}>
              <Delete fontSize="small" sx={{ mr: 1 }} />
              削除
            </MenuItem>

            {!isOwner && (
              <MenuItem onClick={() => setMenuAnchor(null)}>
                <Report fontSize="small" sx={{ mr: 1 }} />
                報告
              </MenuItem>
            )}
          </Menu>
        </div>
      </div>

      {depth === 0 && <Divider sx={{ mt: 2 }} />}
    </div>
  );
}
