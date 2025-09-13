# Issue #64: 無限スクロール機能不具合修正記録

## 発生日時

2025-09-13

## 問題概要

掲示板ページ（/board）で無限スクロール機能が動作せず、下までスクロールしても「投稿を読み込み中」のまま新しい投稿が読み込まれない。

## 症状詳細

### 初期症状

1. ページ下部までスクロールしても追加投稿が読み込まれない
2. 「投稿を読み込み中...」の表示が継続
3. ブラウザコンソールに大量のログが出力される

### 調査で判明した問題

#### 問題1: PostListコンポーネントの無限再レンダリング

```
PostList レンダリング: 20 件の投稿
PostList レンダリング: 20 件の投稿
PostList レンダリング: 20 件の投稿
（数百回繰り返し）
```

**原因**: PostList.tsx の useEffect 依存配列に `posts.length` が含まれており、投稿データが変更されるたびに再レンダリングが発生していた。

#### 問題2: IntersectionObserver の無限再設定

```
[InfiniteScroll] Setting up IntersectionObserver with options: Object
[InfiniteScroll] Observing element:
[InfiniteScroll] Observer triggered: Object
（無限に繰り返し）
```

**原因**: コンポーネントの無限再レンダリングにより、IntersectionObserver が何度も破棄・再作成されていた。

#### 問題3: loading 状態が常に true

```
[InfiniteScroll] Observer triggered: {isIntersecting: true, hasNextPage: true, loading: true, loadingRef: false}
```

**原因**: useInfiniteScroll フック内で fetchPosts 関数が依存配列に含まれており、fetchPosts が再作成されるたびに useEffect が実行され、無限ループが発生していた。

## 修正内容

### 修正1: PostList.tsx の useEffect 依存配列修正

```typescript
// 修正前
React.useEffect(() => {
  // ...
}, [posts.length, session?.user?.id]);

// 修正後
React.useEffect(() => {
  // ...
}, [JSON.stringify(posts.map((p) => p._id)), session?.user?.id]);
```

**効果**: 投稿IDのリストが実際に変わった時のみ再レンダリングするように改善。

### 修正2: InfiniteScrollContainer のトリガー要素条件修正

```typescript
// 修正前
{hasNextPage && !loading && (
  <Box ref={loadMoreRef} sx={{ height: 1, width: '100%' }} />
)}

// 修正後
{hasNextPage && (
  <Box ref={loadMoreRef} sx={{ height: 20, width: '100%', backgroundColor: 'transparent' }}>
    <Typography variant="caption" sx={{ opacity: 0.3 }}>
      Loading trigger area
    </Typography>
  </Box>
)}
```

**効果**: loading 状態に関係なくトリガー要素を表示し、デバッグ可視化も追加。

### 修正3: useInfiniteScroll の依存配列最適化

```typescript
// fetchPosts を useRef で管理
const fetchPostsRef = useRef<typeof fetchPosts>();

// fetchPosts を ref に保存
useEffect(() => {
  fetchPostsRef.current = fetchPosts;
}, [fetchPosts]);

// 各 useEffect の依存配列から fetchPosts を除外
useEffect(() => {
  // ...
  fetchPostsRef.current?.(null);
}, [sortBy]); // fetchPosts を除外

// loadMore 内でも ref を使用
const loadMore = useCallback(async () => {
  // ...
  await fetchPostsRef.current?.(cursor);
}, [cursor, hasNextPage, loading, isLoadingMore, retryCount]); // fetchPosts を除外
```

**効果**: fetchPosts の再作成による無限ループを防止。

## 技術的詳細

### 無限ループの発生メカニズム

1. fetchPosts が useCallback で定義され、多くの依存値を持つ
2. 依存値が変更されると fetchPosts が再作成される
3. fetchPosts を依存配列に含む useEffect が実行される
4. useEffect 内で状態が更新される
5. 状態更新により fetchPosts の依存値が変更される
6. 1に戻る（無限ループ）

### 解決アプローチ

- **useRef パターン**: 関数の最新版を ref に保存し、useEffect の依存配列から除外
- **依存配列の最適化**: 必要最小限の依存値のみを含める
- **条件付き実行**: ref を使用して実際に値が変更された場合のみ実行

## デバッグログ追加箇所

1. **InfiniteScrollContainer.tsx**
   - IntersectionObserver の設定時
   - Observer のトリガー時
   - loadMore 呼び出し時

2. **useInfiniteScroll.ts**
   - loadMore 関数の実行時
   - API レスポンス受信時
   - cursor 更新時

3. **PostList.tsx**
   - コンポーネントレンダリング時（後に削除）

## 動作確認項目

- [x] 無限再レンダリングの停止
- [x] IntersectionObserver の正常動作
- [x] loading 状態の適切な管理
- [ ] スクロールによる追加投稿の読み込み
- [ ] エラーハンドリングの動作確認
- [ ] パフォーマンスの改善確認

## 関連ファイル

- `src/components/InfiniteScrollContainer.tsx`
- `src/components/PostList.tsx`
- `src/hooks/useInfiniteScroll.ts`
- `src/app/board/BoardPageClient.tsx`
- `src/app/api/posts/infinite/route.ts`

## 参考情報

- Issue #24: 初回の無限スクロール実装（Closed）
- React 18 の依存配列とメモ化に関する注意点
- IntersectionObserver API の使用方法

## 追加修正（2025-09-13 続き）

### 問題4: loading状態が常にtrueの問題

```
[InfiniteScroll] Observer triggered: {isIntersecting: true, hasNextPage: true, loading: true, loadingRef: false}
```

**原因**: sortBy効果フックが初回マウント時にも実行され、initialDataがあるにも関わらずfetchPostsを呼び出していた。

### 修正4: sortBy効果フックの初回実行防止

```typescript
// sortByInitializedRefを追加して初回実行を防止
const sortByRef = useRef(sortBy);
const sortByInitializedRef = useRef(false);

useEffect(() => {
  // 初回マウント時はsortByRefを初期化するだけ
  if (!sortByInitializedRef.current) {
    sortByRef.current = sortBy;
    sortByInitializedRef.current = true;
    return;
  }

  // ソート条件が実際に変更された場合のみ実行
  if (sortBy !== sortByRef.current) {
    // fetchPostsを実行
  }
}, [sortBy]);
```

**効果**: 初期データがある場合、不要なfetchPostsの実行を防止し、loading状態が正しく管理される。

## 今後の改善点

1. **仮想スクロールの実装**: 大量の投稿がある場合のパフォーマンス改善
2. **エラーリトライ機能**: ネットワークエラー時の自動リトライ
3. **キャッシュ戦略**: 読み込み済み投稿のキャッシュ管理
4. **デバッグログの削除**: 本番環境向けにデバッグログを削除

## 教訓

1. **useEffect の依存配列には注意**: 特に関数を含める場合は無限ループのリスクがある
2. **useRef パターンの活用**: 最新の関数参照を保持しつつ、依存配列から除外できる
3. **段階的デバッグ**: console.log を活用して問題の原因を特定
4. **複雑な状態管理**: 複数のフックが連携する場合は、依存関係を慎重に設計する必要がある
