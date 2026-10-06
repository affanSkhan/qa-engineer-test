import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../../server.js';

test('Bug C: registration rejects email without TLD', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: `candidate-${Date.now()}@domain`,
      password: 'SecurePass123!',
      business_name: 'QA Test Merchant'
    });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(response.body.error, 'Invalid email format');
});

test('registration accepts a valid email', async () => {
  const email = `candidate-${Date.now()}@example.com`;

  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password: 'SecurePass123!',
      business_name: 'QA Test Merchant'
    });

  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.body.user.email, email);
  assert.ok(response.body.token);
});

test('login succeeds with seeded credentials', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'merchant@test.com',
      password: 'Test123!'
    });

  assert.strictEqual(response.status, 200);
  assert.ok(response.body.token);
});

test('login rejects incorrect credentials', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'merchant@test.com',
      password: 'wrong-password'
    });

  assert.strictEqual(response.status, 401);
});
