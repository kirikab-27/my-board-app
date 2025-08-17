import { NextRequest } from 'next/server';
import { PUT, DELETE } from './route';

// MongoDB接続とモデルをモック
jest.mock('@/lib/mongodb');
jest.mock('@/models/Post');
jest.mock('mongoose');

import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import mongoose from 'mongoose';

const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockPost = Post as jest.Mocked<typeof Post>;
const mockMongoose = mongoose as jest.Mocked<typeof mongoose>;

describe('/api/posts/[id]', () => {
  const validObjectId = '507f1f77bcf86cd799439011';
  const invalidObjectId = 'invalid-id';

  beforeEach(() => {
    jest.clearAllMocks();
    // mongoose.Types.ObjectId.isValidのモック
    mockMongoose.Types = {
      ObjectId: {
        isValid: jest.fn()
      }
    } as typeof mongoose.Types;
  });

  const createMockRequest = (body: Record<string, unknown>): NextRequest => {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  const createMockParams = (id: string) => ({ params: Promise.resolve({ id }) });

  describe('PUT /api/posts/[id]', () => {
    test('投稿を正常に更新できる', async () => {
      const requestBody = { content: '更新された投稿内容' };
      const mockUpdatedPost = {
        _id: validObjectId,
        content: '更新された投稿内容',
        createdAt: new Date('2025-01-20T10:30:00.000Z'),
        updatedAt: new Date('2025-01-20T12:00:00.000Z')
      };

      (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      mockDbConnect.mockResolvedValue(undefined);
      mockPost.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedPost);

      const request = createMockRequest(requestBody);
      const params = createMockParams(validObjectId);
      
      const response = await PUT(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockUpdatedPost);
      expect(mockDbConnect).toHaveBeenCalledTimes(1);
      expect(mockPost.findByIdAndUpdate).toHaveBeenCalledWith(
        validObjectId,
        { content: '更新された投稿内容' },
        { new: true, runValidators: true }
      );
    });

    test('無効なObjectIdで400エラーを返す', async () => {
      const requestBody = { content: '更新内容' };
      
      (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      const request = createMockRequest(requestBody);
      const params = createMockParams(invalidObjectId);
      
      const response = await PUT(request, params);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('無効な投稿IDです');
      expect(mockDbConnect).not.toHaveBeenCalled();
    });

    test('空の投稿内容で400エラーを返す', async () => {
      const requestBody = { content: '' };
      
      (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      const request = createMockRequest(requestBody);
      const params = createMockParams(validObjectId);
      
      const response = await PUT(request, params);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('投稿内容を入力してください');
    });

    test('空白のみの投稿内容で400エラーを返す', async () => {
      const requestBody = { content: '   ' };
      
      (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      const request = createMockRequest(requestBody);
      const params = createMockParams(validObjectId);
      
      const response = await PUT(request, params);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('投稿内容を入力してください');
    });

    test('201文字の投稿内容で400エラーを返す', async () => {
      const requestBody = { content: 'あ'.repeat(201) };
      
      (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      const request = createMockRequest(requestBody);
      const params = createMockParams(validObjectId);
      
      const response = await PUT(request, params);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('投稿は200文字以内で入力してください');
    });

    test('存在しない投稿IDで404エラーを返す', async () => {
      const requestBody = { content: '更新内容' };
      
      (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      mockDbConnect.mockResolvedValue(undefined);
      mockPost.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      const request = createMockRequest(requestBody);
      const params = createMockParams(validObjectId);
      
      const response = await PUT(request, params);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('投稿が見つかりません');
    });

    test('データベースエラー時に500エラーを返す', async () => {
      const requestBody = { content: '更新内容' };
      
      (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      mockDbConnect.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest(requestBody);
      const params = createMockParams(validObjectId);
      
      const response = await PUT(request, params);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('投稿の更新に失敗しました');
    });

    test('投稿内容の前後の空白が自動的に削除される', async () => {
      const requestBody = { content: '  更新された投稿内容  ' };
      const mockUpdatedPost = {
        _id: validObjectId,
        content: '更新された投稿内容'
      };

      (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      mockDbConnect.mockResolvedValue(undefined);
      mockPost.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedPost);

      const request = createMockRequest(requestBody);
      const params = createMockParams(validObjectId);
      
      const response = await PUT(request, params);

      expect(response.status).toBe(200);
      expect(mockPost.findByIdAndUpdate).toHaveBeenCalledWith(
        validObjectId,
        { content: '更新された投稿内容' },
        { new: true, runValidators: true }
      );
    });
  });

  describe('DELETE /api/posts/[id]', () => {
    test('投稿を正常に削除できる', async () => {
      const mockDeletedPost = {
        _id: validObjectId,
        content: '削除される投稿',
        createdAt: new Date('2025-01-20T10:30:00.000Z'),
        updatedAt: new Date('2025-01-20T10:30:00.000Z')
      };

      (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      mockDbConnect.mockResolvedValue(undefined);
      mockPost.findByIdAndDelete = jest.fn().mockResolvedValue(mockDeletedPost);

      const request = {} as NextRequest;
      const params = createMockParams(validObjectId);
      
      const response = await DELETE(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('投稿を削除しました');
      expect(mockDbConnect).toHaveBeenCalledTimes(1);
      expect(mockPost.findByIdAndDelete).toHaveBeenCalledWith(validObjectId);
    });

    test('無効なObjectIdで400エラーを返す', async () => {
      (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      const request = {} as NextRequest;
      const params = createMockParams(invalidObjectId);
      
      const response = await DELETE(request, params);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('無効な投稿IDです');
      expect(mockDbConnect).not.toHaveBeenCalled();
    });

    test('存在しない投稿IDで404エラーを返す', async () => {
      (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      mockDbConnect.mockResolvedValue(undefined);
      mockPost.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      const request = {} as NextRequest;
      const params = createMockParams(validObjectId);
      
      const response = await DELETE(request, params);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('投稿が見つかりません');
    });

    test('データベースエラー時に500エラーを返す', async () => {
      (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      mockDbConnect.mockRejectedValue(new Error('Database error'));

      const request = {} as NextRequest;
      const params = createMockParams(validObjectId);
      
      const response = await DELETE(request, params);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('投稿の削除に失敗しました');
    });

    test('削除処理エラー時に500エラーを返す', async () => {
      (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      mockDbConnect.mockResolvedValue(undefined);
      mockPost.findByIdAndDelete = jest.fn().mockRejectedValue(new Error('Delete failed'));

      const request = {} as NextRequest;
      const params = createMockParams(validObjectId);
      
      const response = await DELETE(request, params);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('投稿の削除に失敗しました');
    });
  });
});