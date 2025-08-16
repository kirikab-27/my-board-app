import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import FollowButton from '../FollowButton';

// モック設定
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// fetch のモック
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('FollowButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('未認証時は無効化されたボタンを表示', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn()
    });

    render(<FollowButton targetUserId="user123" />);

    const button = screen.getByRole('button', { name: /ログインしてフォロー/i });
    expect(button).toBeDisabled();
  });

  it('自分自身の場合はボタンを表示しない', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user123' } },
      status: 'authenticated',
      update: jest.fn()
    });

    const { container } = render(<FollowButton targetUserId="user123" />);
    expect(container.firstChild).toBeNull();
  });

  it('フォローしていない場合はフォローボタンを表示', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user123' } },
      status: 'authenticated',
      update: jest.fn()
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isFollowing: false,
        isPending: false,
        follow: null
      })
    } as Response);

    render(<FollowButton targetUserId="target123" />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /フォロー/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it('フォロー中の場合はフォロー中ボタンを表示', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user123' } },
      status: 'authenticated',
      update: jest.fn()
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isFollowing: true,
        isPending: false,
        follow: { id: 'follow123', isAccepted: true }
      })
    } as Response);

    render(<FollowButton targetUserId="target123" />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /フォロー中/i });
      expect(button).toBeInTheDocument();
    });
  });

  it('承認待ちの場合はリクエスト中ボタンを表示', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user123' } },
      status: 'authenticated',
      update: jest.fn()
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isFollowing: false,
        isPending: true,
        follow: { id: 'follow123', isPending: true }
      })
    } as Response);

    render(<FollowButton targetUserId="target123" />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /リクエスト中/i });
      expect(button).toBeInTheDocument();
    });
  });

  it('フォローボタンクリックでフォロー実行', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user123' } },
      status: 'authenticated',
      update: jest.fn()
    });

    // 初回フォロー状態取得
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isFollowing: false,
        isPending: false,
        follow: null
      })
    } as Response);

    // フォロー実行
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'フォローしました',
        follow: { id: 'follow123', isAccepted: true, isPending: false }
      })
    } as Response);

    const mockOnFollowChange = jest.fn();
    render(
      <FollowButton 
        targetUserId="target123" 
        onFollowChange={mockOnFollowChange}
      />
    );

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /フォロー/i });
      expect(button).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: /フォロー/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId: 'target123' }),
      });
    });

    await waitFor(() => {
      expect(mockOnFollowChange).toHaveBeenCalledWith(true, false);
    });
  });

  it('フォロー解除ボタンクリックでフォロー解除', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user123' } },
      status: 'authenticated',
      update: jest.fn()
    });

    // 初回フォロー状態取得（フォロー中）
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isFollowing: true,
        isPending: false,
        follow: { id: 'follow123', isAccepted: true }
      })
    } as Response);

    // フォロー解除実行
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'フォローを解除しました'
      })
    } as Response);

    const mockOnFollowChange = jest.fn();
    render(
      <FollowButton 
        targetUserId="target123" 
        onFollowChange={mockOnFollowChange}
      />
    );

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /フォロー中/i });
      expect(button).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: /フォロー中/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/follow?targetUserId=target123', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    await waitFor(() => {
      expect(mockOnFollowChange).toHaveBeenCalledWith(false, false);
    });
  });

  it('エラー時は適切に処理される', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user123' } },
      status: 'authenticated',
      update: jest.fn()
    });

    // 初回フォロー状態取得
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isFollowing: false,
        isPending: false,
        follow: null
      })
    } as Response);

    // フォロー実行でエラー
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'フォローに失敗しました'
      })
    } as Response);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<FollowButton targetUserId="target123" />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /フォロー/i });
      expect(button).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: /フォロー/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});