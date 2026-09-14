import { create } from "zustand";
import { InvoiceData, LineItem, BoundingBox } from "@/types";
import { sampleInvoice } from "@/lib/mockData";

interface WorkspaceState {
  invoice: InvoiceData;
  originalInvoice: InvoiceData;
  highlightedBoundingBox: BoundingBox | null;
  activeHoverCellId: string | null;
  zoom: number;
  page: number;
  totalPages: number;
  rotation: number;
  naturalLanguagePrompt: string;
  appliedPreset: string | null;

  // Actions
  setHighlightedBoundingBox: (box: BoundingBox | null, cellId?: string | null) => void;
  updateLineItem: (id: string, field: keyof LineItem, value: string | number) => void;
  addLineItem: () => void;
  deleteLineItem: (id: string) => void;
  resetInvoice: () => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setPage: (page: number) => void;
  setRotation: (rotation: number | ((prev: number) => number)) => void;
  setPrompt: (prompt: string) => void;
  applyPreset: (presetKey: string) => void;
  loadNewInvoice: (data: InvoiceData) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  invoice: JSON.parse(JSON.stringify(sampleInvoice)),
  originalInvoice: JSON.parse(JSON.stringify(sampleInvoice)),
  highlightedBoundingBox: null,
  activeHoverCellId: null,
  zoom: 1.0,
  page: 1,
  totalPages: 1,
  rotation: 0,
  naturalLanguagePrompt: "",
  appliedPreset: null,

  setHighlightedBoundingBox: (box, cellId = null) => {
    set({
      highlightedBoundingBox: box,
      activeHoverCellId: cellId,
    });
  },

  updateLineItem: (id, field, value) => {
    set((state) => {
      const updatedItems = state.invoice.lineItems.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // Recalculate item numbers if quantity, price or tax rate changed
        if (field === "quantity" || field === "unitPrice" || field === "taxRate") {
          const qty = Number(updated.quantity) || 0;
          const price = Number(updated.unitPrice) || 0;
          const rate = Number(updated.taxRate) || 0;
          const preTax = qty * price;
          updated.taxAmount = parseFloat((preTax * rate).toFixed(2));
          updated.total = parseFloat((preTax + updated.taxAmount).toFixed(2));
        }
        return updated;
      });

      // Recalculate invoice totals
      const subtotal = updatedItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
      const vatTotal = updatedItems.reduce((sum, it) => sum + it.taxAmount, 0);
      const totalAmount = parseFloat((subtotal + vatTotal).toFixed(2));

      // Deterministic math audit check against original stated total
      const statedTotal = state.originalInvoice.totalAmount;
      const mathAuditPassed = Math.abs(totalAmount - statedTotal) <= 0.05;

      return {
        invoice: {
          ...state.invoice,
          lineItems: updatedItems,
          subtotal: parseFloat(subtotal.toFixed(2)),
          vatTotal: parseFloat(vatTotal.toFixed(2)),
          totalAmount,
          mathAuditPassed,
          mathAuditWarning: mathAuditPassed
            ? undefined
            : "Audit Alert: Recalculated items total does not match original stated total!",
        },
      };
    });
  },

  addLineItem: () => {
    set((state) => {
      const newItem: LineItem = {
        id: `li-${Date.now()}`,
        itemDescription: "New Service / Item",
        quantity: 1,
        unitPrice: 100.0,
        taxRate: state.invoice.vatRate,
        taxAmount: parseFloat((100 * state.invoice.vatRate).toFixed(2)),
        total: parseFloat((100 * (1 + state.invoice.vatRate)).toFixed(2)),
        confidenceScores: {
          itemDescription: 1.0,
          quantity: 1.0,
          unitPrice: 1.0,
          taxRate: 1.0,
          total: 1.0,
        },
        boundingBoxes: {},
      };

      const updatedItems = [...state.invoice.lineItems, newItem];
      const subtotal = updatedItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
      const vatTotal = updatedItems.reduce((sum, it) => sum + it.taxAmount, 0);
      const totalAmount = parseFloat((subtotal + vatTotal).toFixed(2));

      return {
        invoice: {
          ...state.invoice,
          lineItems: updatedItems,
          subtotal: parseFloat(subtotal.toFixed(2)),
          vatTotal: parseFloat(vatTotal.toFixed(2)),
          totalAmount,
        },
      };
    });
  },

  deleteLineItem: (id) => {
    set((state) => {
      const updatedItems = state.invoice.lineItems.filter((it) => it.id !== id);
      const subtotal = updatedItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
      const vatTotal = updatedItems.reduce((sum, it) => sum + it.taxAmount, 0);
      const totalAmount = parseFloat((subtotal + vatTotal).toFixed(2));

      return {
        invoice: {
          ...state.invoice,
          lineItems: updatedItems,
          subtotal: parseFloat(subtotal.toFixed(2)),
          vatTotal: parseFloat(vatTotal.toFixed(2)),
          totalAmount,
        },
      };
    });
  },

  resetInvoice: () => {
    set((state) => ({
      invoice: JSON.parse(JSON.stringify(state.originalInvoice)),
      highlightedBoundingBox: null,
      activeHoverCellId: null,
      appliedPreset: null,
    }));
  },

  setZoom: (zoomOrFn) => {
    set((state) => ({
      zoom: typeof zoomOrFn === "function" ? zoomOrFn(state.zoom) : zoomOrFn,
    }));
  },

  setPage: (page) => set({ page }),

  setRotation: (rotationOrFn) => {
    set((state) => ({
      rotation: typeof rotationOrFn === "function" ? rotationOrFn(state.rotation) : rotationOrFn,
    }));
  },

  setPrompt: (naturalLanguagePrompt) => set({ naturalLanguagePrompt }),

  applyPreset: (presetKey) => {
    set((state) => {
      let updatedItems = [...state.invoice.lineItems];

      if (presetKey === "vat14") {
        updatedItems = updatedItems.map((item) => {
          const qty = item.quantity;
          const price = item.unitPrice;
          const taxAmount = parseFloat((qty * price * 0.14).toFixed(2));
          return {
            ...item,
            taxRate: 0.14,
            taxAmount,
            total: parseFloat((qty * price + taxAmount).toFixed(2)),
          };
        });
      }

      const subtotal = updatedItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
      const vatTotal = updatedItems.reduce((sum, it) => sum + it.taxAmount, 0);

      return {
        appliedPreset: presetKey,
        invoice: {
          ...state.invoice,
          vatRate: 0.14,
          vatTotal: parseFloat(vatTotal.toFixed(2)),
          subtotal: parseFloat(subtotal.toFixed(2)),
          totalAmount: parseFloat((subtotal + vatTotal).toFixed(2)),
          lineItems: updatedItems,
        },
      };
    });
  },

  loadNewInvoice: (data) => {
    set({
      invoice: JSON.parse(JSON.stringify(data)),
      originalInvoice: JSON.parse(JSON.stringify(data)),
      highlightedBoundingBox: null,
      activeHoverCellId: null,
      page: 1,
      zoom: 1.0,
      appliedPreset: null,
    });
  },
}));
