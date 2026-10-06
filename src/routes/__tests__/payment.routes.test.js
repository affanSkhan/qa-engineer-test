import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../../server.js';

async function getToken() {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'merchant@test.com', password: 'Test123!' });

  assert.strictEqual(response.status, 200);
  return response.body.token;
}

test('Bug A: GET /payments returns amount as a number', async () => {
  const token = await getToken();

  const response = await request(app)
    .get('/api/payments')
    .set('Authorization', `Bearer ${token}`);

  assert.strictEqual(response.status, 200);
  assert.strictEqual(typeof response.body.data[0].amount, 'number');
  assert.strictEqual(response.body.data[0].amount, 25.5);
});

test('Bug A: GET /payments/:id returns amount as a number', async () => {
  const token = await getToken();

  const response = await request(app)
    .get('/api/payments/1')
    .set('Authorization', `Bearer ${token}`);

  assert.strictEqual(response.status, 200);
  assert.strictEqual(typeof response.body.data.amount, 'number');
});

test('Bug B: POST /payments rejects amount above €50,000', async () => {
  const token = await getToken();

  const response = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      amount: 50000.01,
      currency: 'EUR',
      customer_email: 'customer@example.com'
    });

  assert.strictEqual(response.status, 400);
  assert.match(response.body.error, /maximum/i);
});

test('POST /payments accepts a valid payment', async () => {
  const token = await getToken();

  const response = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      amount: 99.99,
      currency: 'EUR',
      customer_email: 'customer@example.com'
    });

  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.body.data.amount, 99.99);
});

test('POST /payments rejects zero amount', async () => {
  const token = await getToken();

  const response = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      amount: 0,
      currency: 'EUR',
      customer_email: 'customer@example.com'
    });

  assert.strictEqual(response.status, 400);
});

test('POST /payments rejects unauthenticated requests', async () => {
  const response = await request(app)
    .post('/api/payments')
    .send({
      amount: 50,
      currency: 'EUR',
      customer_email: 'customer@example.com'
    });

  assert.strictEqual(response.status, 401);
});
