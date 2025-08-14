'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  AdminPanelSettings as AdminIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * ミドルウェア保護デモコンポーネント
 */
export const MiddlewareDemo: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [testResults, setTestResults] = useState<string[]>([]);

  const currentUser = session?.user;
  const currentRole = (currentUser as any)?.role || 'guest';

  // ルート設定情報
  const routeConfigs = [
    {
      category: '保護ルート',
      icon: <LockIcon />,
      color: 'error',
      routes: [
        { path: '/board', role: 'user', description: '会員限定掲示板' },
        { path: '/dashboard', role: 'user', description: 'ユーザーダッシュボード' },
        { path: '/profile', role: 'user', emailRequired: true, description: 'プロフィール管理' },
        { path: '/settings', role: 'user', emailRequired: true, description: 'アカウント設定' },
        { path: '/members-only', role: 'user', description: '会員限定デモページ' },
      ],
    },
    {
      category: 'ゲスト専用ルート',
      icon: <PublicIcon />,
      color: 'info',
      routes: [
        { path: '/login', redirect: '/board', description: 'ログインページ' },
        { path: '/register', redirect: '/board', description: '新規登録ページ' },
        { path: '/auth/reset-password', redirect: '/dashboard', description: 'パスワードリセット' },
      ],
    },
    {
      category: '管理者専用ルート',
      icon: <AdminIcon />,
      color: 'warning',
      routes: [
        { path: '/admin', role: 'admin', description: '管理者専用エリア' },
        { path: '/admin/security', role: 'admin', description: 'セキュリティ管理' },
        { path: '/admin/users', role: 'admin', description: 'ユーザー管理' },
      ],
    },
    {
      category: '公開ルート',
      icon: <PublicIcon />,
      color: 'success',
      routes: [
        { path: '/', description: 'ランディングページ' },
        { path: '/about', description: 'About ページ' },
        { path: '/auth/error', description: '認証エラー' },
        { path: '/auth/verified', description: 'メール認証完了' },
        { path: '/unauthorized', description: '権限不足' },
      ],
    },
  ];

  const testRoute = (path: string) => {
    setTestResults((prev) => [...prev, `Testing: ${path}`]);
    router.push(path);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getAccessStatus = (route: any) => {
    if (!currentUser && route.role) {
      return { status: '拒否', color: 'error', reason: '未認証' };
    }

    if (route.role && route.role !== 'user' && currentRole !== route.role) {
      return { status: '拒否', color: 'error', reason: `${route.role}権限必要` };
    }

    if (route.redirect && currentUser) {
      return { status: 'リダイレクト', color: 'info', reason: route.redirect };
    }

    if (route.emailRequired && !currentUser?.emailVerified) {
      return { status: '要メール認証', color: 'warning', reason: 'メール認証必要' };
    }

    return { status: '許可', color: 'success', reason: 'アクセス可能' };
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          🛡️ ミドルウェア保護システム
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          現在のユーザー: {currentUser?.name || '未ログイン'}({currentRole}) | メール認証:{' '}
          {currentUser?.emailVerified ? '✅' : '❌'}
        </Alert>
      </Box>

      {/* ルート設定テーブル */}
      <Grid container spacing={3}>
        {routeConfigs.map((category, index) => (
          <Grid size={12} key={index}>
            <Accordion defaultExpanded={index === 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {category.icon}
                  <Typography variant="h6">
                    {category.category} ({category.routes.length}件)
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>パス</TableCell>
                        <TableCell>必要権限</TableCell>
                        <TableCell>アクセス状況</TableCell>
                        <TableCell>説明</TableCell>
                        <TableCell>テスト</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {category.routes.map((route, routeIndex) => {
                        const access = getAccessStatus(route);
                        return (
                          <TableRow key={routeIndex}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {route.path}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {route.role && (
                                  <Chip
                                    size="small"
                                    label={route.role}
                                    color={category.color as any}
                                  />
                                )}
                                {route.emailRequired && (
                                  <Chip size="small" label="メール認証" color="secondary" />
                                )}
                                {route.redirect && (
                                  <Chip size="small" label="認証時リダイレクト" color="info" />
                                )}
                                {!route.role && !route.redirect && (
                                  <Chip size="small" label="なし" color="default" />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={access.status}
                                color={access.color as any}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{route.description}</Typography>
                              {access.reason && (
                                <Typography variant="caption" color="text.secondary">
                                  {access.reason}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => testRoute(route.path)}
                                startIcon={<SecurityIcon />}
                              >
                                テスト
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>

      {/* セキュリティ機能概要 */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          🔒 セキュリティ機能
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ShieldIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">レート制限</Typography>
                </Box>
                <Typography variant="body2">
                  • 一般: 15分間に200リクエスト
                  <br />
                  • 認証: 5分間に10リクエスト
                  <br />• 自動IP検出・制限
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SecurityIcon sx={{ mr: 1, color: 'secondary.main' }} />
                  <Typography variant="h6">CSRF保護</Typography>
                </Box>
                <Typography variant="body2">
                  • Origin/Refererヘッダー検証
                  <br />
                  • SameSite基本チェック
                  <br />• POSTリクエスト保護
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LockIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6">セキュリティヘッダー</Typography>
                </Box>
                <Typography variant="body2">
                  • X-Frame-Options: DENY
                  <br />
                  • X-XSS-Protection: 1; mode=block
                  <br />• Strict-Transport-Security
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AdminIcon sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="h6">ボット検出</Typography>
                </Box>
                <Typography variant="body2">
                  • User-Agent検証
                  <br />
                  • 疑わしいパターン検出
                  <br />• 保護ルートへのボットアクセス制限
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* テスト結果 */}
      {testResults.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            テスト結果
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
            {testResults.map((result, index) => (
              <Typography key={index} variant="body2" sx={{ fontFamily: 'monospace' }}>
                {result}
              </Typography>
            ))}
            <Button onClick={clearResults} size="small" sx={{ mt: 1 }}>
              クリア
            </Button>
          </Paper>
        </Box>
      )}
    </Container>
  );
};
