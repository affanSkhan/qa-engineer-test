import express from 'express';
import crypto from 'crypto';
import { getPaymentById, db } from '../db/database.js';

const router = express.Router();
const WEBHOOK_SECRET = 'test-webhook-secret-key';

function buildSignature(payload) {
  return crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
}

router.post('/payment-status', (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];

    if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const expectedSignature = buildSignature(req.body);
    const provided = Buffer.from(signature, 'hex');
    const expected = Buffer.from(expectedSignature, 'hex');

    if (
      provided.length !== expected.length ||
      !crypto.timingSafeEqual(provided, expected)
    ) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { payment_id, status, event_id } = req.body;

    if (!payment_id || !status || !event_id) {
      return res.status(400).json({
        error: 'payment_id, status and event_id required'
      });
    }

    if (db.processed_webhooks.includes(event_id)) {
      return res.status(200).json({
        success: true,
        message: 'Webhook already processed',
        payment_id
      });
    }

    const payment = getPaymentById(payment_id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    payment.status = status;
    payment.webhook_received_at = new Date();

    db.processed_webhooks.push(event_id);

    res.status(200).json({
      success: true,
      message: 'Webhook processed',
      payment_id,
      new_status: status
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.post('/e-invoice', (req, res) => {
  try {
    const { invoice_id, status, submission_id, tax_authority_id } = req.body;

    if (!invoice_id || !status) {
      return res.status(400).json({ error: 'invoice_id and status required' });
    }

    const invoice = db.invoices?.find(inv => inv.id === invoice_id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    invoice.einvoice_status = status;
    invoice.einvoice_submission_id = submission_id;
    invoice.tax_authority_id = tax_authority_id;
    invoice.submitted_at = new Date();

    res.status(200).json({
      success: true,
      message: 'E-invoice webhook processed',
      invoice_id,
      status
    });
  } catch (error) {
    console.error('E-invoice webhook error:', error);
    res.status(500).json({ error: 'E-invoice webhook failed' });
  }
});

export { buildSignature };
export default router;
