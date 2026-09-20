import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { connectionManager } from "./connectionManager";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Se a URL já é completa (com protocolo), usar diretamente
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const headers: Record<string, string> = {
      "bypass-tunnel-reminder": "true",
      "User-Agent": "SchoolManager-App/1.0",
      "X-Bypass-Tunnel": "true",
      "X-App-Source": "mobile-app"
    };
    
    if (data) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  }

  // Para URLs relativas, usar o connection manager
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const res = await connectionManager.makeRequest(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    // Se a URL já é completa (com protocolo), usar diretamente
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const res = await fetch(url, {
        credentials: "include",
        headers: {
          "bypass-tunnel-reminder": "true",
          "User-Agent": "SchoolManager-App/1.0",
          "X-Bypass-Tunnel": "true",
          "X-App-Source": "mobile-app"
        }
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    }

    // Para URLs relativas, usar o connection manager
    const res = await connectionManager.makeRequest(url, {
      method: 'GET'
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
