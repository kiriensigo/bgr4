"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WishlistPage() {
  const router = useRouter();

  // やりたいリスト機能は一時停止中のため、ホームページにリダイレクト
  useEffect(() => {
    router.push("/");
  }, [router]);

  return null;
}
