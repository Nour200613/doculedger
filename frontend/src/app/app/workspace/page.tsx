import { Navbar } from "@/components/common/Navbar";
import { CommandBar } from "@/components/workspace/CommandBar";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { SplitScreen } from "@/components/workspace/SplitScreen";
import { CommandPalette } from "@/components/common/CommandPalette";

export default function WorkspacePage() {
  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden">
      <Navbar />
      <WorkspaceHeader />
      <CommandBar />
      <main className="flex-1 overflow-hidden flex flex-col">
        <SplitScreen />
      </main>
      <CommandPalette />
    </div>
  );
}
