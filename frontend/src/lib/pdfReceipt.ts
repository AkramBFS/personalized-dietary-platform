"use client";

import { toast } from "sonner";
import { ClientInvoice } from "./client/service";
import { NutritionistInvoice } from "./api";

function triggerPrintWindow(title: string, contentHtml: string): void {
  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (!printWindow) {
    toast.error("Popup blocker detected. Please allow popups to download or print your receipt.");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        * {
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        body {
          color: #1a1a1a;
          line-height: 1.5;
          margin: 0;
          padding: 24px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
          margin-bottom: 24px;
        }
        .brand {
          font-size: 24px;
          font-weight: 800;
          color: #059669;
          letter-spacing: -0.5px;
        }
        .brand-sub {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .doc-title {
          font-size: 20px;
          font-weight: 700;
          text-align: right;
          color: #111827;
        }
        .badge {
          display: inline-block;
          background: #ecfdf5;
          color: #047857;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 9999px;
          text-transform: uppercase;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 32px;
          background: #f9fafb;
          border: 1px solid #f3f4f6;
          border-radius: 8px;
          padding: 16px;
        }
        .meta-item label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          color: #6b7280;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .meta-item span {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 32px;
        }
        th {
          background: #f3f4f6;
          text-align: left;
          padding: 12px;
          font-size: 12px;
          text-transform: uppercase;
          color: #4b5563;
          border-bottom: 1px solid #e5e7eb;
        }
        td {
          padding: 14px 12px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
        }
        .totals {
          margin-left: auto;
          width: 300px;
          border-top: 2px solid #e5e7eb;
          padding-top: 12px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          margin-bottom: 8px;
        }
        .total-row.grand {
          font-size: 18px;
          font-weight: 800;
          color: #059669;
          border-top: 1px solid #e5e7eb;
          padding-top: 8px;
          margin-top: 8px;
        }
        .footer {
          margin-top: 48px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #9ca3af;
          text-align: center;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      ${contentHtml}
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

export function printClientReceipt(invoice: ClientInvoice): void {
  toast.info("Generating PDF receipt...");
  const dateFormatted = new Date(invoice.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeFormatted = new Date(invoice.created_at).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemName =
    invoice.item_type?.toUpperCase() === "CONSULTATION"
      ? "Nutritional Consultation"
      : invoice.item_type?.toUpperCase() === "SUBSCRIPTION"
      ? "Premium Membership Subscription"
      : "Personalized Dietary Plan";

  const content = `
    <div class="header">
      <div>
        <div class="brand">SVMB NutriPlatform</div>
        <div class="brand-sub">Personalized Dietary Care</div>
      </div>
      <div>
        <div class="doc-title">PAYMENT RECEIPT</div>
        <div style="text-align: right; margin-top: 6px;">
          <span class="badge">Paid Successfully</span>
        </div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <label>Receipt / Transaction #</label>
        <span style="font-family: monospace;">${invoice.transaction_number || "TRX-" + invoice.id}</span>
      </div>
      <div class="meta-item">
        <label>Date & Time</label>
        <span>${dateFormatted} at ${timeFormatted}</span>
      </div>
      <div class="meta-item">
        <label>Billed To (Client)</label>
        <span>${invoice.client_username ? "@" + invoice.client_username : "Valued Client"}</span>
      </div>
      <div class="meta-item">
        <label>Service Provider</label>
        <span>${invoice.nutritionist_username ? "@" + invoice.nutritionist_username : "NutriPlatform Certified Practitioner"}</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Type</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${itemName}</strong></td>
          <td>${invoice.item_type || "Service"}</td>
          <td style="text-align: right; font-weight: 600;">$${(invoice.total_paid ?? 0).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span>Subtotal</span>
        <span>$${(invoice.total_paid ?? 0).toFixed(2)}</span>
      </div>
      <div class="total-row">
        <span>Tax & Processing</span>
        <span>$0.00</span>
      </div>
      <div class="total-row grand">
        <span>Total Paid (USD)</span>
        <span>$${(invoice.total_paid ?? 0).toFixed(2)}</span>
      </div>
    </div>

    <div class="footer">
      Thank you for choosing NutriPlatform. This receipt serves as proof of payment.<br/>
      For billing inquiries, contact support at support@nutriplatform.local
    </div>
  `;

  triggerPrintWindow(`Receipt_${invoice.transaction_number || invoice.id}`, content);
}

export function printNutritionistStatement(invoice: NutritionistInvoice): void {
  toast.info("Generating earnings statement...");
  const dateFormatted = new Date(invoice.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const itemName =
    invoice.item_type?.toUpperCase() === "CONSULTATION"
      ? "Nutritional Consultation Session"
      : invoice.item_type?.toUpperCase() === "SUBSCRIPTION"
      ? "Client Subscription Revenue Share"
      : "Personalized Meal Plan Purchase";

  const totalPaid = invoice.total_paid ?? 0;
  const commissionRate = invoice.commission_rate ?? 20;
  const commissionFee = totalPaid * (commissionRate / 100);
  const netEarnings = invoice.net_earnings ?? totalPaid - commissionFee;

  const content = `
    <div class="header">
      <div>
        <div class="brand">SVMB NutriPlatform</div>
        <div class="brand-sub">Practitioner Earnings Statement</div>
      </div>
      <div>
        <div class="doc-title">EARNINGS STATEMENT</div>
        <div style="text-align: right; margin-top: 6px;">
          <span class="badge">Disbursed / Credited</span>
        </div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <label>Transaction Reference</label>
        <span style="font-family: monospace;">${invoice.transaction_number || "TRX-" + invoice.id}</span>
      </div>
      <div class="meta-item">
        <label>Disbursement Date</label>
        <span>${dateFormatted}</span>
      </div>
      <div class="meta-item">
        <label>Client Reference</label>
        <span>${invoice.client_username ? "@" + invoice.client_username : "Client"}</span>
      </div>
      <div class="meta-item">
        <label>Platform Commission Rate</label>
        <span>${commissionRate}%</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Service Item</th>
          <th>Gross Paid</th>
          <th>Platform Fee (${commissionRate}%)</th>
          <th style="text-align: right;">Net Earnings</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${itemName}</strong></td>
          <td>$${totalPaid.toFixed(2)}</td>
          <td style="color: #dc2626;">-$${commissionFee.toFixed(2)}</td>
          <td style="text-align: right; font-weight: 700; color: #059669;">$${netEarnings.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span>Gross Billed</span>
        <span>$${totalPaid.toFixed(2)}</span>
      </div>
      <div class="total-row">
        <span>Platform Commission (${commissionRate}%)</span>
        <span style="color: #dc2626;">-$${commissionFee.toFixed(2)}</span>
      </div>
      <div class="total-row grand">
        <span>Net Practitioner Payout</span>
        <span>$${netEarnings.toFixed(2)}</span>
      </div>
    </div>

    <div class="footer">
      SVMB NutriPlatform Practitioner Finance & Tax Reporting.<br/>
      Net funds are deposited according to your configured practitioner payout schedule.
    </div>
  `;

  triggerPrintWindow(`Statement_${invoice.transaction_number || invoice.id}`, content);
}
