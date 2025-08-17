/**
 * ミドルウェア認証設定のテスト
 */

import { getRouteConfig, hasRequiredRole, matchesPath } from '../auth-config';
import type { UserRole } from '@/types/auth';

describe('auth-config', () => {
  describe('matchesPath', () => {
    test('完全一致のパスをマッチ', () => {
      expect(matchesPath('/board', '/board')).toBe(true);
      expect(matchesPath('/dashboard', '/dashboard')).toBe(true);
      expect(matchesPath('/board', '/dashboard')).toBe(false);
    });

    test('プレフィックスマッチ', () => {
      expect(matchesPath('/admin/users', '/admin')).toBe(true);
      expect(matchesPath('/admin/security', '/admin')).toBe(true);
      expect(matchesPath('/profile/edit', '/profile')).toBe(true);
      expect(matchesPath('/other', '/admin')).toBe(false);
    });
  });

  describe('hasRequiredRole', () => {
    test('ロール階層の正しい判定', () => {
      // user権限必須
      expect(hasRequiredRole('user', 'user')).toBe(true);
      expect(hasRequiredRole('moderator', 'user')).toBe(true);
      expect(hasRequiredRole('admin', 'user')).toBe(true);

      // moderator権限必須
      expect(hasRequiredRole('user', 'moderator')).toBe(false);
      expect(hasRequiredRole('moderator', 'moderator')).toBe(true);
      expect(hasRequiredRole('admin', 'moderator')).toBe(true);

      // admin権限必須
      expect(hasRequiredRole('user', 'admin')).toBe(false);
      expect(hasRequiredRole('moderator', 'admin')).toBe(false);
      expect(hasRequiredRole('admin', 'admin')).toBe(true);
    });

    test('未定義ロールの処理', () => {
      expect(hasRequiredRole(undefined, 'user')).toBe(false);
      expect(hasRequiredRole('user' as UserRole, undefined as any)).toBe(true);
    });
  });

  describe('getRouteConfig', () => {
    test('保護ルートの設定取得', () => {
      const boardConfig = getRouteConfig('/board');
      expect(boardConfig?.type).toBe('protected');
      expect(boardConfig?.route).toBe('/board');
      expect(boardConfig?.config.requiredRole).toBe('user');

      const adminConfig = getRouteConfig('/admin/security');
      expect(adminConfig?.type).toBe('adminOnly');
    });

    test('ゲスト専用ルートの設定取得', () => {
      const loginConfig = getRouteConfig('/login');
      expect(loginConfig?.type).toBe('guestOnly');
      expect(loginConfig?.config.redirectTo).toBe('/board');

      const registerConfig = getRouteConfig('/register');
      expect(registerConfig?.type).toBe('guestOnly');
    });

    test('公開ルートの設定取得', () => {
      const homeConfig = getRouteConfig('/');
      expect(homeConfig?.type).toBe('public');

      const aboutConfig = getRouteConfig('/about');
      expect(aboutConfig?.type).toBe('public');
    });

    test('未設定ルートの処理', () => {
      const unknownConfig = getRouteConfig('/unknown-path');
      expect(unknownConfig).toBeNull();
    });
  });

  describe('ルート設定の一貫性', () => {
    test('すべての保護ルートに設定が存在', () => {
      const protectedPaths = ['/board', '/dashboard', '/profile', '/settings'];
      
      protectedPaths.forEach(path => {
        const config = getRouteConfig(path);
        expect(config).not.toBeNull();
        expect(config?.type).toBe('protected');
      });
    });

    test('管理者ルートの設定', () => {
      const adminPaths = ['/admin', '/admin/security', '/admin/users'];
      
      adminPaths.forEach(path => {
        const config = getRouteConfig(path);
        expect(config).not.toBeNull();
        expect(config?.type).toBe('adminOnly');
      });
    });

    test('ゲスト専用ルートのリダイレクト設定', () => {
      const guestPaths = ['/login', '/register'];
      
      guestPaths.forEach(path => {
        const config = getRouteConfig(path);
        expect(config).not.toBeNull();
        expect(config?.type).toBe('guestOnly');
        expect(config?.config.redirectTo).toBeDefined();
      });
    });
  });
});