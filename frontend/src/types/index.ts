export interface BoundingBox {
  page: number;
  x: number; // percentage from left (0 to 100)
  y: number; // percentage from top (0 to 100)
  width: number; // percentage width
  height: number; // percentage height
  label?: string;
}

export interface LineItem {
  id: string;
  itemDescription: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // e.g. 0.14 for 14% VAT
  taxAmount: number;
  total: number;
  confidenceScores: {
    itemDescription: number;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
  };
  boundingBoxes: {
    itemDescription?: BoundingBox;
    quantity?: BoundingBox;
    unitPrice?: BoundingBox;
    taxRate?: BoundingBox;
    total?: BoundingBox;
  };
}

export interface InvoiceData {
  id: string;
  fileName: string;
  fileSize: string;
  pageCount: number;
  uploadedAt: string;
  vendorName: string;
  vendorVatId?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  vatRate: number;
  vatTotal: number;
  totalAmount: number;
  overallConfidence: number; // e.g. 0.94
  mathAuditPassed: boolean;
  mathAuditWarning?: string;
  lineItems: LineItem[];
  headerBoundingBoxes: {
    vendorName?: BoundingBox;
    invoiceNumber?: BoundingBox;
    invoiceDate?: BoundingBox;
    dueDate?: BoundingBox;
    totalAmount?: BoundingBox;
    vatTotal?: BoundingBox;
  };
}

export interface DocumentHistoryItem {
  id: string;
  fileName: string;
  fileSize: string;
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  currency: string;
  status: "verified" | "warning" | "failed";
  confidenceScore: number;
  lineItemCount: number;
  downloadUrl?: string;
}

export interface SubscriptionUsage {
  planName: "Freemium" | "Individual Accountant" | "B2B Enterprise";
  invoicesUsed: number;
  monthlyLimit: number;
  periodEnd: string;
  batchUploadAvailable: boolean;
}

export type Locale = "en" | "ar";
export type Theme = "light" | "dark";
