import { NextRequest } from 'next/server';
import { POST, DELETE, GET } from '../route';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Follow from '@/models/Follow';
import User from '@/models/User';

// モック設定
jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/models/Follow');
jest.mock('@/models/User');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockFollow = Follow as jest.Mocked<typeof Follow>;
const mockUser = User as jest.Mocked<typeof User>;

describe('/api/follow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/follow', () => {
    it('未認証ユーザーはフォローできない', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/follow', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: 'user123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('ログインが必要です');
    });

    it('自分自身をフォローしようとするとエラー', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      } as any);

      const request = new NextRequest('http://localhost:3000/api/follow', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: 'user123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('自分自身をフォローすることはできません');
    });

    it('存在しないユーザーをフォローしようとするとエラー', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      } as any);
      mockConnectDB.mockResolvedValue(undefined);
      mockUser.findById.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/follow', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: 'nonexistent' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('ユーザーが見つかりません');
    });

    it('正常にフォローできる', async () => {
      const mockTargetUser = {
        _id: 'target123',
        name: 'Target User',
        isPrivate: false
      };

      mockGetServerSession.mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      } as any);
      mockConnectDB.mockResolvedValue(undefined);
      mockUser.findById.mockResolvedValue(mockTargetUser);
      mockFollow.findOne.mockResolvedValue(null);

      const mockNewFollow = {
        _id: 'follow123',
        follower: 'user123',
        following: 'target123',
        isAccepted: true,
        isPending: false,
        save: jest.fn().mockResolvedValue(undefined),
        updateUserStats: jest.fn().mockResolvedValue(undefined)
      };

      mockFollow.mockImplementation(() => mockNewFollow as any);

      const request = new NextRequest('http://localhost:3000/api/follow', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: 'target123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('フォローしました');
      expect(data.follow).toBeDefined();
    });

    it('プライベートアカウントをフォローするとリクエスト送信', async () => {
      const mockTargetUser = {
        _id: 'target123',
        name: 'Private User',
        isPrivate: true
      };

      mockGetServerSession.mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      } as any);
      mockConnectDB.mockResolvedValue(undefined);
      mockUser.findById.mockResolvedValue(mockTargetUser);
      mockFollow.findOne.mockResolvedValue(null);

      const mockNewFollow = {
        _id: 'follow123',
        follower: 'user123',
        following: 'target123',
        isAccepted: false,
        isPending: true,
        save: jest.fn().mockResolvedValue(undefined),
        updateUserStats: jest.fn().mockResolvedValue(undefined)
      };

      mockFollow.mockImplementation(() => mockNewFollow as any);

      const request = new NextRequest('http://localhost:3000/api/follow', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: 'target123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('フォローリクエストを送信しました');
    });
  });

  describe('DELETE /api/follow', () => {
    it('未認証ユーザーはフォロー解除できない', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/follow?targetUserId=target123', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('ログインが必要です');
    });

    it('存在しないフォロー関係を解除しようとするとエラー', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      } as any);
      mockConnectDB.mockResolvedValue(undefined);
      mockFollow.findOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/follow?targetUserId=target123', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('フォロー関係が見つかりません');
    });

    it('正常にフォロー解除できる', async () => {
      const mockFollow = {
        _id: 'follow123',
        follower: 'user123',
        following: 'target123'
      };

      mockGetServerSession.mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      } as any);
      mockConnectDB.mockResolvedValue(undefined);
      Follow.findOne.mockResolvedValue(mockFollow as any);
      Follow.deleteOne.mockResolvedValue({ deletedCount: 1 } as any);

      const mockUser1 = { updateStats: jest.fn().mockResolvedValue(undefined) };
      const mockUser2 = { updateStats: jest.fn().mockResolvedValue(undefined) };
      User.findById.mockResolvedValueOnce(mockUser1 as any).mockResolvedValueOnce(mockUser2 as any);

      const request = new NextRequest('http://localhost:3000/api/follow?targetUserId=target123', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('フォローを解除しました');
    });
  });

  describe('GET /api/follow', () => {
    it('フォロー状態を正常に取得できる', async () => {
      const mockFollow = {
        _id: 'follow123',
        isAccepted: true,
        isPending: false
      };

      mockGetServerSession.mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      } as any);
      mockConnectDB.mockResolvedValue(undefined);
      mockFollow.findOne.mockResolvedValue(mockFollow);

      const request = new NextRequest('http://localhost:3000/api/follow?targetUserId=target123', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isFollowing).toBe(true);
      expect(data.isPending).toBe(false);
      expect(data.follow).toBeDefined();
    });

    it('フォロー関係がない場合', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      } as any);
      mockConnectDB.mockResolvedValue(undefined);
      mockFollow.findOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/follow?targetUserId=target123', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isFollowing).toBe(false);
      expect(data.isPending).toBe(false);
      expect(data.follow).toBe(null);
    });
  });
});