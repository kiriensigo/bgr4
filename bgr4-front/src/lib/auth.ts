import { useAuth } from "@/contexts/AuthContext";

export async function getAuthHeaders(): Promise<Record<string, string>> {
  // ローカルストレージから認証情報を取得
  const accessToken = localStorage.getItem("access-token");
  const client = localStorage.getItem("client");
  const uid = localStorage.getItem("uid");
  const expiry = localStorage.getItem("expiry");
  const tokenType = localStorage.getItem("token-type");

  if (!accessToken || !client || !uid) {
    return {};
  }

  return {
    "access-token": accessToken,
    client: client,
    uid: uid,
    expiry: expiry || "",
    "token-type": tokenType || "Bearer",
  };
}
