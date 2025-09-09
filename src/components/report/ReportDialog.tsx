'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stack,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useSession } from 'next-auth/react';

/**
 * 通報ダイアログコンポーネント
 * Issue #60: レポート・通報システム
 */

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  targetType: 'post' | 'comment' | 'user' | 'media';
  targetId: string;
  targetContent?: string; // プレビュー用のコンテンツ
}

const REPORT_CATEGORIES = {
  spam: { label: 'スパム', description: '広告や無関係な内容' },
  inappropriate: { label: '不適切なコンテンツ', description: '暴力的・性的な内容' },
  harassment: { label: 'ハラスメント', description: '嫌がらせや脅迫' },
  copyright: { label: '著作権侵害', description: '無断転載や盗用' },
  misinformation: { label: '誤情報', description: '虚偽や誤解を招く情報' },
  other: { label: 'その他', description: '上記以外の問題' },
};

export default function ReportDialog({
  open,
  onClose,
  targetType,
  targetId,
  targetContent,
}: ReportDialogProps) {
  const { data: session } = useSession();
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [reportNumber, setReportNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // バリデーション
    if (!category) {
      setError('通報理由を選択してください');
      return;
    }
    if (!description || description.length < 10) {
      setError('詳細な説明を入力してください（10文字以上）');
      return;
    }
    if (!session?.user && !email) {
      setError('メールアドレスを入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetType,
          targetId,
          category,
          description,
          reporterEmail: !session?.user ? email : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('通報の送信に失敗しました');
      }

      const data = await response.json();
      setReportNumber(data.reportNumber);
      setSubmitSuccess(true);

      // 3秒後に自動で閉じる
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '通報の送信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCategory('');
    setDescription('');
    setEmail('');
    setSubmitSuccess(false);
    setReportNumber(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <FlagIcon color="error" />
            <Typography variant="h6">コンテンツを通報</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {submitSuccess ? (
          // 送信成功画面
          <Box textAlign="center" py={3}>
            <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              通報を受け付けました
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              受付番号: <strong>{reportNumber}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              24時間以内に内容を確認し、必要に応じて対応いたします。
            </Typography>
          </Box>
        ) : (
          // 通報フォーム
          <Stack spacing={3}>
            {/* 通報対象のプレビュー */}
            {targetContent && (
              <Alert severity="info" variant="outlined">
                <Typography variant="subtitle2" gutterBottom>
                  通報対象:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {targetContent}
                </Typography>
              </Alert>
            )}

            {/* カテゴリー選択 */}
            <FormControl fullWidth required>
              <InputLabel>通報理由</InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                label="通報理由"
              >
                {Object.entries(REPORT_CATEGORIES).map(([key, value]) => (
                  <MenuItem key={key} value={key}>
                    <Box>
                      <Typography variant="body1">{value.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {value.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 詳細説明 */}
            <TextField
              label="詳細な説明"
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="通報理由の詳細を記入してください（10文字以上）"
              required
              fullWidth
              helperText={`${description.length}/2000文字`}
              inputProps={{ maxLength: 2000 }}
            />

            {/* 匿名通報時のメールアドレス */}
            {!session?.user && (
              <TextField
                label="メールアドレス"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="対応結果の連絡先"
                required
                fullWidth
                helperText="通報結果の連絡に使用します"
              />
            )}

            {/* エラー表示 */}
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* 注意事項 */}
            <Alert severity="warning">
              <Typography variant="body2">
                虚偽の通報や嫌がらせ目的の通報は禁止されています。
                悪質な場合はアカウント停止等の措置を取る場合があります。
              </Typography>
            </Alert>
          </Stack>
        )}
      </DialogContent>

      {!submitSuccess && (
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="error"
            disabled={isSubmitting || !category || description.length < 10}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <FlagIcon />}
          >
            {isSubmitting ? '送信中...' : '通報する'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
