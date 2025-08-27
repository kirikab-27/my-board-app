'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tab,
  Tabs,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp,
  Tag as TagIcon,
  Whatshot,
  FilterList
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import HashtagList from '@/components/hashtags/HashtagList';
import TrendingHashtags from '@/components/hashtags/TrendingHashtags';
import HashtagCloud from '@/components/hashtags/HashtagCloud';
import HashtagSearch from '@/components/hashtags/HashtagSearch';
import { ProfileHeader } from '@/components/profile/ProfileHeader';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function HashtagsPage() {
  const router = useRouter();
  
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [popularHashtags, setPopularHashtags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { value: 'all', label: '全て' },
    { value: 'technology', label: 'テクノロジー' },
    { value: 'entertainment', label: 'エンターテイメント' },
    { value: 'sports', label: 'スポーツ' },
    { value: 'news', label: 'ニュース' },
    { value: 'lifestyle', label: 'ライフスタイル' },
    { value: 'business', label: 'ビジネス' }
  ];

  // 人気ハッシュタグ取得
  const fetchPopularHashtags = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        limit: '20',
        sortBy: 'totalPosts',
        order: 'desc'
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/hashtags?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ハッシュタグの取得に失敗しました');
      }

      setPopularHashtags(data.hashtags || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    fetchPopularHashtags();
  }, [selectedCategory]);

  // タブ変更
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // ハッシュタグクリック（投稿ページへ）
  const handleHashtagClick = (hashtag: any) => {
    router.push(`/hashtags/${encodeURIComponent(hashtag.name)}`);
  };

  // 検索結果変更
  const handleSearchChange = (query: string, results: any[]) => {
    setSearchQuery(query);
    setSearchResults(results);
  };

  return (
    <>
      <ProfileHeader title="ハッシュタグ" />
      <Container maxWidth="xl" sx={{ py: 4, mt: { xs: 14, sm: 16, md: 16 } }}>
        {/* ヘッダー */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TagIcon fontSize="large" color="primary" />
            ハッシュタグ
          </Typography>
          <Typography variant="body1" color="text.secondary">
            トレンドのハッシュタグを探したり、新しい話題を発見しましょう
          </Typography>
        </Box>

      {/* 検索バー */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <HashtagSearch
          placeholder="ハッシュタグを検索..."
          showHistory={true}
          showFilters={true}
          showRelated={true}
          onSearchChange={handleSearchChange}
          onResultSelect={handleHashtagClick}
        />
      </Paper>

      {/* カテゴリフィルター */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterList fontSize="small" />
          <Typography variant="subtitle1">カテゴリフィルター:</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {categories.map((category) => (
            <Chip
              key={category.value}
              label={category.label}
              clickable
              color={selectedCategory === category.value ? 'primary' : 'default'}
              onClick={() => setSelectedCategory(category.value)}
            />
          ))}
        </Box>
      </Box>

      {/* タブナビゲーション */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} variant="fullWidth">
          <Tab 
            icon={<TrendingUp />} 
            label="トレンド" 
            iconPosition="start"
          />
          <Tab 
            icon={<TagIcon />} 
            label="人気ハッシュタグ" 
            iconPosition="start"
          />
          <Tab 
            icon={<Whatshot />} 
            label="ハッシュタグクラウド" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 検索結果 */}
      {searchQuery && searchResults.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            「{searchQuery}」の検索結果 ({searchResults.length}件)
          </Typography>
          <HashtagList
            hashtags={searchResults}
            variant="list"
            showStats={true}
            showDescription={true}
            showActions={false}
            onHashtagClick={handleHashtagClick}
          />
        </Paper>
      )}

      {/* タブコンテンツ */}
      <TabPanel value={currentTab} index={0}>
        {/* トレンドタブ */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 400 }}>
            <TrendingHashtags
              limit={15}
              category={selectedCategory}
              timeframe="24h"
              showStats={true}
              showCategories={true}
              autoRefresh={300} // 5分自動更新
              onHashtagClick={handleHashtagClick}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 400 }}>
            <TrendingHashtags
              limit={15}
              category={selectedCategory}
              timeframe="7d"
              showStats={true}
              showCategories={false}
              onHashtagClick={handleHashtagClick}
            />
          </Box>
        </Box>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {/* 人気ハッシュタグタブ */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <HashtagList
            hashtags={popularHashtags}
            variant="card"
            showStats={true}
            showDescription={true}
            showRelated={true}
            showActions={true}
            onHashtagClick={handleHashtagClick}
          />
        )}
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {/* ハッシュタグクラウドタブ */}
        <HashtagCloud
          limit={100}
          category={selectedCategory}
          colorMode="trend"
          layout="random"
          interactive={true}
          showControls={true}
          autoRefresh={600} // 10分自動更新
          onHashtagClick={handleHashtagClick}
        />
      </TabPanel>

      {/* 統計情報 */}
      {currentTab === 1 && popularHashtags.length > 0 && (
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            📊 統計情報
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 150, textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main">
                {popularHashtags.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                アクティブなハッシュタグ
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 150, textAlign: 'center' }}>
              <Typography variant="h4" color="secondary.main">
                {popularHashtags.reduce((sum, tag) => sum + (tag.stats?.totalPosts || 0), 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                総投稿数
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 150, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {popularHashtags.reduce((sum, tag) => sum + (tag.stats?.uniqueUsers || 0), 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                総参加ユーザー数
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 150, textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {popularHashtags.filter(tag => tag.isTrending).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                トレンド中
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* 使い方ガイド */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="h6" gutterBottom>
          💡 使い方ガイド
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <Typography variant="subtitle2" gutterBottom>
              🔍 検索機能
            </Typography>
            <Typography variant="body2">
              ハッシュタグ名を入力して関連する話題を探せます。履歴機能と関連キーワード表示もあります。
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <Typography variant="subtitle2" gutterBottom>
              📈 トレンド情報
            </Typography>
            <Typography variant="body2">
              24時間、7日間、30日間のトレンドを確認できます。カテゴリ別での絞り込みも可能です。
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <Typography variant="subtitle2" gutterBottom>
              🏷️ ハッシュタグ投稿
            </Typography>
            <Typography variant="body2">
              投稿時に「#」を付けて話題を作成。関連する投稿を見つけやすくなります。
            </Typography>
          </Box>
        </Box>
      </Paper>
      </Container>
    </>
  );
}