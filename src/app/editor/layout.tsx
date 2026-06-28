import { UserProfile } from "@/components/user-profile";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CanvasSidebar } from "@/components/canvas/CanvasSidebar";
import { NodeProperties } from "@/components/canvas/NodeProperties";
import { SaveIndicator } from "@/components/canvas/SaveIndicator";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col w-full overflow-hidden">
      {/* Navbar */}
      <header className="h-14 border-b flex items-center justify-between px-4 shrink-0 bg-card z-10 relative">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" passHref>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <div className="h-4 w-px bg-border"></div>
          <h1 className="font-semibold">System Design Simulator</h1>
          <div className="h-4 w-px bg-border"></div>
          <SaveIndicator />
        </div>
        <UserProfile />
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <CanvasSidebar />

        {/* Canvas (React Flow) */}
        <main className="flex-1 relative bg-muted/20">
          {children}
        </main>

        {/* Properties Panel */}
        <NodeProperties />
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-8 border-t flex items-center px-4 text-xs text-muted-foreground shrink-0 bg-card">
        Status: Ready
      </footer>
    </div>
  );
}
