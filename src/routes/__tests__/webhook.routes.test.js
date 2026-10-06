import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../../server.js';
import { db } from '../../db/database.js';
import { buildSignature } from '../webhook.routes.js';

test('Bug D: invalid webhook signature is rejected', async () => {
  const payload = {
    payment_id: '1',
    status: 'failed',
    event_id: `evt-invalid-${Date.now()}`
  };

  const response = await request(app)
    .post('/api/webhooks/payment-status')
    .set('x-webhook-signature', '0'.repeat(64))
    .send(payload);

  assert.strictEqual(response.status, 401);
});

test('Bug D: valid webhook signature is accepted', async () => {
  const payload = {
    payment_id: '1',
    status: 'completed',
    event_id: `evt-valid-${Date.now()}`
  };

  const response = await request(app)
    .post('/api/webhooks/payment-status')
    .set('x-webhook-signature', buildSignature(payload))
    .send(payload);

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.new_status, 'completed');
});

test('Bug E: duplicate webhook event is idempotent', async () => {
  const eventId = `evt-duplicate-${Date.now()}`;
  const payload = {
    payment_id: '2',
    status: 'completed',
    event_id: eventId
  };

  const first = await request(app)
    .post('/api/webhooks/payment-status')
    .set('x-webhook-signature', buildSignature(payload))
    .send(payload);

  assert.strictEqual(first.status, 200);
  assert.strictEqual(db.processed_webhooks.filter(id => id === eventId).length, 1);

  const second = await request(app)
    .post('/api/webhooks/payment-status')
    .set('x-webhook-signature', buildSignature(payload))
    .send(payload);

  assert.strictEqual(second.status, 200);
  assert.match(second.body.message, /already processed/i);
  assert.strictEqual(db.processed_webhooks.filter(id => id === eventId).length, 1);
});

test('webhook rejects missing event_id', async () => {
  const payload = {
    payment_id: '1',
    status: 'completed'
  };

  const response = await request(app)
    .post('/api/webhooks/payment-status')
    .set('x-webhook-signature', buildSignature(payload))
    .send(payload);

  assert.strictEqual(response.status, 400);
});
