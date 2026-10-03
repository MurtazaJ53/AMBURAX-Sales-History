import { useQuery } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { Check, FileDown, FileText, Mail, MessageCircle, Plus, Printer, RefreshCcw, X } from "lucide-react";

export type ReceiptRecord = {
  id: string; billNo: string; invoiceNo: string | null; soldAt: string; dateTime: string;
  cashier: string; cashierName: string; salesPerson: string | null;
  customer: { name: string; phone: string };
  store: { name: string; storeCode: string; address: string; city: string; state: string; postalCode: string; gstin: string };
  items: { id: string; name: string; sku: string; variant: string | null; image: string; quantity: number; price: number; total: number }[];
  subtotal: number; discount: number; itemDiscount: number; gst: number; gstAmount: number; gstRate: number;
  total: number; totalAmount: number; status: string;
  paymentMethod: string; transactionId: string; paymentAmount: number;
  payments: { method: string; reference: string | null; amount: number }[];
};

export async function fetchSaleReceipt(billNo: string): Promise<ReceiptRecord> {
  const response = await fetch("/api/sales/" + encodeURIComponent(billNo) + "/receipt");
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || "Could not load the saved receipt.");
  }
  return response.json();
}

const money = (value: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format(value);
const dateLabel = (value: string) => new Intl.DateTimeFormat("en-IN", {
  day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  hour12: true, timeZone: "Asia/Kolkata",
}).format(new Date(value));

function ReceiptBarcode({ value }: { value: string }) {
  const bits = "1010" + Array.from(value).map((char) => char.charCodeAt(0).toString(2).padStart(8, "0")).join("0") + "101";
  return <svg className="mx-auto h-10 max-w-full" viewBox={"0 0 " + bits.length + " 42"} role="img" aria-label={"Bill barcode " + value}>
    {Array.from(bits).map((bit, index) => bit === "1" ? <rect key={index} x={index} y="0" width="1" height="34" fill="#111" /> : null)}
  </svg>;
}

function ActionButton({ children, onClick, primary = false, className = "" }: {
  children: ReactNode; onClick: () => void; primary?: boolean; className?: string;
}) {
  return <button type="button" onClick={onClick} className={"flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-2 text-[11px] font-semibold transition hover:-translate-y-px " + (primary ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700") + " " + className}>{children}</button>;
}

export default function ReceiptModal({ billNo, onClose, onNotice }: {
  billNo: string; onClose: () => void; onNotice: (message: string) => void;
}) {
  const query = useQuery({ queryKey: ["sale-receipt", billNo], queryFn: () => fetchSaleReceipt(billNo), enabled: Boolean(billNo) });
  const data = query.data;
  const itemCount = data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const shareText = data ? "Receipt " + data.billNo + " | " + data.store.name + " | Total " + money(data.totalAmount) : "";
  const print = () => window.print();
  const shareWhatsApp = () => { if (data) window.open("https://wa.me/?text=" + encodeURIComponent(shareText), "_blank", "noopener,noreferrer"); };
  const shareEmail = () => { if (data) window.location.href = "mailto:?subject=" + encodeURIComponent("Receipt " + data.billNo) + "&body=" + encodeURIComponent(shareText); };

  return <div className="receipt-modal-shell fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Sale receipt" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <style>{"@media print { body * { visibility: hidden !important; } .receipt-paper, .receipt-paper * { visibility: visible !important; } .receipt-paper { position: fixed !important; left: 0 !important; top: 0 !important; width: 76mm !important; max-height: none !important; overflow: visible !important; border: 0 !important; box-shadow: none !important; } .receipt-modal-shell { position: static !important; display: block !important; padding: 0 !important; background: white !important; } }"}</style>
    <div className="relative flex max-h-[92vh] w-full max-w-[960px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl md:flex-row">
      <button type="button" onClick={onClose} className="absolute right-3 top-3 z-10 rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Close receipt"><X size={17} /></button>
      {query.isLoading && <div className="flex min-h-[380px] w-full items-center justify-center text-sm text-slate-500">Loading receipt from saved sale…</div>}
      {query.isError && <div className="flex min-h-[380px] w-full flex-col items-center justify-center gap-2 px-6 text-center"><div className="text-lg font-bold text-slate-800">Receipt unavailable</div><p className="max-w-md text-sm text-slate-500">{query.error instanceof Error ? query.error.message : "No saved receipt was found."}</p><ActionButton onClick={onClose}>Close</ActionButton></div>}
      {data && <>
        <section className="flex min-h-[540px] flex-1 flex-col items-center justify-center bg-[#f8fafc] px-5 py-8 text-center md:px-8">
          <div className="mb-3 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check size={34} strokeWidth={3} /></div>
          <h2 className="text-[22px] font-extrabold tracking-tight text-slate-900">{data.status === "Paid" ? "Sale Completed!" : "Receipt Details"}</h2>
          <p className="mt-1 text-[12px] text-slate-500">Bill generated from the saved transaction</p>
          <div className="my-6 grid w-full max-w-[430px] grid-cols-4 gap-2 border-y border-slate-200 py-3 text-left">
            <div className="col-span-2"><div className="text-[9px] text-slate-500">Bill No.</div><b className="font-mono text-[10px] text-slate-800">{data.billNo}</b></div>
            <div><div className="text-[9px] text-slate-500">Date &amp; Time</div><b className="text-[10px] text-slate-800">{dateLabel(data.soldAt)}</b></div>
            <div><div className="text-[9px] text-slate-500">Total</div><b className="text-[11px] text-slate-900">{money(data.totalAmount)}</b></div>
          </div>
          <div className="grid w-full max-w-[430px] grid-cols-2 gap-2.5">
            <ActionButton primary onClick={print} className="col-span-2"><Printer size={15} /> Print Receipt</ActionButton>
            <ActionButton onClick={print} className="col-span-2"><FileDown size={15} /> Download PDF</ActionButton>
            <ActionButton onClick={shareWhatsApp}><MessageCircle size={15} className="text-emerald-600" /> WhatsApp</ActionButton>
            <ActionButton onClick={shareEmail}><Mail size={15} className="text-blue-600" /> Email Receipt</ActionButton>
            <ActionButton onClick={onClose} className="col-span-2"><FileText size={15} /> View Bill Details</ActionButton>
            <ActionButton onClick={() => onNotice("Return or exchange should be started from the POS checkout flow.")} className="col-span-2"><RefreshCcw size={15} /> Return / Exchange</ActionButton>
            <ActionButton onClick={() => { onClose(); onNotice("Receipt closed. Start the next sale from POS Checkout."); }} className="col-span-2"><Plus size={15} /> New Sale</ActionButton>
          </div>
        </section>
        <section className="max-h-[92vh] w-full overflow-y-auto bg-slate-100 p-3 md:w-[360px] md:shrink-0 md:p-5">
          <div className="receipt-paper mx-auto min-h-[500px] w-full max-w-[310px] bg-white px-5 py-6 text-[10px] leading-[1.35] text-slate-900 shadow-[0_8px_28px_rgba(15,23,42,.13)]">
            <header className="border-b border-dashed border-slate-400 pb-3 text-center">
              <div className="text-[15px] font-extrabold tracking-wide">{data.store.name}</div>
              <div>{data.store.storeCode}</div>
              <div className="mt-1">{data.store.address}</div>
              <div>{data.store.city}, {data.store.state} - {data.store.postalCode}</div>
              <div className="mt-1">GSTIN: {data.store.gstin}</div>
            </header>
            <div className="space-y-1 border-b border-dashed border-slate-400 py-3">
              <ReceiptMeta label="Bill No." value={data.billNo} />
              <ReceiptMeta label="Invoice No." value={data.invoiceNo || "—"} />
              <ReceiptMeta label="Date &amp; Time" value={dateLabel(data.soldAt)} />
              <ReceiptMeta label="Cashier" value={data.cashierName} />
              <ReceiptMeta label="Sales Person" value={data.salesPerson || "—"} />
              <ReceiptMeta label="Customer" value={data.customer.name} />
            </div>
            <div className="grid grid-cols-[18px_1fr_28px_42px_48px] gap-1 border-b border-slate-400 py-2 font-bold">
              <span>#</span><span>Item</span><span className="text-right">Qty</span><span className="text-right">Price</span><span className="text-right">Total</span>
            </div>
            <div className="border-b border-dashed border-slate-400 py-1">
              {data.items.map((item, index) => <div key={item.id} className="grid grid-cols-[18px_1fr_28px_42px_48px] gap-1 py-1.5">
                <span>{index + 1}</span><div className="min-w-0"><div className="font-semibold">{item.name}</div><div className="text-[8px] text-slate-500">{item.sku}{item.variant ? " | " + item.variant : ""}</div></div>
                <span className="text-right">{item.quantity}</span><span className="text-right">{money(item.price)}</span><span className="text-right font-semibold">{money(item.total)}</span>
              </div>)}
            </div>
            <div className="space-y-1 border-b border-dashed border-slate-400 py-3">
              <ReceiptMeta label="Subtotal" value={money(data.subtotal)} />
              <ReceiptMeta label="Item Discount" value={"- " + money(data.itemDiscount)}} />
              <ReceiptMeta label={"GST (" + data.gstRate + "%)"} value={money(data.gstAmount)} />
              <ReceiptMeta label={"Total (" + itemCount + " items)"} value={money(data.totalAmount)} bold />
            </div>
            <div className="border-b border-dashed border-slate-400 py-3">
              <div className="mb-1 font-bold">Payment Details</div>
              {data.payments.map((payment, index) => <div key={index} className="grid grid-cols-[18px_1fr_auto] gap-1 py-0.5">
                <span>{index + 1}</span><span>{payment.method}{payment.reference ? " / " + payment.reference : ""}</span><b>{money(payment.amount)}</b>
              </div>)}
            </div>
            <div className="pt-4 text-center"><ReceiptBarcode value={data.billNo} /><div className="mt-1 font-mono tracking-[.35em]">{data.billNo}</div><div className="mt-3 text-[9px]">Thank you for shopping with us!</div></div>
          </div>
        </section>
      </>}
    </div>
  </div>;
}

function ReceiptMeta({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return <div className={"flex items-start justify-between gap-3 " + (bold ? "border-t border-slate-400 pt-2 text-[11px] font-bold" : "")}>
    <span>{label}</span><span className="max-w-[62%] text-right font-semibold">{value}</span>
  </div>;
}
