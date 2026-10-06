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

test('Bug G: duplicate e-invoice submission is rejected', async () => {
  const token = await getToken();
  const invoiceId = `INV-TEST-${Date.now()}`;
  const payload = {
    invoice_id: invoiceId,
    customer_siret: '12345678901234'
  };

  const first = await request(app)
    .post('/api/einvoice/submit')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);

  assert.strictEqual(first.status, 200);

  const second = await request(app)
    .post('/api/einvoice/submit')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);

  assert.strictEqual(second.status, 409);
  assert.match(second.body.error, /already submitted/i);
});

test('e-invoice rejects invalid SIRET', async () => {
  const token = await getToken();

  const response = await request(app)
    .post('/api/einvoice/submit')
    .set('Authorization', `Bearer ${token}`)
    .send({
      invoice_id: `INV-SIRET-${Date.now()}`,
      customer_siret: '123'
    });

  assert.strictEqual(response.status, 400);
});

test('e-invoice status returns persisted submission data', async () => {
  const token = await getToken();
  const invoiceId = `INV-STATUS-${Date.now()}`;

  await request(app)
    .post('/api/einvoice/submit')
    .set('Authorization', `Bearer ${token}`)
    .send({
      invoice_id: invoiceId,
      customer_siret: '12345678901234'
    });

  const response = await request(app)
    .get('/api/einvoice/status/' + encodeURIComponent(invoiceId))
    .set('Authorization', `Bearer ${token}`);

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.data.einvoice_status, 'submitted');
  assert.ok(response.body.data.submission_id);
});
