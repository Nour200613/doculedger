import { create } from "zustand";
import { DocumentHistoryItem, SubscriptionUsage } from "@/types";
import { sampleHistoryDocuments, sampleSubscriptionUsage } from "@/lib/mockData";

export interface BatchFileItem {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: "queued" | "processing" | "completed" | "error";
  vendorName?: string;
  total?: number;
}

interface DashboardState {
  documents: DocumentHistoryItem[];
  subscription: SubscriptionUsage;
  searchQuery: string;
  statusFilter: "all" | "verified" | "warning";
  batchQueue: BatchFileItem[];
  autoDeleteRawPdf: boolean;
  orgName: string;
  apiKey: string;

  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: "all" | "verified" | "warning") => void;
  setAutoDeleteRawPdf: (enabled: boolean) => void;
  setOrgName: (name: string) => void;
  addBatchFiles: (files: File[]) => void;
  deleteDocument: (id: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  documents: sampleHistoryDocuments,
  subscription: sampleSubscriptionUsage,
  searchQuery: "",
  statusFilter: "all",
  batchQueue: [
    {
      id: "b-1",
      name: "Microsoft_Azure_Enterprise_Q3.pdf",
      size: "3.4 MB",
      progress: 100,
      status: "completed",
      vendorName: "Microsoft Ireland Operations",
      total: 12450.0,
    },
    {
      id: "b-2",
      name: "Oracle_Database_Licenses_2026.pdf",
      size: "2.1 MB",
      progress: 68,
      status: "processing",
      vendorName: "Oracle Systems Corp",
    },
    {
      id: "b-3",
      name: "Vodafone_Telecom_Monthly_AUG.pdf",
      size: "940 KB",
      progress: 0,
      status: "queued",
    },
  ],
  autoDeleteRawPdf: true,
  orgName: "Vance & Cole Financial Advisors LLP",
  apiKey: "dcl_live_9f823a10e8293bd8491c",

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setAutoDeleteRawPdf: (autoDeleteRawPdf) => set({ autoDeleteRawPdf }),
  setOrgName: (orgName) => set({ orgName }),

  addBatchFiles: (files) => {
    const newItems: BatchFileItem[] = files.map((file, idx) => ({
      id: `batch-${Date.now()}-${idx}`,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      progress: 15,
      status: "processing",
    }));

    set((state) => ({
      batchQueue: [...newItems, ...state.batchQueue],
      subscription: {
        ...state.subscription,
        invoicesUsed: state.subscription.invoicesUsed + files.length,
      },
    }));
  },

  deleteDocument: (id) => {
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id),
    }));
  },
}));
