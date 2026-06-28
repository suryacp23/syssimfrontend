import { UserProfile } from "@/components/user-profile";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full flex flex-col flex-1 w-full bg-muted/20">
      {/* Navbar */}
      <header className="h-14 border-b flex items-center justify-between px-4 shrink-0 bg-card">
        <h1 className="font-semibold">System Design Simulator</h1>
        <UserProfile />
      </header>

      {/* Main Content Area - Dashboard */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
