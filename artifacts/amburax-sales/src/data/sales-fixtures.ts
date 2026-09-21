export type PaymentMode = "UPI" | "Card" | "Cash" | "Wallet";
export type TransactionType = "Sale" | "Return" | "Exchange" | "Draft" | "Voided";
export type TransactionStatus = "Paid" | "Refunded" | "Exchanged" | "Pending" | "Voided";

export type Transaction = {
  id: string;
  billNo: string;
  dateTime: string;
  customer: string;
  itemsCount: number;
  amount: number;
  paymentMode: PaymentMode;
  status: TransactionStatus;
  type: TransactionType;
  searchable: string;
};

export type TransactionDetail = {
  billNo: string;
  status: TransactionStatus;
  dateTime: string;
  cashier: string;
  customer: { name: string; phone: string };
  items: { name: string; price: number; quantity: number; total: number; image: string }[];
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  paymentMethod: PaymentMode;
  transactionId: string;
  paymentAmount: number;
};

export type SalesDashboardData = {
  kpis: { label: string; value: string; trend: string; comparison: string; icon: string; tone: string }[];
  transactions: Transaction[];
  transactionDetails: Record<string, TransactionDetail>;
  salesTrend: { label: string; value: number; date: string }[];
  paymentBreakdown: { label: PaymentMode; percent: number; amount: number; color: string }[];
  transactionTypes: { label: TransactionType; count: number; percent: number; color: string }[];
  tabs: { label: string; value: "all" | TransactionType; count: number }[];
};

const customers = ["Walk-in Customer", "Ali Khan", "Priya Sharma", "Rakesh Patel", "Neha Jain", "Arjun Mehta", "Devika Rao"];
const times = ["07:14 PM", "04:10 PM", "04:35 PM", "02:20 PM", "11:11 AM", "10:45 AM", "10:34 AM", "08:39 PM", "06:12 PM", "05:44 PM", "04:18 PM", "03:26 PM"];
const products = [
  { name: "Men's Casual Shirt", price: 799, image: "shirt" },
  { name: "Denim Jeans", price: 1299, image: "denim" },
  { name: "Women's Kurti", price: 1099, image: "kurti" },
  { name: "Linen Overshirt", price: 1499, image: "linen" },
  { name: "Canvas Sneakers", price: 1899, image: "sneaker" },
];
const modes: PaymentMode[] = ["UPI", "Card", "Cash", "UPI", "Card", "Cash", "Wallet"];
const statuses: TransactionStatus[] = ["Paid", "Paid", "Paid", "Paid", "Paid", "Paid", "Refunded", "Exchanged"];

const transactions: Transaction[] = Array.from({ length: 30 }, (_, index) => {
  const day = index < 10 ? 26 : index < 20 ? 25 : 24;
  const customer = customers[index % customers.length];
  const itemsCount = (index % 4) + 1;
  const amount = [3147, 1598, 4299, 999, 2799, 1199, 499, 2499, 1899, 799, 3398, 2199][index % 12];
  const status = statuses[index % statuses.length];
  const type: TransactionType = status === "Refunded" ? "Return" : status === "Exchanged" ? "Exchange" : "Sale";
  return {
    id: `txn-${index + 1}`,
    billNo: `POS-${String(2134 - index).padStart(6, "0")}`,
    dateTime: `${day} Aug 2024, ${times[index % times.length]}`,
    customer,
    itemsCount,
    amount,
    paymentMode: modes[index % modes.length],
    status,
    type,
    searchable: `${customer} ${amount} POS-${2134 - index} ${products[index % products.length].name} ${index % 2 ? "89014522" : "89014576"}`.toLowerCase(),
  };
});

const makeDetail = (transaction: Transaction): TransactionDetail => {
  const first = products[transactions.findIndex((item) => item.id === transaction.id) % products.length];
  const second = products[(transactions.findIndex((item) => item.id === transaction.id) + 1) % products.length];
  const firstQty = Math.max(1, transaction.itemsCount - 1);
  const items = [
    { name: first.name, price: first.price, quantity: firstQty, total: first.price * firstQty, image: first.image },
    { name: second.name, price: second.price, quantity: 1, total: second.price, image: second.image },
  ];
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discount = transaction.status === "Paid" ? 50 : 0;
  const gst = Math.round((subtotal - discount) * 0.05);
  return {
    billNo: transaction.billNo,
    status: transaction.status,
    dateTime: transaction.dateTime,
    cashier: ["Rohan Kulkarni", "Aarav Menon", "Maya Shah"][transactions.indexOf(transaction) % 3],
    customer: { name: transaction.customer, phone: `+91 98765 ${String(43210 + transactions.indexOf(transaction)).slice(-5)}` },
    items,
    subtotal,
    discount,
    gst,
    total: transaction.amount,
    paymentMethod: transaction.paymentMode,
    transactionId: `4123456789${String(901 + transactions.indexOf(transaction)).slice(-3)}`,
    paymentAmount: transaction.amount,
  };
};

export const salesDashboardData: SalesDashboardData = {
  kpis: [
    { label: "Total Sales", value: "₹3,42,850", trend: "+18.4%", comparison: "vs previous period", icon: "cart", tone: "blue" },
    { label: "Total Bills", value: "284", trend: "+12.1%", comparison: "vs previous period", icon: "receipt", tone: "violet" },
    { label: "Returns / Exchanges", value: "12", trend: "-20.0%", comparison: "vs previous period", icon: "rotate", tone: "rose" },
    { label: "Avg. Bill Value", value: "₹1,207", trend: "+5.3%", comparison: "vs previous period", icon: "wallet", tone: "mint" },
  ],
  transactions,
  transactionDetails: Object.fromEntries(transactions.map((transaction) => [transaction.id, makeDetail(transaction)])),
  salesTrend: [
    { label: "20 Aug", date: "20 Aug 2024", value: 32000 },
    { label: "21 Aug", date: "21 Aug 2024", value: 44500 },
    { label: "22 Aug", date: "22 Aug 2024", value: 52000 },
    { label: "23 Aug", date: "23 Aug 2024", value: 68800 },
    { label: "24 Aug", date: "24 Aug 2024", value: 62400 },
    { label: "25 Aug", date: "25 Aug 2024", value: 73200 },
    { label: "26 Aug", date: "26 Aug 2024", value: 79500 },
  ],
  paymentBreakdown: [
    { label: "UPI", percent: 48, amount: 164568, color: "#2587df" },
    { label: "Card", percent: 22, amount: 75427, color: "#8b5cda" },
    { label: "Cash", percent: 26, amount: 89310, color: "#f0ad44" },
    { label: "Wallet", percent: 4, amount: 13545, color: "#36b78e" },
  ],
  transactionTypes: [
    { label: "Sale", count: 284, percent: 95.9, color: "#2587df" },
    { label: "Return", count: 8, percent: 2.7, color: "#e36b7d" },
    { label: "Exchange", count: 4, percent: 1.4, color: "#f0ad44" },
    { label: "Voided", count: 0, percent: 0, color: "#a2adba" },
  ],
  tabs: [
    { label: "All Transactions", value: "all", count: 296 },
    { label: "Sales", value: "Sale", count: 284 },
    { label: "Returns", value: "Return", count: 8 },
    { label: "Exchanges", value: "Exchange", count: 4 },
    { label: "Drafts", value: "Draft", count: 0 },
    { label: "Voided", value: "Voided", count: 0 },
  ],
};