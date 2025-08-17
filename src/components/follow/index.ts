// フォロー機能のコンポーネントをまとめてエクスポート
export { default as FollowButton } from './FollowButton';
export { default as FollowStats } from './FollowStats';
export { default as FollowList } from './FollowList';

// 型定義のエクスポート（型定義は個別ファイルで定義）

// フォロー機能のユーティリティ型
export interface FollowRelationship {
  isFollowing: boolean;
  isPending: boolean;
  isMutual: boolean;
  followedAt: string | null;
}

export interface FollowUser {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  followedAt: string;
  isAccepted: boolean;
}

export interface FollowStats {
  followerCount: number;
  followingCount: number;
  mutualFollowsCount: number;
  relationship?: FollowRelationship | null;
}