/**
 * useRequireAuth フックのテスト
 * Jest + React Testing Library
 */

import { renderHook, act } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useRequireAuth } from '../useRequireAuth';
import type { AuthUser } from '@/types/auth';

// モック
jest.mock('next-auth/react');
jest.mock('next/navigation');

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn()
};

const mockUser: AuthUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  emailVerified: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('useRequireAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter as any);
    mockUsePathname.mockReturnValue('/test-page');
  });

  describe('基本的な認証チェック', () => {
    test('認証済みユーザーの場合、正常な値を返す', () => {
      mockUseSession.mockReturnValue({
        data: { user: mockUser },
        status: 'authenticated',
        update: jest.fn()
      } as any);

      const { result } = renderHook(() => useRequireAuth());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.hasRequiredPermission).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.error).toBe(null);
    });

    test('未認証ユーザーの場合、ログインページにリダイレクト', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      } as any);

      renderHook(() => useRequireAuth());

      expect(mockRouter.push).toHaveBeenCalledWith(
        '/login?callbackUrl=%2Ftest-page'
      );
    });

    test('ローディング中は適切な状態を返す', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn()
      } as any);

      const { result } = renderHook(() => useRequireAuth());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('権限レベルチェック', () => {
    test('管理者権限が必要な場合、一般ユーザーは権限不足', () => {
      mockUseSession.mockReturnValue({
        data: { user: { ...mockUser, role: 'user' } },
        status: 'authenticated',
        update: jest.fn()
      } as any);

      const { result } = renderHook(() => 
        useRequireAuth({ requiredRole: 'admin' })
      );

      expect(result.current.hasRequiredPermission).toBe(false);
      expect(result.current.error).toBe('insufficient_permissions');
      expect(mockRouter.push).toHaveBeenCalledWith('/unauthorized');
    });

    test('管理者ユーザーは管理者権限を持つ', () => {
      mockUseSession.mockReturnValue({
        data: { user: { ...mockUser, role: 'admin' } },
        status: 'authenticated',
        update: jest.fn()
      } as any);

      const { result } = renderHook(() => 
        useRequireAuth({ requiredRole: 'admin' })
      );

      expect(result.current.hasRequiredPermission).toBe(true);
      expect(result.current.error).toBe(null);
    });
  });

  describe('メール認証チェック', () => {
    test('メール未認証の場合、認証ページにリダイレクト', () => {
      mockUseSession.mockReturnValue({
        data: { user: { ...mockUser, emailVerified: null } },
        status: 'authenticated',
        update: jest.fn()
      } as any);

      renderHook(() => 
        useRequireAuth({ requireEmailVerified: true })
      );

      expect(mockRouter.push).toHaveBeenCalledWith('/auth/verify-email');
    });
  });

  describe('カスタムチェック', () => {
    test('カスタムチェックが失敗した場合、アクセス拒否', () => {
      mockUseSession.mockReturnValue({
        data: { user: mockUser },
        status: 'authenticated',
        update: jest.fn()
      } as any);

      const customCheck = jest.fn().mockReturnValue(false);

      renderHook(() => 
        useRequireAuth({ customCheck })
      );

      expect(customCheck).toHaveBeenCalledWith(mockUser);
      expect(mockRouter.push).toHaveBeenCalledWith('/access-denied');
    });
  });

  describe('コールバック', () => {
    test('権限不足時にonUnauthorizedが呼ばれる', () => {
      const onUnauthorized = jest.fn();
      
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      } as any);

      renderHook(() => 
        useRequireAuth({ onUnauthorized })
      );

      expect(onUnauthorized).toHaveBeenCalledWith('not_authenticated');
    });

    test('ローディング時にonLoadingが呼ばれる', () => {
      const onLoading = jest.fn();
      
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn()
      } as any);

      renderHook(() => 
        useRequireAuth({ onLoading })
      );

      expect(onLoading).toHaveBeenCalled();
    });
  });

  describe('ユーティリティ機能', () => {
    test('recheckAuth で認証状態を再チェック', () => {
      mockUseSession.mockReturnValue({
        data: { user: mockUser },
        status: 'authenticated',
        update: jest.fn()
      } as any);

      const { result } = renderHook(() => useRequireAuth());

      act(() => {
        result.current.recheckAuth();
      });

      expect(result.current.error).toBe(null);
    });

    test('refreshSession でセッションを更新', async () => {
      const mockUpdate = jest.fn();
      
      mockUseSession.mockReturnValue({
        data: { user: mockUser },
        status: 'authenticated',
        update: mockUpdate
      } as any);

      const { result } = renderHook(() => useRequireAuth());

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(mockUpdate).toHaveBeenCalled();
    });
  });
});