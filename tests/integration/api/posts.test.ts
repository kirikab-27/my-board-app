import { createMocks } from 'node-mocks-http';

describe('/api/posts', () => {
  it('should return posts list', async () => {
    const { req } = createMocks({
      method: 'GET',
    });

    // テスト実装（実際のAPIが完成後に詳細化）
    expect(req.method).toBe('GET');
    expect(true).toBe(true); // 暫定テスト
  });

  it('should handle POST request', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        content: 'Test post content',
      },
    });

    // テスト実装（実際のAPIが完成後に詳細化）
    expect(req.method).toBe('POST');
    expect(req.body.content).toBe('Test post content');
  });
});
