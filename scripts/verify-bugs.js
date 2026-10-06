#!/usr/bin/env node
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const payment = readFileSync(join(root, "src/routes/payment.routes.js"), "utf8");
const auth = readFileSync(join(root, "src/routes/auth.routes.js"), "utf8");
const webhook = readFileSync(join(root, "src/routes/webhook.routes.js"), "utf8");
const orders = readFileSync(join(root, "src/routes/table-order.routes.js"), "utf8");
const einvoice = readFileSync(join(root, "src/routes/einvoice.routes.js"), "utf8");

const checks = [
  [
    "Bug A fixed",
    payment.includes("amount: Number(p.amount)") &&
      payment.includes("amount: Number(payment.amount)")
  ],
  [
    "Bug B fixed",
    payment.includes("numericAmount > MAX_PAYMENT_AMOUNT")
  ],
  [
    "Bug C fixed",
    auth.includes("@[^\\s@]+\\.[^\\s@]{2,}$")
  ],
  [
    "Bug D fixed",
    webhook.includes("timingSafeEqual") &&
      webhook.includes("createHmac('sha256'")
  ],
  [
    "Bug E fixed",
    webhook.includes("processed_webhooks.includes") &&
      webhook.includes("processed_webhooks.push")
  ],
  [
    "Bug F fixed",
    orders.includes("existingOrder") &&
      orders.includes("status === 'pending'")
  ],
  [
    "Bug G fixed",
    einvoice.includes("invoice.einvoice_status === 'submitted'") &&
      einvoice.includes("invoice.einvoice_status === 'accepted'")
  ]
];

let passed = 0;

console.log("🔍 Verifying candidate fixes...\n");

for (const [name, ok] of checks) {
  console.log((ok ? "✅ " : "❌ ") + name);
  if (ok) passed++;
}

console.log("\n📊 Fixes verified: " + passed + "/" + checks.length);

if (passed !== checks.length) {
  process.exit(1);
}

console.log("\n✅ All seven intentional bugs have corresponding fixes.");
