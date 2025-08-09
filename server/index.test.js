const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  app = require('./index');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

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

describe('items API', () => {
  let token;

  beforeAll(async () => {
    await request(app)
      .post('/api/register')
      .send({ username: 'itemuser', password: 'pass' })
      .expect(201);

    const res = await request(app)
      .post('/api/login')
      .send({ username: 'itemuser', password: 'pass' });
    token = res.body.token;
  });

  it('creates and lists items for authenticated users', async () => {
    await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Milk' })
      .expect(201);

    const res = await request(app)
      .get('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Milk');
  });
});

