describe('Sample Test', () => {
  it('should pass basic test', () => {
    const result = 2 + 2;
    expect(result).toBe(4);
  });

  it('should test string operations', () => {
    const text = 'Hello World';
    expect(text).toContain('World');
  });

  it('should test array operations', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });
});
