"use client";

import { useAuthStore } from "@/store/AuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user, token, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  if (!token || !user) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <div className="bg-card p-6 rounded-lg border shadow-sm max-w-xl">
        <h2 className="text-xl font-semibold mb-2">Welcome, {user.name}!</h2>
        <p className="text-muted-foreground mb-4">Email: {user.email}</p>
        
        <Button variant="destructive" onClick={() => {
          logout();
          router.push("/login");
        }}>
          Logout
        </Button>
      </div>
    </div>
  );
}
