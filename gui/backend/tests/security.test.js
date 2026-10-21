const request = require('supertest');
const { app, db } = require('../server');

describe('Security limits', () => {
  it('should reject large arrays in POST /api/strategies', async () => {
    const nodes = new Array(5001).fill({ id: 1 });
    const connections = [];
    const res = await request(app)
      .post('/api/strategies')
      .send({ name: 'Test', nodes, connections, active: false })
      .set('Authorization', `Bearer ${process.env.DASHBOARD_PASSWORD}`);
    expect([400, 413]).toContain(res.status);
    // expect(res.body.error).toMatch(/too large/);
  });
});
