'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
} from '@mui/material';
import { getSecurityStats, getRateLimitInfo, unblockIpOrUser } from '@/lib/security/rateLimit';

interface SecurityStats {
  ip: {
    totalIPs: number;
    blockedIPs: number;
  };
  user: {
    totalUsers: number;
    blockedUsers: number;
  };
  config: {
    IP_LIMIT: {
      maxAttempts: number;
      windowMs: number;
      lockoutMs: number;
    };
    USER_LIMIT: {
      maxAttempts: number;
      windowMs: number;
      lockoutMs: number;
    };
  };
}

interface RateLimitInfo {
  ip: {
    attempts: number;
    locked: boolean;
    lockUntil?: number;
    remaining: number;
  };
  user: {
    attempts: number;
    locked: boolean;
    lockUntil?: number;
    remaining: number;
  } | null;
}

export default function SecurityAdminPage() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [queryIP, setQueryIP] = useState('');
  const [queryEmail, setQueryEmail] = useState('');
  const [unblockIdentifier, setUnblockIdentifier] = useState('');
  const [unblockType, setUnblockType] = useState<'ip' | 'user'>('ip');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // セキュリティ統計取得
  const fetchStats = async () => {
    try {
      const securityStats = getSecurityStats();
      setStats(securityStats);
    } catch (error) {
      console.error('統計取得エラー:', error);
      setMessage({ type: 'error', text: '統計情報の取得に失敗しました' });
    }
  };

  // 特定IP/ユーザーの情報取得
  const fetchRateLimitInfo = async () => {
    if (!queryIP) {
      setMessage({ type: 'error', text: 'IPアドレスを入力してください' });
      return;
    }

    try {
      const info = getRateLimitInfo(queryIP, queryEmail || undefined);
      setRateLimitInfo(info);
      setMessage({ type: 'success', text: 'レート制限情報を取得しました' });
    } catch (error) {
      console.error('レート制限情報取得エラー:', error);
      setMessage({ type: 'error', text: 'レート制限情報の取得に失敗しました' });
    }
  };

  // ブロック解除
  const handleUnblock = async () => {
    if (!unblockIdentifier) {
      setMessage({ type: 'error', text: 'ブロック解除対象を入力してください' });
      return;
    }

    setLoading(true);
    try {
      const success = unblockIpOrUser(unblockIdentifier, unblockType);

      if (success) {
        setMessage({
          type: 'success',
          text: `${unblockType === 'ip' ? 'IP' : 'ユーザー'} ${unblockIdentifier} のブロックを解除しました`,
        });

        // 統計を再取得
        fetchStats();

        // 同じ情報を表示中なら更新
        if (
          (unblockType === 'ip' && queryIP === unblockIdentifier) ||
          (unblockType === 'user' && queryEmail === unblockIdentifier)
        ) {
          fetchRateLimitInfo();
        }
      } else {
        setMessage({
          type: 'error',
          text: `${unblockIdentifier} のブロック記録が見つかりませんでした`,
        });
      }
    } catch (error) {
      console.error('ブロック解除エラー:', error);
      setMessage({ type: 'error', text: 'ブロック解除に失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  // 初期データ読み込み
  useEffect(() => {
    fetchStats();
  }, []);

  // 時間フォーマット
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        セキュリティ管理ダッシュボード
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        ブルートフォース攻撃対策の統計・管理
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* セキュリティ統計 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                IP制限統計
              </Typography>
              {stats && (
                <Box>
                  <Typography variant="body1">
                    監視中IP数: <Chip label={stats.ip.totalIPs} color="primary" size="small" />
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    ブロック中IP数:{' '}
                    <Chip
                      label={stats.ip.blockedIPs}
                      color={stats.ip.blockedIPs > 0 ? 'error' : 'success'}
                      size="small"
                    />
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    制限: {stats.config.IP_LIMIT.maxAttempts}回/
                    {formatTime(stats.config.IP_LIMIT.windowMs)}→{' '}
                    {formatTime(stats.config.IP_LIMIT.lockoutMs)}ロック
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ユーザー制限統計
              </Typography>
              {stats && (
                <Box>
                  <Typography variant="body1">
                    監視中ユーザー数:{' '}
                    <Chip label={stats.user.totalUsers} color="primary" size="small" />
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    ブロック中ユーザー数:{' '}
                    <Chip
                      label={stats.user.blockedUsers}
                      color={stats.user.blockedUsers > 0 ? 'error' : 'success'}
                      size="small"
                    />
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    制限: {stats.config.USER_LIMIT.maxAttempts}回/
                    {formatTime(stats.config.USER_LIMIT.windowMs)}→{' '}
                    {formatTime(stats.config.USER_LIMIT.lockoutMs)}ロック
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* レート制限情報確認 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            レート制限情報確認
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              label="IPアドレス"
              value={queryIP}
              onChange={(e) => setQueryIP(e.target.value)}
              placeholder="例: 192.168.1.100"
              size="small"
              sx={{ minWidth: 200 }}
            />
            <TextField
              label="メールアドレス（任意）"
              value={queryEmail}
              onChange={(e) => setQueryEmail(e.target.value)}
              placeholder="例: user@example.com"
              size="small"
              sx={{ minWidth: 250 }}
            />
            <Button variant="contained" onClick={fetchRateLimitInfo} disabled={!queryIP}>
              確認
            </Button>
          </Box>

          {rateLimitInfo && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1">IP制限状況</Typography>
                    <Typography>試行回数: {rateLimitInfo.ip.attempts}</Typography>
                    <Typography>残り回数: {rateLimitInfo.ip.remaining}</Typography>
                    <Typography>
                      ロック状態:{' '}
                      {rateLimitInfo.ip.locked ? (
                        <Chip label="ロック中" color="error" size="small" />
                      ) : (
                        <Chip label="正常" color="success" size="small" />
                      )}
                    </Typography>
                    {rateLimitInfo.ip.lockUntil && (
                      <Typography variant="body2" color="text.secondary">
                        解除時刻: {new Date(rateLimitInfo.ip.lockUntil).toLocaleString()}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1">ユーザー制限状況</Typography>
                    {rateLimitInfo.user ? (
                      <>
                        <Typography>試行回数: {rateLimitInfo.user.attempts}</Typography>
                        <Typography>残り回数: {rateLimitInfo.user.remaining}</Typography>
                        <Typography>
                          ロック状態:{' '}
                          {rateLimitInfo.user.locked ? (
                            <Chip label="ロック中" color="error" size="small" />
                          ) : (
                            <Chip label="正常" color="success" size="small" />
                          )}
                        </Typography>
                        {rateLimitInfo.user.lockUntil && (
                          <Typography variant="body2" color="text.secondary">
                            解除時刻: {new Date(rateLimitInfo.user.lockUntil).toLocaleString()}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Typography color="text.secondary">
                        ユーザー情報なし（メールアドレス未指定）
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* ブロック解除 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ブロック解除
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>種別</InputLabel>
              <Select
                value={unblockType}
                onChange={(e) => setUnblockType(e.target.value as 'ip' | 'user')}
                label="種別"
              >
                <MenuItem value="ip">IP</MenuItem>
                <MenuItem value="user">ユーザー</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={unblockType === 'ip' ? 'IPアドレス' : 'メールアドレス'}
              value={unblockIdentifier}
              onChange={(e) => setUnblockIdentifier(e.target.value)}
              placeholder={unblockType === 'ip' ? '192.168.1.100' : 'user@example.com'}
              size="small"
              sx={{ minWidth: 250 }}
            />

            <Button
              variant="contained"
              color="warning"
              onClick={handleUnblock}
              disabled={loading || !unblockIdentifier}
            >
              {loading ? '解除中...' : 'ブロック解除'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* リアルタイム更新ボタン */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button variant="outlined" onClick={fetchStats}>
          統計を更新
        </Button>
      </Box>
    </Container>
  );
}
