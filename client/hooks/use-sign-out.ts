import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface SignOutOptions {
  message?: string;
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useCallback(
    async (options?: SignOutOptions) => {
      localStorage.removeItem("token");
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch (error) {
        console.error("Failed to call logout endpoint", error);
      }

      queryClient.setQueryData(["me"], { user: null });

      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ["me"] }),
        queryClient.invalidateQueries({ queryKey: ["my-complaints"] }),
        queryClient.invalidateQueries({ queryKey: ["area-search"] }),
      ]);

      if (options?.message) {
        toast.success(options.message);
      }

    },
    [queryClient],
  );
}
