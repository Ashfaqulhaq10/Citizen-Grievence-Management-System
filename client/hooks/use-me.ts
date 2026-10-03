import { useQuery } from "@tanstack/react-query";

interface MeResponse {
  user: { id: number; email: string } | null;
}

export function useMe() {
  return useQuery<MeResponse>({
    queryKey: ["me"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/auth/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to load profile");
      }
      return res.json();
    },
    retry: false,
  });
}
