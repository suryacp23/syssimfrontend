"use client";

import { useAuthStore } from "@/store/AuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (token) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [token, router]);

  return <div className="p-8">Loading...</div>;
}
