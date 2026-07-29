"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Tooltip } from "radix-ui";
import { useState } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/features/auth/auth-provider";
import { shouldRetryApiRequest } from "@/services/http/api-client";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: shouldRetryApiRequest,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Tooltip.Provider delayDuration={350} skipDelayDuration={100}>
          {children}
          <Toaster
            position="top-right"
            theme="light"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast: "font-sans border-border bg-surface text-ink shadow-float",
                description: "text-muted",
              },
            }}
          />
        </Tooltip.Provider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
