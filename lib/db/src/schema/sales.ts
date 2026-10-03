import { integer, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const saleStatusEnum = pgEnum("sale_status", ["Paid", "Refunded", "Exchanged", "Pending", "Voided"]);
export const saleTypeEnum = pgEnum("sale_type", ["Sale", "Return", "Exchange", "Draft", "Voided"]);
export const paymentMethodEnum = pgEnum("payment_method", ["UPI", "Card", "Cash", "Wallet"]);

export const stores = pgTable("stores", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  storeCode: text("store_code").notNull().unique(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  gstin: text("gstin").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sales = pgTable("sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  billNo: text("bill_no").notNull().unique(),
  invoiceNo: text("invoice_no"),
  storeId: uuid("store_id").notNull().references(() => stores.id),
  soldAt: timestamp("sold_at", { withTimezone: true }).notNull().defaultNow(),
  cashierName: text("cashier_name").notNull(),
  salesPersonName: text("sales_person_name"),
  customerName: text("customer_name").notNull().default("Walk-in Customer"),
  customerPhone: text("customer_phone"),
  status: saleStatusEnum("status").notNull().default("Paid"),
  type: saleTypeEnum("type").notNull().default("Sale"),
  subtotal: numeric("subtotal", { precision: 12, scale: 2, mode: "number" }).notNull(),
  itemDiscount: numeric("item_discount", { precision: 12, scale: 2, mode: "number" }).notNull().default(0),
  gstRate: numeric("gst_rate", { precision: 5, scale: 2, mode: "number" }).notNull().default(5),
  gstAmount: numeric("gst_amount", { precision: 12, scale: 2, mode: "number" }).notNull().default(0),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const saleItems = pgTable("sale_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  saleId: uuid("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  productName: text("product_name").notNull(),
  sku: text("sku").notNull(),
  variant: text("variant"),
  imageKey: text("image_key").notNull().default("shirt"),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2, mode: "number" }).notNull(),
  lineTotal: numeric("line_total", { precision: 12, scale: 2, mode: "number" }).notNull(),
});

export const salePayments = pgTable("sale_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  saleId: uuid("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  method: paymentMethodEnum("method").notNull(),
  reference: text("reference"),
  amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
});
