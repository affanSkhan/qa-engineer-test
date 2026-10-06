// Simple in-memory database for testing.
// A production deployment would use a durable transactional database.

export const db = {
  users: [],
  payments: [],
  sessions: [],
  table_orders: [],
  invoices: [],
  processed_webhooks: [],
};

export function initDatabase() {
  if (db.users.length > 0) return;

  db.users.push({
    id: "1",
    email: "merchant@test.com",
    password: "$2a$10$8Z3KxGXvGqJQZ.ZF9Z3KxGXvGqJQZ.ZF9Z3KxGXvGqJQZ.ZF9",
    business_name: "Test Merchant",
    type: "merchant",
    created_at: new Date(),
  });

  db.payments.push({
    id: "1",
    merchant_id: "1",
    amount: 25.5,
    currency: "EUR",
    status: "completed",
    customer_email: "customer1@test.com",
    created_at: new Date(),
  });

  db.payments.push({
    id: "2",
    merchant_id: "1",
    amount: 100.0,
    currency: "EUR",
    status: "pending",
    customer_email: "customer2@test.com",
    created_at: new Date(),
  });

  console.log("📊 Database initialized with test data");
}

export function findUserByEmail(email) {
  return db.users.find((u) => u.email === email);
}

export function findUserById(id) {
  return db.users.find((u) => u.id === id);
}

export function createUser(userData) {
  const newUser = {
    id: String(db.users.length + 1),
    ...userData,
    created_at: new Date(),
  };
  db.users.push(newUser);
  return newUser;
}

export function createPayment(paymentData) {
  const newPayment = {
    id: String(db.payments.length + 1),
    status: "pending",
    ...paymentData,
    created_at: new Date(),
  };
  db.payments.push(newPayment);
  return newPayment;
}

export function getPayments(merchantId) {
  return db.payments.filter((p) => p.merchant_id === merchantId);
}

export function getPaymentById(id) {
  return db.payments.find((p) => p.id === id);
}
