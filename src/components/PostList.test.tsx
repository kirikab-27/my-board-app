import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import PostList from './PostList';

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

describe('PostList', () => {
  const mockOnRefresh = jest.fn();
  const mockOnEditPost = jest.fn();

  const mockPosts = [
    {
      _id: '1',
      content: 'テスト投稿1\n改行を含む内容です',
      likes: 5,
      likedBy: ['192.168.1.1', '192.168.1.2'],
      createdAt: '2025-01-20T10:30:00.000Z',
      updatedAt: '2025-01-20T10:30:00.000Z'
    },
    {
      _id: '2',
      content: 'テスト投稿2',
      likes: 0,
      likedBy: [],
      createdAt: '2025-01-20T09:15:00.000Z',
      updatedAt: '2025-01-20T11:45:00.000Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('投稿一覧表示', () => {
    test('投稿が正しく表示される', () => {
      render(
        <TestWrapper>
          <PostList 
            posts={mockPosts}
            onRefresh={mockOnRefresh}
            onEditPost={mockOnEditPost}
          />
        </TestWrapper>
      );

      // 投稿内容が表示されることを確認（改行も含めた全体テキスト）
      expect(screen.getByText(/テスト投稿1.*改行を含む内容です/s)).toBeInTheDocument();
      expect(screen.getByText('テスト投稿2')).toBeInTheDocument();

      // 投稿日時が表示されることを確認（複数あるので getAllByText を使用）
      expect(screen.getAllByText(/投稿日時:/).length).toBeGreaterThan(0);
    });

    test('更新日時が投稿日時と異なる場合、更新日時も表示される', () => {
      render(
        <TestWrapper>
          <PostList 
            posts={mockPosts}
            onRefresh={mockOnRefresh}
            onEditPost={mockOnEditPost}
          />
        </TestWrapper>
      );

      // 2番目の投稿は更新されているので、更新日時が表示されることを確認
      expect(screen.getByText(/更新:/)).toBeInTheDocument();
    });

    test('投稿がない場合、メッセージが表示される', () => {
      render(
        <TestWrapper>
          <PostList 
            posts={[]}
            onRefresh={mockOnRefresh}
            onEditPost={mockOnEditPost}
          />
        </TestWrapper>
      );

      expect(screen.getByText('まだ投稿がありません')).toBeInTheDocument();
    });

    test('改行が正しく表示される', () => {
      render(
        <TestWrapper>
          <PostList 
            posts={mockPosts}
            onRefresh={mockOnRefresh}
            onEditPost={mockOnEditPost}
          />
        </TestWrapper>
      );

      // whiteSpace: 'pre-wrap'が設定されていることを確認
      const postContent = screen.getByText(/テスト投稿1.*改行を含む内容です/s);
      const styles = window.getComputedStyle(postContent);
      expect(styles.whiteSpace).toBe('pre-wrap');
    });
  });

  describe('メニュー操作', () => {
    test('メニューボタンをクリックすると編集・削除メニューが表示される', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PostList 
            posts={mockPosts}
            onRefresh={mockOnRefresh}
            onEditPost={mockOnEditPost}
          />
        </TestWrapper>
      );

      // 最初の投稿のメニューボタンをクリック
      const menuButtons = screen.getAllByRole('button');
      const firstMenuButton = menuButtons.find(button => 
        button.querySelector('svg') // MoreVertアイコンを持つボタン
      );

      expect(firstMenuButton).toBeInTheDocument();
      await user.click(firstMenuButton!);

      // メニューが表示されることを確認
      expect(screen.getByText('編集')).toBeInTheDocument();
      expect(screen.getByText('削除')).toBeInTheDocument();
    });

    test('編集メニューをクリックするとonEditPostが呼ばれる', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PostList 
            posts={mockPosts}
            onRefresh={mockOnRefresh}
            onEditPost={mockOnEditPost}
          />
        </TestWrapper>
      );

      // メニューを開く
      const menuButtons = screen.getAllByRole('button');
      const firstMenuButton = menuButtons.find(button => 
        button.querySelector('svg')
      );
      await user.click(firstMenuButton!);

      // 編集をクリック
      const editButton = screen.getByText('編集');
      await user.click(editButton);

      expect(mockOnEditPost).toHaveBeenCalledWith(mockPosts[0]);
    });
  });

  describe('削除機能', () => {
    test('削除メニューをクリックすると確認ダイアログが表示される', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PostList 
            posts={mockPosts}
            onRefresh={mockOnRefresh}
            onEditPost={mockOnEditPost}
          />
        </TestWrapper>
      );

      // メニューを開く
      const menuButtons = screen.getAllByRole('button');
      const firstMenuButton = menuButtons.find(button => 
        button.querySelector('svg')
      );
      await user.click(firstMenuButton!);

      // 削除をクリック
      const deleteButton = screen.getByText('削除');
      await user.click(deleteButton);

      // 確認ダイアログが表示されることを確認
      expect(screen.getByText('投稿を削除')).toBeInTheDocument();
      expect(screen.getByText('この投稿を削除してもよろしいですか？')).toBeInTheDocument();
      // ダイアログ内の投稿内容を確認（quotes付きのもの）
      expect(screen.getByText((content) => {
        return content.includes('"テスト投稿1') && content.includes('改行を含む内容です"');
      })).toBeInTheDocument();
    });

    test('削除確認ダイアログでキャンセルすると削除されない', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PostList 
            posts={mockPosts}
            onRefresh={mockOnRefresh}
            onEditPost={mockOnEditPost}
          />
        </TestWrapper>
      );

      // 削除ダイアログを開く
      const menuButtons = screen.getAllByRole('button');
      const firstMenuButton = menuButtons.find(button => 
        button.querySelector('svg')
      );
      await user.click(firstMenuButton!);
      await user.click(screen.getByText('削除'));

      // キャンセルボタンをクリック
      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      await user.click(cancelButton);

      // ダイアログが閉じることを確認
      await waitFor(() => {
        expect(screen.queryByText('投稿を削除')).not.toBeInTheDocument();
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('削除を確認すると削除APIが呼ばれる', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: '投稿を削除しました' })
      });

      render(
        <TestWrapper>
          <PostList 
            posts={mockPosts}
            onRefresh={mockOnRefresh}
            onEditPost={mockOnEditPost}
          />
        </TestWrapper>
      );

      // 削除ダイアログを開く
      const menuButtons = screen.getAllByRole('button');
      const firstMenuButton = menuButtons.find(button => 
        button.querySelector('svg')
      );
      await user.click(firstMenuButton!);
      await user.click(screen.getByText('削除'));

      // 削除確認ボタンをクリック
      const confirmButton = screen.getByRole('button', { name: '削除' });
      await user.click(confirmButton);

      // 削除APIが呼ばれることを確認
      expect(mockFetch).toHaveBeenCalledWith(`/api/posts/${mockPosts[0]._id}`, {
        method: 'DELETE',
      });

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalledTimes(1);
      });
    });

    test('削除API エラー時にエラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          error: '削除に失敗しました'
        })
      });

      render(
        <TestWrapper>
          <PostList 
            posts={mockPosts}
            onRefresh={mockOnRefresh}
            onEditPost={mockOnEditPost}
          />
        </TestWrapper>
      );

      // 削除を実行
      const menuButtons = screen.getAllByRole('button');
      const firstMenuButton = menuButtons.find(button => 
        button.querySelector('svg')
      );
      await user.click(firstMenuButton!);
      await user.click(screen.getByText('削除'));
      await user.click(screen.getByRole('button', { name: '削除' }));

      await waitFor(() => {
        expect(screen.getByText('削除に失敗しました')).toBeInTheDocument();
      });

      expect(mockOnRefresh).not.toHaveBeenCalled();
    });

    test('削除中はボタンが無効化される', async () => {
      const user = userEvent.setup();
      
      // レスポンスを遅延させる
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ message: '投稿を削除しました' })
          }), 100)
        )
      );

      render(
        <TestWrapper>
          <PostList 
            posts={mockPosts}
            onRefresh={mockOnRefresh}
            onEditPost={mockOnEditPost}
          />
        </TestWrapper>
      );

      // 削除を開始
      const menuButtons = screen.getAllByRole('button');
      const firstMenuButton = menuButtons.find(button => 
        button.querySelector('svg')
      );
      await user.click(firstMenuButton!);
      await user.click(screen.getByText('削除'));
      await user.click(screen.getByRole('button', { name: '削除' }));

      // 削除中はボタンが無効化されることを確認
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '削除中...' })).toBeDisabled();
      });

      // 削除完了後はダイアログが閉じることを確認
      await waitFor(() => {
        expect(screen.queryByText('投稿を削除')).not.toBeInTheDocument();
      });
    });
  });
});