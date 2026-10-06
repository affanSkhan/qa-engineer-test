import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { createPayment, getPayments, getPaymentById } from '../db/database.js';

const router = express.Router();
const MAX_PAYMENT_AMOUNT = 50000;

router.get('/', authenticate, (req, res) => {
  try {
    const payments = getPayments(req.user.id);

    // Fix Bug A: payment amounts must remain numeric for API consumers.
    const formattedPayments = payments.map(p => ({
      id: p.id,
      amount: Number(p.amount),
      currency: p.currency,
      status: p.status,
      customer_email: p.customer_email,
      created_at: p.created_at
    }));

    res.json({ success: true, data: formattedPayments, count: formattedPayments.length });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

router.get('/:id', authenticate, (req, res) => {
  try {
    const payment = getPaymentById(req.params.id);

    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.merchant_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    res.json({
      success: true,
      data: {
        id: payment.id,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        customer_email: payment.customer_email,
        created_at: payment.created_at
      }
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

router.post('/', authenticate, (req, res) => {
  try {
    const { amount, currency, customer_email } = req.body;
    const numericAmount = Number(amount);

    if (
      amount === undefined ||
      amount === null ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Fix Bug B: reject transactions above the assignment's €50,000 limit.
    if (numericAmount > MAX_PAYMENT_AMOUNT) {
      return res.status(400).json({
        error: `Amount exceeds maximum of €${MAX_PAYMENT_AMOUNT}`
      });
    }

    if (!currency || !['EUR', 'USD', 'GBP'].includes(currency)) {
      return res.status(400).json({ error: 'Valid currency is required (EUR, USD, GBP)' });
    }

    if (!customer_email || !customer_email.includes('@')) {
      return res.status(400).json({ error: 'Valid customer email is required' });
    }

    const payment = createPayment({
      merchant_id: req.user.id,
      amount: numericAmount,
      currency,
      customer_email,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Payment created',
      data: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        customer_email: payment.customer_email
      }
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

export default router;
