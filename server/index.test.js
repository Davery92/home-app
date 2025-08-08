const request = require('supertest');
const app = require('./index');

describe('root route', () => {
  it('responds with OK', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });
});

describe('authentication', () => {
  it('registers and logs in a user', async () => {
    await request(app)
      .post('/api/register')
      .send({ username: 'test', password: 'secret' })
      .expect(201);

    const res = await request(app)
      .post('/api/login')
      .send({ username: 'test', password: 'secret' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('blocks access to items without token', async () => {
    const res = await request(app).get('/api/items');
    expect(res.status).toBe(401);
  });
});
