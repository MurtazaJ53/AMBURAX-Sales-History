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

export default router;
