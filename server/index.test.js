const request = require('supertest');
const app = require('./index');

describe('root route', () => {
  it('responds with OK', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });
});
