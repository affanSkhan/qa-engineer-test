import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../../server.js';
import { db } from '../../db/database.js';

test('Bug F: duplicate pending table order is rejected', async () => {
  const merchantId = '1';
  const tableNumber = 7701;

  db.table_orders = (db.table_orders || []).filter(
    order => !(order.merchant_id === merchantId && order.table_number === tableNumber)
  );

  const payload = {
    merchant_id: merchantId,
    table_number: tableNumber,
    items: [{ name: 'Coffee', price: 5, quantity: 1 }]
  };

  const first = await request(app).post('/api/table-orders').send(payload);
  assert.strictEqual(first.status, 201);

  const second = await request(app).post('/api/table-orders').send(payload);
  assert.strictEqual(second.status, 409);
  assert.match(second.body.error, /pending order/i);
});

test('table order rejects an empty item list', async () => {
  const response = await request(app)
    .post('/api/table-orders')
    .send({
      merchant_id: '1',
      table_number: 7702,
      items: []
    });

  assert.strictEqual(response.status, 400);
});

test('table order calculates total correctly', async () => {
  const response = await request(app)
    .post('/api/table-orders')
    .send({
      merchant_id: '1',
      table_number: 7703,
      items: [{ name: 'Tea', price: 3.5, quantity: 2 }]
    });

  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.body.data.total, 7);
});
