import { Navbar } from "@/components/common/Navbar";
import { UsageMeter } from "@/components/dashboard/UsageMeter";
import { BatchUploadZone } from "@/components/dashboard/BatchUploadZone";
import { DocumentHistoryTable } from "@/components/dashboard/DocumentHistoryTable";
import { OrganizationSettings } from "@/components/dashboard/OrganizationSettings";
import { Footer } from "@/components/common/Footer";
import { CommandPalette } from "@/components/common/CommandPalette";

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <UsageMeter />
        <BatchUploadZone />
        <DocumentHistoryTable />
        <OrganizationSettings />
      </main>
      <Footer />
      <CommandPalette />
    </div>
  );
}
