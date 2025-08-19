'use client';

import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper, Alert, Divider, Chip } from '@mui/material';
import HashtagInput from './hashtags/HashtagInput';

interface PostFormProps {
  onPostCreated: () => void;
  editingPost?: {
    _id: string;
    content: string;
    title?: string;
    hashtags?: string[];
  } | null;
  onEditCancel?: () => void;
  showHashtags?: boolean;
  showTitle?: boolean;
  maxHashtags?: number;
}

export default function PostForm({ 
  onPostCreated, 
  editingPost, 
  onEditCancel,
  showHashtags = true,
  showTitle = false,
  maxHashtags = 10
}: PostFormProps) {
  const [content, setContent] = useState(editingPost?.content || '');
  const [title, setTitle] = useState(editingPost?.title || '');
  const [hashtags, setHashtags] = useState<string[]>(editingPost?.hashtags || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [extractedHashtags, setExtractedHashtags] = useState<string[]>([]);

  useEffect(() => {
    if (editingPost) {
      setContent(editingPost.content);
      setTitle(editingPost.title || '');
      setHashtags(editingPost.hashtags || []);
    } else {
      setContent('');
      setTitle('');
      setHashtags([]);
    }
  }, [editingPost]);

  // コンテンツからハッシュタグを自動抽出
  useEffect(() => {
    if (!showHashtags) return;
    
    const text = `${title} ${content}`;
    const hashtagRegex = /#([a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+)/g;
    const matches = text.match(hashtagRegex);
    
    if (matches) {
      const extracted = matches
        .map(tag => tag.replace('#', '').toLowerCase())
        .filter((tag, index, arr) => arr.indexOf(tag) === index) // 重複除去
        .slice(0, maxHashtags);
      
      setExtractedHashtags(extracted);
    } else {
      setExtractedHashtags([]);
    }
  }, [content, title, showHashtags, maxHashtags]);

  // クールダウンタイマー
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setCooldownRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('投稿内容を入力してください');
      return;
    }

    if (content.length > 1000) {
      setError('投稿は1000文字以内で入力してください');
      return;
    }

    if (showTitle && title && title.length > 100) {
      setError('タイトルは100文字以内で入力してください');
      return;
    }

    // 編集の場合はクールダウンをスキップ
    if (!editingPost) {
      const now = Date.now();
      const timeSinceLastSubmit = now - lastSubmitTime;
      const cooldownPeriod = 30 * 1000; // 30秒

      if (timeSinceLastSubmit < cooldownPeriod) {
        const remainingSeconds = Math.ceil((cooldownPeriod - timeSinceLastSubmit) / 1000);
        setCooldownRemaining(remainingSeconds);
        setError(`連続投稿を防ぐため、${remainingSeconds}秒後に再度お試しください`);
        return;
      }
    }

    setIsSubmitting(true);
    setError('');

    try {
      const url = editingPost ? `/api/posts/${editingPost._id}` : '/api/posts';

      const method = editingPost ? 'PUT' : 'POST';

      // 最終的なハッシュタグ配列（手動入力 + 自動抽出）
      const finalHashtags = [...new Set([...hashtags, ...extractedHashtags])].slice(0, maxHashtags);

      const requestBody: any = { content };
      if (showTitle && title.trim()) {
        requestBody.title = title.trim();
      }
      if (showHashtags && finalHashtags.length > 0) {
        requestBody.hashtags = finalHashtags;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '投稿に失敗しました');
      }

      setContent('');
      setTitle('');
      setHashtags([]);
      setExtractedHashtags([]);
      // 新規投稿の場合のみ最終投稿時刻を更新
      if (!editingPost) {
        setLastSubmitTime(Date.now());
      }
      onPostCreated();
      if (onEditCancel) {
        onEditCancel();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    setTitle('');
    setHashtags([]);
    setExtractedHashtags([]);
    setError('');
    if (onEditCancel) {
      onEditCancel();
    }
  };

  // 自動抽出されたハッシュタグをマニュアルリストに追加
  const addExtractedHashtag = (tag: string) => {
    if (!hashtags.includes(tag) && hashtags.length < maxHashtags) {
      setHashtags([...hashtags, tag]);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {editingPost ? '投稿を編集' : '新しい投稿'}
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        {/* タイトル入力（オプション） */}
        {showTitle && (
          <TextField
            fullWidth
            variant="outlined"
            label="タイトル（任意）"
            placeholder="投稿のタイトルを入力してください"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={title.length > 100}
            helperText={`${title.length}/100文字`}
            sx={{ mb: 2 }}
          />
        )}

        {/* コンテンツ入力 */}
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          label="投稿内容"
          placeholder="投稿内容を入力してください（1000文字以内）"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          error={content.length > 1000}
          helperText={`${content.length}/1000文字`}
          sx={{
            mb: 2,
            '& .MuiInputBase-input': {
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'pre-wrap',
            },
          }}
        />

        {/* ハッシュタグ機能 */}
        {showHashtags && (
          <>
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                ハッシュタグ
              </Typography>
            </Divider>

            {/* 自動抽出されたハッシュタグ */}
            {extractedHashtags.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  📝 自動検出されたハッシュタグ:
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {extractedHashtags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={`#${tag}`}
                      size="small"
                      color={hashtags.includes(tag) ? 'primary' : 'default'}
                      clickable
                      onClick={() => addExtractedHashtag(tag)}
                      disabled={hashtags.includes(tag)}
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  💡 クリックして手動リストに追加
                </Typography>
              </Box>
            )}

            {/* ハッシュタグ入力コンポーネント */}
            <HashtagInput
              value={hashtags}
              onChange={setHashtags}
              maxTags={maxHashtags}
              placeholder="追加のハッシュタグを入力..."
              size="small"
            />
          </>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || content.length > 1000 || (showTitle && title.length > 100) || cooldownRemaining > 0}
          >
            {isSubmitting
              ? '投稿中...'
              : cooldownRemaining > 0
                ? `待機中 (${cooldownRemaining}s)`
                : editingPost
                  ? '更新'
                  : '投稿'}
          </Button>

          {editingPost && (
            <Button type="button" variant="outlined" onClick={handleCancel} disabled={isSubmitting}>
              キャンセル
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
