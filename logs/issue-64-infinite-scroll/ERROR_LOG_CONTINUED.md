# Issue #64: 無限スクロール機能エラー記録（続き）

## 発生日時

2025-09-13（継続中）

## 現在の問題

前回の修正にも関わらず、無限スクロールが依然として動作していない。

## 今回の調査（2025-09-13 後半）

### 重要な発見

**並び順を無効化した時は動作したが、完全削除したら動作しなくなった**

### 実施した修正と結果

#### 1. 無限再レンダリング対応（失敗）

**対応内容**:

- fetchPosts依存配列からlastPostId削除
- lastPostIdRefを追加
- React.useMemoでinitialDataをメモ化

**結果**: 改善なし - フックが数百回/秒で再初期化

#### 2. タイミング問題対応（失敗）

**対応内容**:

- setTimeoutで初回読み込みを遅延実行
- fetchPostsRef.currentが確実に設定されるように

**結果**: 改善なし

#### 3. sortBy機能の部分復元（失敗）

**対応内容**:

- sortByパラメータを内部ロジックのみ復元
- UIは非表示のまま
- fetchPosts依存配列にsortBy追加
- sortBy変更時のリフレッシュ処理復元

**結果**: 改善なし

## 根本原因（未解決）

1. なぜ並び順無効化時は動作し、完全削除で動作しなくなったのか不明
2. 初期データ20件は取得できているが表示されない理由が不明
3. 無限再レンダリングの真の原因が特定できていない

## CLAUDE.mdルール違反の反省

- ❌ エラー対処の記録を怠った
- ❌ 段階的な修正の記録を残さなかった
- ❌ 問題解決前に「修正完了」と報告してしまった

## 次のアクション

1. 並び順無効化時のコードに完全に戻す
2. React DevToolsで再レンダリング原因を詳細調査
3. 一つずつ慎重に削除して問題の境界を特定

## 天才エンジニア会議による修正（2025-09-13 続き）

### 発見した問題

1. **loading状態の無限トグル**: loadingがtrue/falseを無限に繰り返し
2. **fetchPostsの再作成**: 依存配列によりfetchPostsが頻繁に再作成
3. **ref更新問題**: fetchPostsRef.currentが適切に更新されない
4. **loadMoreの古い参照**: loadMoreが古いfetchPostsを参照する可能性

### 実施した修正

#### 修正5: fetchPostsRef更新の修正

```typescript
// 修正前
useEffect(() => {
  fetchPostsRef.current = fetchPosts;
}, [fetchPosts]);

// 修正後
fetchPostsRef.current = fetchPosts; // useEffectなしで直接更新
```

#### 修正6: loadMoreの依存配列修正

```typescript
// 修正前
await fetchPostsRef.current?.(cursor);
}, [cursor, hasNextPage, loading, isLoadingMore, retryCount]);

// 修正後
await fetchPosts(cursor); // 直接呼び出し
}, [cursor, hasNextPage, loading, isLoadingMore, retryCount, fetchPosts]);
```

#### 修正7: refresh関数の修正

```typescript
// 修正前
await fetchPostsRef.current?.(null);
}, []);

// 修正後
await fetchPosts(null); // 直接呼び出し
}, [fetchPosts]);
```

#### 修正8: 初回読み込みの修正

```typescript
// 最終的にsetTimeoutを使用してタイミング問題を解決
setTimeout(() => {
  fetchPostsRef.current?.(null);
}, 0);
```

### 技術的考察

- fetchPostsを依存配列に追加すると無限ループのリスクがある
- refパターンと直接呼び出しのバランスが重要
- 初回レンダリング時のタイミング問題に注意

### 教訓

1. **useEffect の依存配列には注意**: 特に関数を含める場合は無限ループのリスクがある
2. **useRef パターンの活用**: 最新の関数参照を保持しつつ、依存配列から除外できる
3. **段階的デバッグ**: console.log を活用して問題の原因を特定
4. **複雑な状態管理**: 複数のフックが連携する場合は、依存関係を慎重に設計する必要がある
5. **天才エンジニアチームアプローチ**: 複数の視点から問題を分析することで解決策を発見

### 真の原因発見と最終修正（2025-09-13）

#### 問題の真因

1. **useTransition の影響**: BoardPageClientで`loading || isPending`を使用していた
2. **isPendingの頻繁な変更**: startTransitionが呼ばれるたびにisPendingが変化
3. **loading propの無限変更**: これがInfiniteScrollContainerに伝播し無限再レンダリング

#### 最終修正

```typescript
// 修正前
loading={loading || isPending}

// 修正後
loading={loading}

// handleLoadMore等からstartTransition削除
const handleLoadMore = useCallback(() => {
  loadMore(); // startTransitionを削除
}, [loadMore]);
```

#### 根本的な教訓

- **useTransitionの副作用**: isPendingの頻繁な変更が予期しない無限ループを引き起こす
- **propsの複雑な条件**: `loading || isPending`のような複合条件は慎重に使用
- **パフォーマンス最適化の罠**: useTransitionの過度な使用は逆効果になることがある

### 最終解決策（2025-09-13）

#### 実施した修正

1. **fetchingRefによる二重実行防止**

   ```typescript
   const fetchingRef = useRef(false);

   if (fetchingRef.current && !isPolling) {
     console.log('[fetchPosts] Already fetching, skipping...');
     return;
   }
   fetchingRef.current = true;
   ```

2. **依存配列の完全な空配列化**
   - fetchPostsの依存配列を`[]`に設定
   - すべての値をrefで管理（typeRef, usernameRef, limitRef, sortByRef）

3. **fetchPostsRefの単純化**
   - useEffectを使わず直接更新
   - `fetchPostsRef.current = fetchPosts;`

4. **useTransitionの削除**
   - BoardPageClientからstartTransitionをすべて削除
   - `loading={loading || isPending}` → `loading={loading}`

#### 最終的な学び

- **React開発環境の二重レンダリング**: StrictModeがなくても開発環境では二重実行される
- **useCallbackの依存配列**: 空配列`[]`にしてrefパターンで値を参照するのが最も安定
- **複雑な最適化の罠**: useTransitionなどの最適化が逆に無限ループを引き起こすことがある
- **fetchingRefパターン**: 非同期処理の二重実行を防ぐ最も確実な方法
