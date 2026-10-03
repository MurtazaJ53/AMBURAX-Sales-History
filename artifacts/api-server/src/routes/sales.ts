import { randomUUID } from "node:crypto";
import { desc, eq, inArray } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, saleItems, salePayments, sales, stores } from "@workspace/db";

const router: IRouter = Router();
const dateTime = (value: Date) => new Intl.DateTimeFormat("en-IN", {
  day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  hour12: true, timeZone: "Asia/Kolkata",
}).format(value);

router.get("/sales", async (_req, res) => {
  const rows = await db.select({
    id: sales.id, billNo: sales.billNo, soldAt: sales.soldAt, customer: sales.customerName,
    amount: sales.totalAmount, status: sales.status, type: sales.type,
  }).from(sales).orderBy(desc(sales.soldAt)).limit(200);
  if (!rows.length) return res.json([]);

  const ids = rows.map((row) => row.id);
  const [items, payments] = await Promise.all([
    db.select({ saleId: saleItems.saleId, name: saleItems.productName, sku: saleItems.sku, quantity: saleItems.quantity })
      .from(saleItems).where(inArray(saleItems.saleId, ids)),
    db.select({ saleId: salePayments.saleId, method: salePayments.method })
      .from(salePayments).where(inArray(salePayments.saleId, ids)),
  ]);
  const itemsBySale = new Map<string, typeof items>();
  const paymentsBySale = new Map<string, string[]>();
  for (const item of items) itemsBySale.set(item.saleId, [...(itemsBySale.get(item.saleId) ?? []), item]);
  for (const payment of payments) paymentsBySale.set(payment.saleId, [...(paymentsBySale.get(payment.saleId) ?? []), payment.method]);

  return res.json(rows.map((row) => {
    const saleItemsForRow = itemsBySale.get(row.id) ?? [];
    const methods = [...new Set(paymentsBySale.get(row.id) ?? [])];
    return {
      id: row.id, billNo: row.billNo, dateTime: dateTime(row.soldAt), customer: row.customer,
      itemsCount: saleItemsForRow.reduce((sum, item) => sum + item.quantity, 0),
      amount: row.amount, paymentMode: methods.length > 1 ? "Split" : (methods[0] ?? "—"),
      status: row.status, type: row.type,
      searchable: [row.billNo, row.customer, ...saleItemsForRow.flatMap((item) => [item.name, item.sku])].join(" ").toLowerCase(),
    };
  }));
});

router.get("/sales/:billNo/receipt", async (req, res) => {
  const [row] = await db.select({
    id: sales.id, billNo: sales.billNo, invoiceNo: sales.invoiceNo, soldAt: sales.soldAt,
    cashierName: sales.cashierName, salesPersonName: sales.salesPersonName,
    customerName: sales.customerName, customerPhone: sales.customerPhone,
    status: sales.status, subtotal: sales.subtotal, itemDiscount: sales.itemDiscount,
    gstRate: sales.gstRate, gstAmount: sales.gstAmount, totalAmount: sales.totalAmount,
    storeName: stores.name, storeCode: stores.storeCode, storeAddress: stores.address,
    storeCity: stores.city, storeState: stores.state, storePostalCode: stores.postalCode, storeGstin: stores.gstin,
  }).from(sales).innerJoin(stores, eq(sales.storeId, stores.id))
    .where(eq(sales.billNo, String(req.params.billNo))).limit(1);

  if (!row) return res.status(404).json({ error: "No saved sale was found for that bill number." });

  const [items, payments] = await Promise.all([
    db.select({ id: saleItems.id, name: saleItems.productName, sku: saleItems.sku, variant: saleItems.variant,
      image: saleItems.imageKey, quantity: saleItems.quantity, price: saleItems.unitPrice, total: saleItems.lineTotal })
      .from(saleItems).where(eq(saleItems.saleId, row.id)),
    db.select({ method: salePayments.method, reference: salePayments.reference, amount: salePayments.amount })
      .from(salePayments).where(eq(salePayments.saleId, row.id)),
  ]);
  const firstPayment = payments[0];
  const soldAt = row.soldAt.toISOString();
  return res.json({
    id: row.id, billNo: row.billNo, invoiceNo: row.invoiceNo, soldAt, dateTime: dateTime(row.soldAt),
    cashier: row.cashierName, cashierName: row.cashierName, salesPerson: row.salesPersonName,
    customer: { name: row.customerName, phone: row.customerPhone ?? "" },
    store: { name: row.storeName, storeCode: row.storeCode, address: row.storeAddress,
      city: row.storeCity, state: row.storeState, postalCode: row.storePostalCode, gstin: row.storeGstin },
    items, subtotal: row.subtotal, discount: row.itemDiscount, itemDiscount: row.itemDiscount,
    gst: row.gstAmount, gstAmount: row.gstAmount, gstRate: row.gstRate,
    total: row.totalAmount, totalAmount: row.totalAmount, status: row.status,
    paymentMethod: firstPayment?.method ?? "—", transactionId: firstPayment?.reference ?? "—",
    paymentAmount: payments.reduce((sum, payment) => sum + payment.amount, 0), payments,
  });
});



router.post("/sales", async (req, res) => {
  const payload = req.body as Record<string, unknown> | null;
  const storeId = typeof payload?.storeId === "string" ? payload.storeId : "";
  const cashierName = typeof payload?.cashierName === "string" ? payload.cashierName.trim() : "";
  const rawItems = Array.isArray(payload?.items) ? payload.items : [];
  const rawPayments = Array.isArray(payload?.payments) ? payload.payments : [];
  const gstRate = Number(payload?.gstRate);
  const itemDiscount = Number(payload?.itemDiscount ?? 0);
  const soldAt = payload?.soldAt ? new Date(String(payload.soldAt)) : new Date();

  if (!/^[0-9a-f-]{36}$/i.test(storeId) || !cashierName || !rawItems.length || !rawPayments.length ||
      !Number.isFinite(gstRate) || gstRate < 0 || gstRate > 100 || !Number.isFinite(itemDiscount) || itemDiscount < 0 ||
      Number.isNaN(soldAt.getTime())) {
    return res.status(400).json({ error: "Provide a store, cashier, sale items, payment lines, valid GST rate, and a non-negative discount." });
  }

  const items: { productName: string; sku: string; variant: string | null; imageKey: string; quantity: number; unitPrice: number; lineTotal: number }[] = [];
  for (const raw of rawItems) {
    if (!raw || typeof raw !== "object") return res.status(400).json({ error: "Each sale item must be an object." });
    const item = raw as Record<string, unknown>;
    const productName = typeof item.name === "string" ? item.name.trim() : "";
    const sku = typeof item.sku === "string" ? item.sku.trim() : "";
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    if (!productName || !sku || !Number.isInteger(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
      return res.status(400).json({ error: "Each item needs a name, SKU, positive quantity, and non-negative unit price." });
    }
    const lineTotal = Math.round(quantity * unitPrice * 100) / 100;
    items.push({ productName, sku, variant: typeof item.variant === "string" ? item.variant : null,
      imageKey: typeof item.image === "string" ? item.image : "shirt", quantity, unitPrice, lineTotal });
  }

  const payments: { method: "UPI" | "Card" | "Cash" | "Wallet"; reference: string | null; amount: number }[] = [];
  for (const raw of rawPayments) {
    if (!raw || typeof raw !== "object") return res.status(400).json({ error: "Each payment line must be an object." });
    const payment = raw as Record<string, unknown>;
    const method = payment.method;
    const amount = Number(payment.amount);
    if (method !== "UPI" && method !== "Card" && method !== "Cash" && method !== "Wallet") {
      return res.status(400).json({ error: "Payment method must be UPI, Card, Cash, or Wallet." });
    }
    if (!Number.isFinite(amount) || amount < 0) return res.status(400).json({ error: "Payment amounts must be non-negative numbers." });
    payments.push({ method, reference: typeof payment.reference === "string" ? payment.reference : null, amount });
  }

  const subtotalPaise = items.reduce((sum, item) => sum + Math.round(item.lineTotal * 100), 0);
  const discountPaise = Math.round(itemDiscount * 100);
  if (discountPaise > subtotalPaise) return res.status(400).json({ error: "Discount cannot exceed the sale subtotal." });
  const gstPaise = Math.round((subtotalPaise - discountPaise) * gstRate / 100);
  const totalPaise = subtotalPaise - discountPaise + gstPaise;
  const paidPaise = payments.reduce((sum, payment) => sum + Math.round(payment.amount * 100), 0);
  if (paidPaise !== totalPaise) return res.status(400).json({ error: "Payment lines must add up exactly to the sale total." });

  const [store] = await db.select({ id: stores.id }).from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store) return res.status(400).json({ error: "The selected store does not exist." });
  const billNo = typeof payload?.billNo === "string" && payload.billNo.trim()
    ? payload.billNo.trim()
    : "POS-" + randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
  const invoiceNo = typeof payload?.invoiceNo === "string" ? payload.invoiceNo : null;
  const customerName = typeof payload?.customerName === "string" && payload.customerName.trim() ? payload.customerName.trim() : "Walk-in Customer";
  const customerPhone = typeof payload?.customerPhone === "string" ? payload.customerPhone : null;
  const salesPersonName = typeof payload?.salesPersonName === "string" ? payload.salesPersonName : null;

  const saleId = await db.transaction(async (tx) => {
    const [saved] = await tx.insert(sales).values({
      billNo, invoiceNo, storeId, soldAt, cashierName,
      salesPersonName, customerName, customerPhone, status: "Paid", type: "Sale",
      subtotal: subtotalPaise / 100, itemDiscount: discountPaise / 100,
      gstRate, gstAmount: gstPaise / 100, totalAmount: totalPaise / 100,
    }).returning({ id: sales.id });
    await tx.insert(saleItems).values(items.map((item) => ({ ...item, saleId: saved.id })));
    await tx.insert(salePayments).values(payments.map((payment) => ({ ...payment, saleId: saved.id })));
    return saved.id;
  });

  return res.status(201).json({ id: saleId, billNo, receiptUrl: "/api/sales/" + encodeURIComponent(billNo) + "/receipt" });
});

export default router;
