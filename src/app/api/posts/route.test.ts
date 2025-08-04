import { NextRequest } from 'next/server';
import { GET, POST } from './route';

// MongoDB接続とモデルをモック
jest.mock('@/lib/mongodb');
jest.mock('@/models/Post');

import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';

const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockPost = Post as jest.Mocked<typeof Post>;

describe('/api/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/posts', () => {
    test('投稿一覧を正しく取得できる', async () => {
      const mockPosts = [
        {
          _id: '1',
          content: 'テスト投稿1',
          createdAt: new Date('2025-01-20T10:30:00.000Z'),
          updatedAt: new Date('2025-01-20T10:30:00.000Z')
        },
        {
          _id: '2',
          content: 'テスト投稿2',
          createdAt: new Date('2025-01-20T09:15:00.000Z'),
          updatedAt: new Date('2025-01-20T09:15:00.000Z')
        }
      ];

      mockDbConnect.mockResolvedValue(undefined);
      mockPost.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockPosts)
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPosts);
      expect(mockDbConnect).toHaveBeenCalledTimes(1);
      expect(mockPost.find).toHaveBeenCalledWith({});
    });

    test('データベース接続エラー時に500エラーを返す', async () => {
      mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('投稿の取得に失敗しました');
    });

    test('クエリ実行エラー時に500エラーを返す', async () => {
      mockDbConnect.mockResolvedValue(undefined);
      mockPost.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Query failed'))
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('投稿の取得に失敗しました');
    });

    test('投稿が存在しない場合、空配列を返す', async () => {
      mockDbConnect.mockResolvedValue(undefined);
      mockPost.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });
  });

  describe('POST /api/posts', () => {
    const createMockRequest = (body: Record<string, unknown>): NextRequest => {
      return {
        json: jest.fn().mockResolvedValue(body),
      } as unknown as NextRequest;
    };

    test('正常な投稿を作成できる', async () => {
      const requestBody = { content: 'テスト投稿' };
      const mockCreatedPost = {
        _id: '123',
        content: 'テスト投稿',
        createdAt: new Date('2025-01-20T10:30:00.000Z'),
        updatedAt: new Date('2025-01-20T10:30:00.000Z'),
        save: jest.fn().mockResolvedValue(true)
      };

      mockDbConnect.mockResolvedValue(undefined);
      mockPost.mockImplementation(() => mockCreatedPost);

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockCreatedPost);
      expect(mockDbConnect).toHaveBeenCalledTimes(1);
      expect(mockPost).toHaveBeenCalledWith({ content: 'テスト投稿' });
      expect(mockCreatedPost.save).toHaveBeenCalledTimes(1);
    });

    test('空の投稿で400エラーを返す', async () => {
      const requestBody = { content: '' };
      const request = createMockRequest(requestBody);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('投稿内容を入力してください');
      expect(mockDbConnect).not.toHaveBeenCalled();
    });

    test('空白のみの投稿で400エラーを返す', async () => {
      const requestBody = { content: '   ' };
      const request = createMockRequest(requestBody);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('投稿内容を入力してください');
    });

    test('201文字の投稿で400エラーを返す', async () => {
      const requestBody = { content: 'あ'.repeat(201) };
      const request = createMockRequest(requestBody);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('投稿は200文字以内で入力してください');
    });

    test('200文字ちょうどの投稿は成功する', async () => {
      const content = 'あ'.repeat(200);
      const requestBody = { content };
      const mockCreatedPost = {
        _id: '123',
        content,
        save: jest.fn().mockResolvedValue(true)
      };

      mockDbConnect.mockResolvedValue(undefined);
      mockPost.mockImplementation(() => mockCreatedPost);

      const request = createMockRequest(requestBody);
      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(mockPost).toHaveBeenCalledWith({ content });
    });

    test('contentプロパティが存在しない場合、400エラーを返す', async () => {
      const requestBody = {};
      const request = createMockRequest(requestBody);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('投稿内容を入力してください');
    });

    test('データベース接続エラー時に500エラーを返す', async () => {
      const requestBody = { content: 'テスト投稿' };
      mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('投稿の作成に失敗しました');
    });

    test('投稿保存エラー時に500エラーを返す', async () => {
      const requestBody = { content: 'テスト投稿' };
      const mockCreatedPost = {
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };

      mockDbConnect.mockResolvedValue(undefined);
      mockPost.mockImplementation(() => mockCreatedPost);

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('投稿の作成に失敗しました');
    });

    test('JSON パースエラー時に500エラーを返す', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('投稿の作成に失敗しました');
    });

    test('投稿内容の前後の空白が自動的に削除される', async () => {
      const requestBody = { content: '  テスト投稿  ' };
      const mockCreatedPost = {
        _id: '123',
        content: 'テスト投稿',
        save: jest.fn().mockResolvedValue(true)
      };

      mockDbConnect.mockResolvedValue(undefined);
      mockPost.mockImplementation(() => mockCreatedPost);

      const request = createMockRequest(requestBody);
      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(mockPost).toHaveBeenCalledWith({ content: 'テスト投稿' });
    });
  });
});