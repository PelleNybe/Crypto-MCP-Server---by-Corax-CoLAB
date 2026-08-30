const request = require('supertest');
const { app, server, db } = require('../server');

describe('Backend API Tests', () => {

  beforeAll((done) => {
    // Wait for sqlite tables to be created before tests run
    setTimeout(done, 1000);
  });

  afterAll((done) => {
    // Clean up
    server.close();
    db.close(); done();
  });

  test('POST /api/mcp should validate input', async () => {
    const res = await request(app).post('/api/mcp').set('Authorization', 'Bearer testpass').send({
      mcp: 'INVALID_MCP',
      method: 'test'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe('Unknown MCP endpoint');
  });

  test('GET /api/strategies should return a list of strategies', async () => {
    const res = await request(app).get('/api/strategies').set('Authorization', 'Bearer testpass');
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
