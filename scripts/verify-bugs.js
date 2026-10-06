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
  ["Bug A fixed", /amount:\s*Number\(p\.amount\)/.test(payment) && /amount:\s*Number\(payment\.amount\)/.test(payment)],
  ["Bug B fixed", /numericAmount\s*>\s*MAX_PAYMENT_AMOUNT/.test(payment)],
  ["Bug C fixed", /\.[^\s@]+\$/.test(auth) || /\\\.[^\\s@]+/.test(auth)],
  ["Bug D fixed", /timingSafeEqual/.test(webhook) && /createHmac\(['"]sha256['"]/.test(webhook)],
  ["Bug E fixed", /processed_webhooks\.includes/.test(webhook) && /processed_webhooks\.push/.test(webhook)],
  ["Bug F fixed", /existingOrder/.test(orders) && /status\s*===\s*['"]pending['"]/.test(orders)],
  ["Bug G fixed", /einvoice_status\s*===\s*['"]submitted['"]/.test(einvoice) && /einvoice_status\s*===\s*['"]accepted['"]/.test(einvoice)]
];

let passed = 0;
console.log("🔍 Verifying candidate fixes...\n");

for (const [name, ok] of checks) {
  console.log((ok ? "✅ " : "❌ ") + name);
  if (ok) passed++;
}

console.log("\n📊 Fixes verified: " + passed + "/" + checks.length);

if (passed !== checks.length) process.exit(1);
console.log("\n✅ All seven intentional bugs have corresponding fixes.");
