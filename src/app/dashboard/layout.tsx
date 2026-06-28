import { UserProfile } from "@/components/user-profile";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full flex flex-col flex-1 w-full">
      {/* Navbar */}
      <header className="h-14 border-b flex items-center justify-between px-4 shrink-0 bg-card">
        <h1 className="font-semibold">System Design Simulator</h1>
        <UserProfile />
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r p-4 shrink-0 bg-card overflow-y-auto">
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase">Components</h2>
          {/* Component list will go here */}
        </aside>

        {/* Canvas (React Flow) */}
        <main className="flex-1 relative bg-muted/20">
          {children}
        </main>

        {/* Properties Panel */}
        <aside className="w-80 border-l p-4 shrink-0 bg-card overflow-y-auto">
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase">Properties</h2>
          {/* Properties will go here */}
        </aside>
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-8 border-t flex items-center px-4 text-xs text-muted-foreground shrink-0 bg-card">
        Status: Ready
      </footer>
    </div>
  );
}
