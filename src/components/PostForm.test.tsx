import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import PostForm from './PostForm';

// テスト用のテーマ
const theme = createTheme();

// テスト用のWrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

// fetchのモック
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('PostForm', () => {
  const mockOnPostCreated = jest.fn();
  const mockOnEditCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('新規投稿モード', () => {
    test('初期状態で正しく表示される', () => {
      render(
        <TestWrapper>
          <PostForm onPostCreated={mockOnPostCreated} />
        </TestWrapper>
      );

      expect(screen.getByText('新しい投稿')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveValue('');
      expect(screen.getByText('0/200文字')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '投稿' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'キャンセル' })).not.toBeInTheDocument();
    });

    test('文字入力で文字数カウンターが更新される', () => {
      render(
        <TestWrapper>
          <PostForm onPostCreated={mockOnPostCreated} />
        </TestWrapper>
      );

      const textbox = screen.getByRole('textbox');
      fireEvent.change(textbox, { target: { value: 'テスト投稿' } });

      expect(screen.getByText('5/200文字')).toBeInTheDocument();
    });

    test('200文字超過時にエラー表示される', () => {
      const longText = 'あ'.repeat(201);

      render(
        <TestWrapper>
          <PostForm onPostCreated={mockOnPostCreated} />
        </TestWrapper>
      );

      const textbox = screen.getByRole('textbox');
      fireEvent.change(textbox, { target: { value: longText } });

      expect(screen.getByText('201/200文字')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '投稿' })).toBeDisabled();
    });

    test('空投稿時にバリデーションエラーが表示される', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PostForm onPostCreated={mockOnPostCreated} />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);

      expect(screen.getByText('投稿内容を入力してください')).toBeInTheDocument();
    });

    test('正常な投稿ができる', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          _id: '123',
          content: 'テスト投稿',
          createdAt: '2025-01-20T10:30:00.000Z',
          updatedAt: '2025-01-20T10:30:00.000Z'
        })
      });

      render(
        <TestWrapper>
          <PostForm onPostCreated={mockOnPostCreated} />
        </TestWrapper>
      );

      const textbox = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button', { name: '投稿' });

      // fireEventを使用して文字入力
      fireEvent.change(textbox, { target: { value: 'テスト投稿' } });
      await user.click(submitButton);

      // APIが正しく呼ばれることを確認
      expect(mockFetch).toHaveBeenCalledWith('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: 'テスト投稿' }),
      });

      await waitFor(() => {
        expect(mockOnPostCreated).toHaveBeenCalledTimes(1);
      });

      // フォームがクリアされることを確認
      expect(textbox).toHaveValue('');
    });

    test('API エラー時にエラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          error: 'サーバーエラーが発生しました'
        })
      });

      render(
        <TestWrapper>
          <PostForm onPostCreated={mockOnPostCreated} />
        </TestWrapper>
      );

      const textbox = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button', { name: '投稿' });

      fireEvent.change(textbox, { target: { value: 'テスト投稿' } });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('サーバーエラーが発生しました')).toBeInTheDocument();
      });

      // onPostCreatedが呼ばれないことを確認
      expect(mockOnPostCreated).not.toHaveBeenCalled();
    });
  });

  describe('編集モード', () => {
    const editingPost = {
      _id: '123',
      content: '既存の投稿内容',
      createdAt: '2025-01-20T10:30:00.000Z',
      updatedAt: '2025-01-20T10:30:00.000Z'
    };

    test('編集モードで正しく表示される', () => {
      render(
        <TestWrapper>
          <PostForm 
            onPostCreated={mockOnPostCreated}
            editingPost={editingPost}
            onEditCancel={mockOnEditCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByText('投稿を編集')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveValue('既存の投稿内容');
      expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });

    test('キャンセルボタンで編集をキャンセルできる', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PostForm 
            onPostCreated={mockOnPostCreated}
            editingPost={editingPost}
            onEditCancel={mockOnEditCancel}
          />
        </TestWrapper>
      );

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      await user.click(cancelButton);

      expect(mockOnEditCancel).toHaveBeenCalledTimes(1);
    });

    test('投稿の更新ができる', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ...editingPost,
          content: '更新された投稿内容',
          updatedAt: '2025-01-20T11:00:00.000Z'
        })
      });

      render(
        <TestWrapper>
          <PostForm 
            onPostCreated={mockOnPostCreated}
            editingPost={editingPost}
            onEditCancel={mockOnEditCancel}
          />
        </TestWrapper>
      );

      const textbox = screen.getByRole('textbox');
      const updateButton = screen.getByRole('button', { name: '更新' });

      // 内容を変更
      fireEvent.change(textbox, { target: { value: '更新された投稿内容' } });
      await user.click(updateButton);

      // PUT APIが正しく呼ばれることを確認
      expect(mockFetch).toHaveBeenCalledWith(`/api/posts/${editingPost._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: '更新された投稿内容' }),
      });

      await waitFor(() => {
        expect(mockOnPostCreated).toHaveBeenCalledTimes(1);
        expect(mockOnEditCancel).toHaveBeenCalledTimes(1);
      });
    });

    test('編集モードから新規モードに変更された時、フォームがクリアされる', () => {
      const { rerender } = render(
        <TestWrapper>
          <PostForm 
            onPostCreated={mockOnPostCreated}
            editingPost={editingPost}
            onEditCancel={mockOnEditCancel}
          />
        </TestWrapper>
      );

      // 編集モードの確認
      expect(screen.getByRole('textbox')).toHaveValue('既存の投稿内容');

      // 新規モードに変更
      rerender(
        <TestWrapper>
          <PostForm onPostCreated={mockOnPostCreated} />
        </TestWrapper>
      );

      // フォームがクリアされることを確認
      expect(screen.getByRole('textbox')).toHaveValue('');
      expect(screen.getByText('新しい投稿')).toBeInTheDocument();
    });
  });

  describe('ローディング状態', () => {
    test('送信中はボタンが無効化される', async () => {
      const user = userEvent.setup();
      
      // レスポンスを遅延させる
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ _id: '123', content: 'テスト' })
          }), 100)
        )
      );

      render(
        <TestWrapper>
          <PostForm onPostCreated={mockOnPostCreated} />
        </TestWrapper>
      );

      const textbox = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button', { name: '投稿' });

      fireEvent.change(textbox, { target: { value: 'テスト投稿' } });
      await user.click(submitButton);

      // 送信中はボタンが無効化されることを確認
      expect(screen.getByRole('button', { name: '投稿中...' })).toBeDisabled();

      // 送信完了後はボタンが有効化されることを確認
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '投稿' })).not.toBeDisabled();
      });
    });
  });
});