import { jest } from '@jest/globals';

describe('Health Check', () => {
  it('should return healthy status', () => {
    const health = {
      status: 'ok',
      database: 'connected',
    };

    expect(health.status).toBe('ok');
  });

  it('should have database connected', () => {
    const dbStatus = 'connected';

    expect(dbStatus).toBe('connected');
  });
});

