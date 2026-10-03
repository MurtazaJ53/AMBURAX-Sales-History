import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CreditCard,
  Filter,
  Grid2X2,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Package,
  Plus,
  Receipt,
  RefreshCcw,
  RotateCcw,
  Search,
  Settings2,
  ShoppingCart,
  Store,
  Tag,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { salesDashboardData, type PaymentMode, type Transaction, type TransactionType } from "@/data/sales-fixtures";
import ReceiptModal, { fetchSaleReceipt, type ReceiptRecord } from "@/components/receipt-modal";

const currency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

function ProductThumb({ kind }: { kind: string }) {
  const palette: Record<string, [string, string]> = {
    shirt: ["#a7c9e6", "#355c87"],
    denim: ["#536d91", "#223b5e"],
    kurti: ["#df9cae", "#8e4560"],
    linen: ["#c9bda7", "#847968"],
    sneaker: ["#d8d9d8", "#727a82"],
  };
  const [light, dark] = palette[kind] ?? palette.shirt;
  return (
    <span className="relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded border border-[#dce3ea] bg-[#f1f4f7]" data-testid={`product-thumbnail-${kind}`}>
      <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
        <path d={kind === "sneaker" ? "M4 21c5 0 8-5 11-8l4 4 8 2v6H4z" : "M11 3h10l3 7-3 3v15H11V13l-3-3z"} fill={light} />
        <path d={kind === "sneaker" ? "M4 25h23v3H4z" : "M11 13l5 3 5-3v15H11z"} fill={dark} opacity=".75" />
        <path d={kind === "sneaker" ? "M18 17l5 3" : "M10 9l6 5 6-5"} fill="none" stroke={dark} strokeWidth="1.4" />
      </svg>
    </span>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "POS Checkout", icon: ShoppingCart },
    { label: "Sales & Transactions", icon: Receipt, active: true },
    { label: "Inventory", icon: Package },
    { label: "Stock Transfer", icon: ArrowLeft },
    { label: "Products / Catalog", icon: Grid2X2 },
    { label: "Customers (CRM)", icon: UsersRound },
    { label: "Suppliers", icon: Store },
    { label: "Offers & Loyalty", icon: Tag },
    { label: "Reports", icon: BarChart3 },
    { label: "Store & Settings", icon: Settings2 },
  ];
  return (
    <>
      {open && <button className="amb-drawer-backdrop md:hidden" onClick={onClose} aria-label="Close navigation" data-testid="button-close-sidebar" />}
      <aside className={`amb-sidebar ${open ? "fixed inset-y-0 left-0 z-40 block shadow-xl" : ""}`} aria-label="Main navigation">
        <div className="flex h-[66px] items-center gap-2 border-b border-[hsl(var(--border))] px-5">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-[hsl(var(--primary))] text-white"><Activity size={16} strokeWidth={2.6} /></div>
          <div>
            <div className="text-[15px] font-extrabold tracking-[-.04em] text-[#1e3553]">AMBURAX</div>
            <div className="text-[9px] font-medium tracking-[.02em] text-[hsl(var(--muted-foreground))]">Retail operations</div>
          </div>
          {open && <button className="amb-icon-btn ml-auto md:hidden" onClick={onClose} aria-label="Close sidebar" data-testid="button-sidebar-close"><X size={16} /></button>}
        </div>
        <div className="border-b border-[hsl(var(--border))] px-4 py-3">
          <div className="text-[9px] font-semibold uppercase tracking-[.06em] text-[hsl(var(--muted-foreground))]">Active outlet</div>
          <button className="mt-1 flex w-full items-center justify-between rounded border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/.55)] px-2 py-2 text-left" onClick={() => undefined} data-testid="button-outlet-selector">
            <span className="text-[11px] font-semibold text-[#253d5d]">Indiranagar Store</span>
            <span className="flex items-center gap-1 text-[9px] font-bold text-[#20a778]"><span className="h-1.5 w-1.5 rounded-full bg-[#2bc28e]" />Live</span>
          </button>
        </div>
        <nav className="py-3">
          {navItems.map(({ label, icon: Icon, active }) => (
            <button className={`amb-nav w-[calc(100%-24px)] text-left ${active ? "active" : ""}`} key={label} onClick={() => undefined} data-testid={`nav-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
              <Icon size={15} strokeWidth={active ? 2.2 : 1.8} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 hidden w-[232px] border-t border-[hsl(var(--border))] p-4 lg:block">
          <div className="rounded-md border border-[#d7e6f4] bg-[#edf6ff] p-3">
            <div className="text-[11px] font-bold text-[#24517d]">Track every sale</div>
            <div className="mt-1 text-[9px] leading-[1.35] text-[#6a829c]">Real-time insights, better decisions.</div>
            <button className="mt-2 h-7 rounded bg-[hsl(var(--primary))] px-2.5 text-[10px] font-bold text-white" onClick={() => undefined} data-testid="button-generate-report">Generate report</button>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-[hsl(var(--muted-foreground))]"><Cloud size={13} /> Cloud sync <span className="ml-auto">2 min ago</span></div>
        </div>
      </aside>
    </>
  );
}

function Header({ onMenu, onNotice }: { onMenu: () => void; onNotice: (text: string) => void }) {
  return (
    <header className="amb-header">
      <button className="amb-icon-btn amb-mobile-only" onClick={onMenu} aria-label="Open navigation" data-testid="button-open-sidebar"><Menu size={18} /></button>
      <button className="amb-control amb-header-store min-w-[164px] justify-between" onClick={() => onNotice("Store selector is ready for your next outlet.")} data-testid="button-header-store">
        <span className="flex items-center gap-2"><Store size={14} className="text-[hsl(var(--primary))]" /><span><b className="block text-[10px]">Store #01</b><small className="block text-[9px] text-[hsl(var(--muted-foreground))]">Indiranagar</small></span></span><ChevronDown size={13} />
      </button>
      <div className="amb-header-search relative hidden min-w-0 max-w-[290px] flex-1 md:block">
        <Search className="absolute left-2.5 top-2.5 text-[#9aaabd]" size={14} />
        <input className="h-[34px] w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-8 pr-11 text-[10px] outline-none placeholder:text-[#9aaabd] focus:border-[hsl(var(--primary))]" placeholder="Search by bill no, customer name, product, barcode..." data-testid="input-global-search" />
        <span className="absolute right-2 top-2 rounded bg-[hsl(var(--muted))] px-1 text-[9px] text-[hsl(var(--muted-foreground))]">⌘K</span>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <button className="hidden items-center gap-1.5 px-2 text-left sm:flex" onClick={() => onNotice("Store online and receiving sales.")} data-testid="button-store-status">
          <span className="h-2 w-2 rounded-full bg-[#29b984]" /><span className="text-[10px] font-bold text-[#33516d]">Store<br /><small className="font-medium text-[#6d8298]">Online</small></span>
        </button>
        <button className="hidden items-center gap-1 border-l border-[hsl(var(--border))] pl-3 text-left sm:flex" onClick={() => onNotice("Shift #02 is live.")} data-testid="button-shift-status">
          <span className="text-[10px] font-bold text-[#33516d]">Shift #02<br /><small className="font-medium text-[#6d8298]">Live</small></span>
        </button>
        <button className="hidden h-[34px] items-center gap-1.5 rounded bg-[hsl(var(--primary))] px-3 text-[11px] font-bold text-white shadow-sm sm:flex" onClick={() => onNotice("New Sale opens at the checkout terminal.")} data-testid="button-new-sale"><Plus size={14} /> New Sale</button>
        <button className="amb-icon-btn relative" onClick={() => onNotice("You have 3 new notifications.")} aria-label="Notifications" data-testid="button-notifications"><Bell size={17} /><span className="absolute right-1 top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-[#e15e76] px-0.5 text-[8px] font-bold text-white">3</span></button>
        <button className="flex items-center gap-2 border-l border-[hsl(var(--border))] pl-2" onClick={() => onNotice("Signed in as Ramesh Sharma.")} data-testid="button-user-menu">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#344f70] text-[10px] font-bold text-white">RS</span><span className="hidden text-left lg:block"><b className="block text-[10px] text-[#2c4561]">Ramesh Sharma</b><small className="text-[9px] text-[hsl(var(--muted-foreground))]">Store Manager</small></span><ChevronDown size={13} className="hidden text-[#75879a] lg:block" />
        </button>
      </div>
    </header>
  );
}

function KpiCard({ item }: { item: typeof salesDashboardData.kpis[number] }) {
  const Icon = item.icon === "cart" ? ShoppingCart : item.icon === "receipt" ? Receipt : item.icon === "rotate" ? RotateCcw : WalletCards;
  const tone = item.tone === "blue" ? ["#e6f3ff", "#2b8bdc"] : item.tone === "violet" ? ["#f3eaff", "#8b55d4"] : item.tone === "rose" ? ["#ffedf0", "#df5b75"] : ["#e4f8f0", "#2caf83"];
  return (
    <div className="amb-card kpi-card flex min-w-0 flex-col justify-between p-3" data-testid={`card-kpi-${item.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
      <div className="flex items-start gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-md" style={{ background: tone[0], color: tone[1] }}><Icon size={16} /></span><span className="amb-label mt-1">{item.label}</span></div>
      <div className="mt-1 flex items-end justify-between gap-2"><span className="kpi-value amb-number text-[21px] font-bold tracking-[-.04em] text-[#253b59]">{item.value}</span><span className={`mb-0.5 text-[9px] font-bold ${item.trend.startsWith("-") ? "text-[#d75b6f]" : "text-[#25a677]"}`}>{item.trend}</span></div>
      <div className="mt-0.5 text-[9px] text-[hsl(var(--muted-foreground))]">{item.comparison}</div>
    </div>
  );
}

function FilterBar({ search, setSearch, payment, setPayment, type, setType, date, setDate, moreOpen, setMoreOpen, onReset }: {
  search: string; setSearch: (value: string) => void; payment: string; setPayment: (value: string) => void; type: string; setType: (value: string) => void; date: string; setDate: (value: string) => void; moreOpen: boolean; setMoreOpen: (value: boolean) => void; onReset: () => void;
}) {
  return (
    <div className="amb-card p-2.5" data-testid="filter-toolbar">
      <div className="filter-grid grid grid-cols-[1.15fr_1fr_1fr_1fr_1.7fr_auto] gap-2">
        <label className="amb-control cursor-pointer"><CalendarDays size={13} className="text-[hsl(var(--primary))]" /><input type="date" className="min-w-0 bg-transparent text-[10px] outline-none" value={date} onChange={(event) => setDate(event.target.value)} data-testid="input-date-filter" /></label>
        <select className="amb-control min-w-0 cursor-pointer appearance-none" value="all-stores" onChange={() => undefined} data-testid="select-store-filter"><option value="all-stores">All Stores</option></select>
        <select className="amb-control min-w-0 cursor-pointer appearance-none" value={payment} onChange={(event) => setPayment(event.target.value)} data-testid="select-payment-filter"><option value="all">All Payment Modes</option><option value="UPI">UPI</option><option value="Card">Card</option><option value="Cash">Cash</option><option value="Wallet">Wallet</option></select>
        <select className="amb-control min-w-0 cursor-pointer appearance-none" value={type} onChange={(event) => setType(event.target.value)} data-testid="select-type-filter"><option value="all">All Transaction Types</option><option value="Sale">Sales</option><option value="Return">Returns</option><option value="Exchange">Exchanges</option><option value="Draft">Drafts</option><option value="Voided">Voided</option></select>
        <label className="amb-control filter-search min-w-0"><Search size={13} className="shrink-0 text-[#8fa3b7]" /><input className="min-w-0 flex-1 bg-transparent text-[10px] outline-none placeholder:text-[#9aaabd]" placeholder="Search bill, customer, product, barcode..." value={search} onChange={(event) => setSearch(event.target.value)} data-testid="input-transaction-search" /><kbd className="hidden rounded bg-[hsl(var(--muted))] px-1 text-[8px] text-[hsl(var(--muted-foreground))] lg:block">/</kbd></label>
        <button className="amb-control filter-more justify-center" onClick={() => setMoreOpen(!moreOpen)} data-testid="button-more-filters"><Filter size={13} className={moreOpen ? "text-[hsl(var(--primary))]" : ""} /> <span className="hidden sm:inline">More Filters</span><ChevronDown size={12} className={moreOpen ? "rotate-180" : ""} /></button>
      </div>
      {moreOpen && <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-[hsl(var(--border))] pt-2 text-[10px] text-[hsl(var(--muted-foreground))]" data-testid="more-filters-panel"><span className="font-semibold">Quick filters</span><button className="amb-control h-7" onClick={() => setSearch("Walk-in")} data-testid="button-filter-walkin">Walk-in customers</button><button className="amb-control h-7" onClick={() => setPayment("UPI")} data-testid="button-filter-upi">UPI payments</button><button className="amb-control h-7" onClick={() => setType("Sale")} data-testid="button-filter-sales">Completed sales</button></div>}
      <div className="mt-2 flex justify-end"><button className="text-[10px] font-bold text-[hsl(var(--primary))] hover:underline" onClick={onReset} data-testid="button-reset-filters">Reset filters</button></div>
    </div>
  );
}

function StatusPill({ status }: { status: Transaction["status"] }) {
  const styles: Record<Transaction["status"], string> = { Paid: "bg-[#e2f8ef] text-[#16815d]", Refunded: "bg-[#ffebee] text-[#c74c62]", Exchanged: "bg-[#fff3dc] text-[#b1781a]", Pending: "bg-[#fff3dc] text-[#b1781a]", Voided: "bg-[#eef0f3] text-[#6f7d8c]" };
  return <span className={`amb-pill ${styles[status]}`} data-testid={`status-${status.toLowerCase()}`}><span className="mr-1 h-1.5 w-1.5 rounded-full bg-current opacity-65" />{status}</span>;
}

function TransactionsTable({ transactions, selectedId, onSelect, page, onPage }: { transactions: Transaction[]; selectedId: string; onSelect: (transaction: Transaction) => void; page: number; onPage: (page: number) => void }) {
  const pageSize = 10;
  const visible = transactions.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(transactions.length / pageSize));
  return (
    <div className="amb-card workspace-card min-w-0 overflow-hidden" data-testid="transactions-panel">
      <div className="amb-table-wrap">
        <table className="amb-table">
          <thead><tr><th className="w-[34px] text-center"><input type="checkbox" aria-label="Select visible transactions" data-testid="checkbox-select-all" /></th><th className="w-[34px]">#</th><th className="w-[126px]">Date &amp; Time</th><th className="w-[98px]">Bill No.</th><th>Customer</th><th className="w-[52px]">Items</th><th className="w-[78px] text-right">Amount</th><th className="w-[83px]">Payment</th><th className="w-[74px]">Status</th><th className="w-[43px]">Action</th></tr></thead>
          <tbody>
            {visible.length ? visible.map((transaction, index) => (
              <tr className={transaction.id === selectedId ? "selected" : ""} key={transaction.id} onClick={() => onSelect(transaction)} data-testid={`row-transaction-${transaction.id}`}>
                <td className="text-center"><input type="checkbox" checked={transaction.id === selectedId} onChange={() => onSelect(transaction)} onClick={(event) => event.stopPropagation()} aria-label={`Select ${transaction.billNo}`} data-testid={`checkbox-transaction-${transaction.id}`} /></td>
                <td className="amb-number text-[hsl(var(--muted-foreground))]">{(page - 1) * pageSize + index + 1}</td>
                <td className="text-[10px] text-[#5e7187]">{transaction.dateTime}</td>
                <td><button className="font-mono text-[10px] font-bold text-[hsl(var(--primary))] hover:underline" onClick={(event) => { event.stopPropagation(); onSelect(transaction); }} data-testid={`button-bill-${transaction.id}`}>{transaction.billNo}</button></td>
                <td className="font-medium text-[#3b526c]" title={transaction.customer}>{transaction.customer}</td>
                <td className="amb-number text-[hsl(var(--muted-foreground))]">{transaction.itemsCount}</td>
                <td className="amb-number text-right font-bold text-[#293f5b]">{currency(transaction.amount)}</td>
                <td className="text-[10px] text-[#586c82]">{transaction.paymentMode}</td>
                <td><StatusPill status={transaction.status} /></td>
                <td><button className="text-[10px] font-bold text-[hsl(var(--primary))] hover:underline" onClick={(event) => { event.stopPropagation(); onSelect(transaction); }} data-testid={`button-view-${transaction.id}`}>View</button></td>
              </tr>
            )) : <tr><td colSpan={10} className="h-32 text-center"><div className="mx-auto flex max-w-[220px] flex-col items-center gap-1 text-[11px] text-[hsl(var(--muted-foreground))]"><Search size={18} /><b className="text-[#3b526c]">No transactions found</b><span>Try clearing a filter or searching another term.</span></div></td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[hsl(var(--border))] px-3 py-2.5">
        <span className="pagination-label text-[10px] text-[hsl(var(--muted-foreground))]">Showing {transactions.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, transactions.length)} of {transactions.length} transactions</span>
        <div className="flex items-center gap-1">
          <button className="amb-icon-btn h-7 w-7 border border-[hsl(var(--border))]" disabled={page <= 1} onClick={() => onPage(Math.max(1, page - 1))} aria-label="Previous page" data-testid="button-previous-page"><ChevronLeft size={13} /></button>
          {[1, 2, 3, 4, 5].map((number) => <button className={`grid h-7 w-7 place-items-center rounded text-[10px] font-bold ${page === number ? "bg-[hsl(var(--primary))] text-white" : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"}`} key={number} onClick={() => onPage(Math.min(number, totalPages))} data-testid={`button-page-${number}`}>{number}</button>)}
          <span className="px-1 text-[10px] text-[hsl(var(--muted-foreground))]">...</span><button className="grid h-7 min-w-7 place-items-center rounded px-1 text-[10px] font-bold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]" onClick={() => onPage(totalPages)} data-testid="button-page-last">{totalPages}</button>
          <button className="amb-icon-btn h-7 w-7 border border-[hsl(var(--border))]" disabled={page >= totalPages} onClick={() => onPage(Math.min(totalPages, page + 1))} aria-label="Next page" data-testid="button-next-page"><ChevronRight size={13} /></button>
          <select className="ml-1 h-7 rounded border border-[hsl(var(--border))] bg-white px-1.5 text-[10px] text-[hsl(var(--muted-foreground))]" defaultValue="10" data-testid="select-page-size"><option value="10">10 / page</option><option value="25">25 / page</option></select>
        </div>
      </div>
    </div>
  );
}

function Inspector({ transaction, onClose, onNotice, onOpenReceipt }: { transaction: Transaction; onClose: () => void; onNotice: (text: string) => void; onOpenReceipt: (billNo: string) => void }) {
  const detailQuery = useQuery<ReceiptRecord>({ queryKey: ["sale-receipt", transaction.billNo], queryFn: () => fetchSaleReceipt(transaction.billNo) });
  const detail = detailQuery.data;
  if (!detail) return <aside className="amb-inspector flex h-full flex-col items-center justify-center p-5 text-center text-[11px] text-slate-500">{detailQuery.isLoading ? "Loading receipt from database…" : (detailQuery.error instanceof Error ? detailQuery.error.message : "Receipt data is unavailable.")}</aside>;
  return (
    <aside className="amb-inspector slide-in flex h-full flex-col overflow-y-auto" data-testid="transaction-inspector">
      <div className="flex items-start justify-between border-b border-[hsl(var(--border))] px-4 py-3">
        <div><div className="text-[12px] font-bold text-[#2c435f]">Transaction Details</div><div className="mt-0.5 text-[9px] text-[hsl(var(--muted-foreground))]">Sale record · synced just now</div></div>
        <button className="amb-icon-btn -mr-1 -mt-1" onClick={onClose} aria-label="Close transaction details" data-testid="button-close-inspector"><X size={16} /></button>
      </div>
      <div className="space-y-4 px-4 py-3">
        <div className="flex items-start justify-between"><div><div className="font-mono text-[13px] font-bold text-[#263e5b]">{detail.billNo}</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">{detail.dateTime}</div><div className="mt-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">Cashier: {detail.cashier}</div></div><StatusPill status={detail.status} /></div>
        <div className="rounded border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/.45)] p-3"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#e4f2ff] text-[hsl(var(--primary))]"><UserRound size={15} /></span><div><div className="text-[11px] font-bold text-[#334d68]">{detail.customer.name}</div><div className="text-[10px] text-[hsl(var(--muted-foreground))]">{detail.customer.phone}</div></div></div></div>
        <div><div className="mb-2 text-[10px] font-bold uppercase tracking-[.06em] text-[hsl(var(--muted-foreground))]">Items in transaction</div><div className="space-y-2">{detail.items.map((item) => <div className="flex items-center gap-2" key={item.name}><ProductThumb kind={item.image} /><div className="min-w-0 flex-1"><div className="truncate text-[10px] font-semibold text-[#3a506a]">{item.name}</div><div className="text-[9px] text-[hsl(var(--muted-foreground))]">{currency(item.price)} × {item.quantity}</div></div><div className="text-[10px] font-bold text-[#293f5b]">{currency(item.total)}</div></div>)}</div></div>
        <div className="space-y-1.5 border-t border-[hsl(var(--border))] pt-3 text-[10px]"><div className="flex justify-between text-[hsl(var(--muted-foreground))]"><span>Subtotal</span><b className="text-[#445a72]">{currency(detail.subtotal)}</b></div><div className="flex justify-between text-[hsl(var(--muted-foreground))]"><span>Discount</span><b className="text-[#21a277]">- {currency(detail.discount)}</b></div><div className="flex justify-between text-[hsl(var(--muted-foreground))]"><span>GST (5%)</span><b className="text-[#445a72]">{currency(detail.gst)}</b></div><div className="mt-2 flex justify-between border-t border-[hsl(var(--border))] pt-2 text-[12px] font-bold text-[#263e5b]"><span>Total</span><span>{currency(detail.total)}</span></div></div>
        <div className="rounded border border-[hsl(var(--border))] p-3"><div className="mb-2 text-[10px] font-bold uppercase tracking-[.06em] text-[hsl(var(--muted-foreground))]">Payment</div><div className="flex items-center justify-between text-[10px]"><span className="flex items-center gap-1.5 text-[#445a72]"><CreditCard size={13} className="text-[hsl(var(--primary))]" />{detail.paymentMethod}</span><b className="text-[#293f5b]">{currency(detail.paymentAmount)}</b></div><div className="mt-1 text-[9px] text-[hsl(var(--muted-foreground))]">Txn ID: {detail.transactionId}</div></div>
        <div className="flex gap-2"><button className="amb-control flex-1 justify-center text-[10px] font-bold text-[hsl(var(--primary))]" onClick={() => onOpenReceipt(detail.billNo)} data-testid="button-print-bill"><ArrowDownToLine size={13} /> Print Bill</button><button className="amb-control flex-1 justify-center text-[10px] font-bold text-[hsl(var(--primary))]" onClick={() => onNotice("Return / Exchange workflow is ready for integration.")} data-testid="button-return-exchange"><RefreshCcw size={13} /> Return / Exchange</button><button className="amb-icon-btn border border-[hsl(var(--border))]" onClick={() => onNotice("More transaction actions are available in production.")} aria-label="More transaction actions" data-testid="button-more-transaction-actions"><MoreHorizontal size={15} /></button></div>
      </div>
    </aside>
  );
}

function SalesTrend() {
  const points = salesDashboardData.salesTrend;
  const max = Math.max(...points.map((point) => point.value));
  return (
    <div className="amb-card min-w-0 p-3" data-testid="card-sales-trend">
      <div className="flex items-center justify-between"><div><h3 className="text-[12px] font-bold text-[#2d4561]">Sales Trend</h3><div className="mt-0.5 text-[9px] text-[hsl(var(--muted-foreground))]">Daily sales performance</div></div><select className="h-7 rounded border border-[hsl(var(--border))] bg-white px-2 text-[10px] text-[hsl(var(--muted-foreground))]" defaultValue="7" data-testid="select-trend-range"><option value="7">Last 7 Days</option><option value="30">Last 30 Days</option></select></div>
      <div className="mt-3 flex items-end gap-2"><span className="text-[18px] font-bold tracking-[-.03em] text-[#263e5b]">₹3,42,850</span><span className="mb-0.5 text-[9px] font-bold text-[#22a479]">+18.4%</span></div>
      <div className="relative mt-2 h-[117px]"><div className="absolute inset-x-0 top-0 flex justify-between text-[8px] text-[#a0adbb]"><span>80K</span><span>40K</span><span>0</span></div><svg className="absolute inset-x-0 bottom-5 top-2 h-[88px] w-full" viewBox="0 0 500 100" preserveAspectRatio="none" aria-label="Sales trend chart"><g className="chart-grid"><line x1="0" y1="4" x2="500" y2="4" /><line x1="0" y1="50" x2="500" y2="50" /><line x1="0" y1="96" x2="500" y2="96" /></g>{points.map((point, index) => { const x = 20 + index * 76; const h = (point.value / max) * 80; return <g key={point.label}><rect x={x} y={96 - h} width="30" height={h} rx="2" fill={index === 4 ? "#65aee5" : "#2587df"} opacity={index === 4 ? .78 : 1} /><title>{point.date}: {currency(point.value)}</title></g>; })}</svg><div className="absolute inset-x-0 bottom-0 flex justify-between text-[8px] text-[#7d8fa2]">{points.map((point) => <span key={point.label}>{point.label}</span>)}</div></div><div className="mt-1 flex justify-center gap-1 text-[9px] text-[hsl(var(--muted-foreground))]"><span className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />Sales (₹)</div>
    </div>
  );
}

function PaymentBreakdown() {
  const segments = salesDashboardData.paymentBreakdown;
  let offset = 0;
  const gradient = segments.map((segment) => { const start = offset; offset += segment.percent; return `${segment.color} ${start}% ${offset}%`; }).join(", ");
  return (
    <div className="amb-card min-w-0 p-3" data-testid="card-payment-breakdown">
      <div><h3 className="text-[12px] font-bold text-[#2d4561]">Payment Mode Breakdown</h3><div className="mt-0.5 text-[9px] text-[hsl(var(--muted-foreground))]">How customers paid</div></div>
      <div className="mt-3 flex items-center gap-4"><div className="relative grid h-[112px] w-[112px] shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}><div className="grid h-[74px] w-[74px] place-items-center rounded-full bg-white text-center shadow-[0_0_0_1px_#edf0f3]"><span className="text-[15px] font-bold tracking-[-.04em] text-[#293f5b]">₹3,42,850</span><span className="text-[8px] text-[hsl(var(--muted-foreground))]">Total Sales</span></div></div><div className="min-w-0 flex-1 space-y-2">{segments.map((segment) => <div className="flex items-center gap-1.5 text-[9px]" key={segment.label}><span className="h-2 w-2 rounded-full" style={{ background: segment.color }} /><span className="w-9 text-[#50657b]">{segment.label}</span><span className="ml-auto text-[hsl(var(--muted-foreground))]">{segment.percent}%</span><b className="w-[59px] text-right text-[#3b526c]">{currency(segment.amount)}</b></div>)}</div></div>
    </div>
  );
}

function TransactionTypeChart() {
  return (
    <div className="amb-card min-w-0 p-3" data-testid="card-transaction-types">
      <div><h3 className="text-[12px] font-bold text-[#2d4561]">Transaction Type</h3><div className="mt-0.5 text-[9px] text-[hsl(var(--muted-foreground))]">Volume by transaction status</div></div>
      <div className="mt-4 space-y-3">{salesDashboardData.transactionTypes.map((item) => <div key={item.label}><div className="mb-1 flex items-center justify-between text-[10px]"><span className="text-[#50657b]">{item.label}</span><span className="amb-number font-bold text-[#3b526c]">{item.count} <small className="ml-1 font-medium text-[hsl(var(--muted-foreground))]">{item.percent}%</small></span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#edf0f3]"><div className="h-full rounded-full" style={{ width: `${Math.max(item.percent, item.count ? 2 : 0)}%`, background: item.color }} /></div></div>)}</div>
    </div>
  );
}

export default function Sales() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [payment, setPayment] = useState("all");
  const [type, setType] = useState("all");
  const [date, setDate] = useState("");
  const [tab, setTab] = useState<"all" | TransactionType>("all");
  const [page, setPage] = useState(1);
  const [moreOpen, setMoreOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [receiptBillNo, setReceiptBillNo] = useState("");
  const transactionsQuery = useQuery<Transaction[]>({ queryKey: ["sales"], queryFn: async () => { const response = await fetch("/api/sales"); if (!response.ok) throw new Error("Could not load sales from the database."); return response.json(); } });
  const transactions = transactionsQuery.data ?? [];
  useEffect(() => { if (transactions.length && !transactions.some((item) => item.id === selectedId)) setSelectedId(transactions[0].id); }, [transactions, selectedId]);
  const [inspectorOpen, setInspectorOpen] = useState(() => window.innerWidth >= 768);
  const filtered = useMemo(() => transactions.filter((transaction) => {
    const searchMatch = !search || transaction.searchable.includes(search.toLowerCase());
    const paymentMatch = payment === "all" || transaction.paymentMode === payment;
    const typeMatch = type === "all" || transaction.type === type;
    const tabMatch = tab === "all" || transaction.type === tab;
    const selectedDay = date ? String(Number(date.slice(-2))) : "";
    const dateMatch = !selectedDay || transaction.dateTime.startsWith(`${selectedDay} `);
    return searchMatch && paymentMatch && typeMatch && tabMatch && dateMatch;
  }), [transactions, search, payment, type, tab, date]);
  const selected = transactions.find((item) => item.id === selectedId) ?? transactions[0];
  const tabs = salesDashboardData.tabs.map((item) => ({ ...item, count: item.value === "all" ? transactions.length : transactions.filter((transaction) => transaction.type === item.value).length }));
  const handleNotice = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(""), 2600); };
  const reset = () => { setSearch(""); setPayment("all"); setType("all"); setDate(""); setTab("all"); setPage(1); setMoreOpen(false); };

  return (
    <div className="amb-shell overflow-x-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="amb-main">
        <Header onMenu={() => setSidebarOpen(true)} onNotice={handleNotice} />
        <main className="amb-content">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div><div className="mb-1 flex items-center gap-2 text-[10px] font-semibold text-[hsl(var(--muted-foreground))]"><Link href="/" className="text-[hsl(var(--primary))] hover:underline">Operations</Link><ChevronRight size={12} /> Sales</div><h1 className="page-heading text-[25px] font-bold tracking-[-.045em] text-[#243b58]" data-testid="text-page-title">Sales &amp; Transaction History</h1><p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">View, search and manage all your sales, returns and transactions</p></div>
            <button className="amb-control mt-5 font-bold text-[hsl(var(--primary))]" onClick={() => handleNotice("Export prepared locally for this prototype.")} data-testid="button-export"><ArrowDownToLine size={14} /> Export</button>
          </div>
          <section className="kpi-grid mb-3 grid grid-cols-4 gap-3">{salesDashboardData.kpis.map((item) => <KpiCard item={item} key={item.label} />)}</section>
          <div className="mb-3 flex items-center justify-between gap-2"><div className="hidden text-[11px] font-bold text-[#425a73] md:block">Transaction workspace</div><button className="amb-control amb-mobile-only ml-auto" onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)} data-testid="button-mobile-filters"><Filter size={13} /> Filters</button></div>
          <div className={`${mobileFiltersOpen ? "block" : "hidden"} mb-3 md:block`}><FilterBar search={search} setSearch={setSearch} payment={payment} setPayment={setPayment} type={type} setType={setType} date={date} setDate={setDate} moreOpen={moreOpen} setMoreOpen={setMoreOpen} onReset={reset} /></div>
          <div className="tabs-scroll mb-0 flex border-b border-[hsl(var(--border))]" role="tablist">{tabs.map((item) => <button className={`amb-tab ${tab === item.value ? "active" : ""}`} key={item.value} onClick={() => { setTab(item.value); setPage(1); }} role="tab" aria-selected={tab === item.value} data-testid={`tab-${item.value.toLowerCase()}`}>{item.label} <span className="ml-1 text-[9px] opacity-70">({item.count})</span></button>)}</div>
          {transactionsQuery.isError && <div className="mb-2 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">{transactionsQuery.error instanceof Error ? transactionsQuery.error.message : "Could not load saved sales."}</div>}
          <div className={`amb-card flex min-h-[476px] min-w-0 overflow-hidden rounded-t-none ${inspectorOpen ? "" : ""}`}>
            <div className="min-w-0 flex-1"><TransactionsTable transactions={filtered} selectedId={inspectorOpen ? selectedId : ""} onSelect={(transaction) => { setSelectedId(transaction.id); setInspectorOpen(true); }} page={page} onPage={setPage} /></div>
            {inspectorOpen && selected && <><div className="amb-drawer-backdrop md:hidden" onClick={() => setInspectorOpen(false)} /><Inspector transaction={selected} onClose={() => setInspectorOpen(false)} onNotice={handleNotice} onOpenReceipt={setReceiptBillNo} /></>}
          </div>
          <section className="analytics-grid mt-3 grid grid-cols-[1.25fr_1fr_1fr] gap-3"><SalesTrend /><PaymentBreakdown /><TransactionTypeChart /></section>
        </main>
      </div>
      {receiptBillNo && <ReceiptModal billNo={receiptBillNo} onClose={() => setReceiptBillNo("")} onNotice={handleNotice} />}
      {notice && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-md bg-[#263e5b] px-4 py-2.5 text-[11px] font-semibold text-white shadow-lg" role="status" data-testid="status-notice">{notice}</div>}
    </div>
  );
}